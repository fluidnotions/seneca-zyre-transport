'use strict'

const _ = require('lodash')
const Zyre = require('zyre.js');
const DEFAULT_SERVICE_CHANNEL = "plugin-service-channel"

//standalone for use in plain js -- for discovery testing
module.exports = function (options) {
    let seneca = this
    let plugin = 'zyre-transport'
    let transport_utils = seneca.export('transport/utils')


    let so = seneca.options()

    options = seneca.util.deepextend(
        {
            zyre: {
                name: undefined,      // Name of the zyre node - required in constructor zyreConfig
                iface: 'eth0',    // Network interface
                headers: {        // Headers will be sent on every new connection
                    terminalId: undefined //required in constructor zyreConfig
                },
                evasive: 5000,    // Timeout after which the local node will try to ping a not responding peer
                expired: 2147483647, //maximum positive value for a 32-bit signed binary integer  // Timeout after which a not responding peer gets disconnected
                port: 49152,      // Port for incoming messages, will be incremented if already in use
                bport: 5670,      // Discovery beacon broadcast port
                binterval: 1000,  // Discovery beacon broadcast interval,
                testing: false
            }
        },
        so.transport,
        options)

    let zyre, myZyreIdentity;
    try {
        zyre = new Zyre(options.zyre);
        zyre.setEncoding('utf8');
        let zyrePeerId = zyre.getIdentity()
        myZyreIdentity = { originIp: zyre._ifaceData.address, terminalId: options.zyre.headers.terminalId, zyrePeerId: zyrePeerId, name: options.zyre.name };
        if (options.zyre.testing) {
            // let me = options.zyre.headers.terminalId;
            let me = options.zyre.name;
            zyre.on('connect', (id, name, headers) => {
                // seneca.log.debug
                 console.log(me, ", on connect: ", JSON.stringify({ name, headers }))
            })
            zyre.on('disconnect', (id, name) => {
                // seneca.log.debug
                 console.log(me, ", on disconnect: ", JSON.stringify({ name }))
            });
            zyre.on('expired', (id, name) => {
                // seneca.log.debug
                 console.log(me, ", on expired: ", JSON.stringify({ name }))
            });
            zyre.on('join', (id, name, group) => {
                // seneca.log.debug
                 console.log("on join: ", JSON.stringify({ name }))
            });
            zyre.on('leave', (id, name, group) => {
                // seneca.log.debug
                 console.log("on leave: ", JSON.stringify({ name }))
            });
            zyre.on('shout', (id, name, message, group) => {
                // seneca.log.debug
                if(group !== "stayalive")  console.log(me, ", on shout: ", JSON.stringify({ name, group }))
            })
            zyre.on('whisper', (id, name, message) => {
                // seneca.log.debug
                 console.log(me, "on whisper: ", JSON.stringify({ name }))
            });


        }
        zyre.start().then(() => {
            zyre.join(DEFAULT_SERVICE_CHANNEL);
            //need this else zeromq diconnects
            zyre.join("stayalive");
            let i = setInterval(() => {
                zyre.shout("stayalive", "ping");
            }, 1000)
        });
    } catch (err) {
        console.error(err.message)
        return;
    }

    seneca.add({ role: 'transport', type: 'zyre', cmd: 'getPeerIps', }, function (msg, done) {
        let peerIps = _.uniq(_.values(zyre._zyrePeers._peers).filter(p => p._connected).map(p => p._endpoint.split('/')[2].split(':')[0]).concat([zyre._ifaceData.address]));
        done(null, {
            peerIps: peerIps
        })
    })
    seneca.add({ role: 'transport', hook: 'listen', type: 'zyre' }, function (args, done) {
        let seneca = this
        let type = args.type
        let listen_options = seneca.util.clean(_.extend({}, options[type], args))

        zyre.on('shout', (id, name, message, group) => {
            if (group === DEFAULT_SERVICE_CHANNEL) {
                if (options.zyre.testing) console.log("broadcast recieved from: ", name)
                //every message should have a zyrePeerId added into it via ack
                let data = transport_utils.parseJSON(seneca, 'listen-' + type, message)
                let originZyrePeer = data.originZyrePeerId;
                if (!originZyrePeer) {
                    seneca.log.error('transport', 'zyre', new Error('incoming message has no originZyrePeerId'))
                }
                
                transport_utils.handle_request(seneca, data, listen_options, function (out) {
                    if (out == null) {
                        seneca.log.info("no result")
                    } else {
                        let outstr = transport_utils.stringifyJSON(seneca, 'listen-' + type, out)
                        if (options.zyre.testing) console.log("sending direct to: ", originZyrePeer)
                        zyre.whisper(originZyrePeer.zyrePeerId, outstr)
                    }
                })
            }
        })

        //don't think we need this except we could have a diff group for every pin
        transport_utils.listen_topics(seneca, args, listen_options, function (topic) {
            seneca.log.debug('listen', 'subscribe', topic + '_act', listen_options, seneca)
        })

        seneca.add('role:seneca,cmd:close', function (close_args, done) {
            let closer = this

            zyre.stop()
            closer.prior(close_args, done)
        })

        seneca.log.info('listen', 'open', listen_options, seneca)

        done()
    })

    seneca.add({ role: 'transport', hook: 'client', type: 'zyre' }, function (args, clientdone) {
        if (options.zyre.testing) console.log("inside { role: 'transport', hook: 'client', type: 'zyre' }")
        let seneca = this
        let type = args.type
        let client_options = seneca.util.clean(_.extend({}, options[type], args))

        //if there are pins calls make_pinclient else calls make_anyclient
        transport_utils.make_client(make_send, client_options, clientdone)

        function make_send(spec, topic, send_done) {
            if (options.zyre.testing) console.log("inside make_send")
        
            zyre.on('whisper', (id, name, message) => {
                if (options.zyre.testing) console.log("recieved direct msg")
                let input = transport_utils.parseJSON(seneca, 'client-' + type, message)
                transport_utils.handle_response(seneca, input, client_options)
            });

            seneca.log.debug('client', 'subscribe', topic + '_res', client_options, seneca)
            send_done(null, function (args, done, meta) {
                let outmsg = transport_utils.prepare_request(this, args, done, meta)
                //add in myZyreIdentity
                outmsg.originZyrePeerId = myZyreIdentity;
                let outstr = transport_utils.stringifyJSON(seneca, 'client-' + type, outmsg)
                zyre.shout(DEFAULT_SERVICE_CHANNEL, outstr);
            })

            seneca.add('role:seneca,cmd:close', function (close_args, done) {
                let closer = this

                zyre.stop()
                closer.prior(close_args, done)
            })
        }
    })

    return {
        name: plugin
    }
}
