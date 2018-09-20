'use strict'

const _ = require('lodash')
const Zyre = require('zyre.js');
const DEFAULT_SERVICE_CHANNEL = "plugin-service-channel"


//standalone for use in plain js -- for discovery testing
module.exports = function (options) {
    let seneca = this
    seneca.depends('balance-client')
    let plugin = 'zyre-transport'
    let transport_utils = seneca.export('transport/utils');
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
                expired: 300000, // Timeout after which a not responding peer gets disconnected
                port: 49152,      // Port for incoming messages, will be incremented if already in use
                bport: 5670,      // Discovery beacon broadcast port
                binterval: 1000,  // Discovery beacon broadcast interval,
                debug: {
                    ztrans: false, //verbose zyre.js logging
                }
            }
        },
        so.transport,
        options)

    let zyre, myZyreIdentity, collectivePeerPatternsDict = {};//{zyrePeerId:zyrePeerId, patterns:seneca.list()}
    try {
        zyre = new Zyre(options.zyre);
        zyre.setEncoding('utf8');
        let zyrePeerId = zyre.getIdentity()
        myZyreIdentity = { originIp: zyre._ifaceData.address, terminalId: options.zyre.headers.terminalId, zyrePeerId: zyrePeerId, name: options.zyre.name };
        if (options.zyre.debug.ztrans) {
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
                if (group !== "stayalive" && group !== "peer-pattern-collector") console.log(me, ", on shout: ", JSON.stringify({ name, group }))
            })
            zyre.on('whisper', (id, name, message) => {
                // seneca.log.debug
                console.log(me, "on whisper: ", JSON.stringify({ name }))
            });


        }
        zyre.start().then(() => {
            zyre.join(DEFAULT_SERVICE_CHANNEL)
            //need this else zeromq diconnects
            zyre.join("stayalive");
            let i = setInterval(() => {
                zyre.shout("stayalive", "ping");
            }, 1000)
            collect_peer_patterns();
        });
    } catch (err) {
        console.error(err.message)
        return;
    }

    seneca.add({ role: 'transport', type: 'zyre', cmd: 'getPeerEndpoints'}, get_peer_endpoints);
    seneca.add({ role: 'transport', type: 'zyre', cmd: 'getPeerPatterns'}, get_peer_patterns);
    seneca.add({ role: 'transport', hook: 'listen', type: 'zyre' }, transport_hook_listen)
    seneca.add({ role: 'transport', hook: 'client', type: 'zyre' }, transport_hook_client)

    function get_peer_endpoints(msg, done) {
        if (options.zyre.debug.ztrans) console.log("_.values(zyre._zyrePeers._peers): ", _.values(zyre._zyrePeers._peers));
        let peerIps = _.values(zyre._zyrePeers._peers).filter(p => p._connected).map(p => p._endpoint.split('/')[2]).concat([zyre._ifaceData.address]);
        done(null, {
            peerIps: peerIps
        })
    }

    //act to self should conatin all the patterns collected in collectivePeerPatternsDict
    function get_peer_patterns(msg, done) {
        done(null, collectivePeerPatternsDict)
    }

    //have to do it this way, if your own instance contains a pattern you can't get the act broadcast to go over the mesh
    function collect_peer_patterns() {
        zyre.join("peer-pattern-collector");
        let i = setInterval(() => {
            if (seneca && seneca.list) {
                let filteredList = seneca.list().filter(p => !p.role || (p.role !== 'transport' && p.role !== 'seneca'  && p.role !== 'options')).filter(p => !_.isEmpty(p));
                let ppi = {zyrePeerId: myZyreIdentity.zyrePeerId, patterns: filteredList};
                // console.log("shouting out ppi: ", ppi)
                zyre.shout("peer-pattern-collector", JSON.stringify(ppi))
            }
        }, 1000)
        zyre.on('shout', (id, name, message, group) => {
            if (group === "peer-pattern-collector") {
                let ppi = JSON.parse(message);
                // console.log("hearing in ppi: ", ppi)
                collectivePeerPatternsDict[ppi.zyrePeerId] = ppi["patterns"];
            }
        })
    }

    function transport_hook_listen(args, done) {
        let seneca = this
        let type = args.type
        let listen_options = seneca.util.clean(_.extend({}, options[type], args))

        zyre.on('shout', (id, name, message, group) => {
            if (group === DEFAULT_SERVICE_CHANNEL) {
                if (options.zyre.debug.ztrans) console.log(myZyreIdentity.name, " recieved broadcast  from: ", name)
                //every message should have a zyrePeerId added into it via ack
                let data = transport_utils.parseJSON(seneca, 'listen-' + type, message)
                let originZyrePeer = data.originZyrePeer;
                if (!originZyrePeer) {
                    seneca.log.error('transport', 'zyre', new Error('incoming message has no originZyrePeer'))
                }

                transport_utils.handle_request(seneca, data, listen_options, function (out) {
                    if (out == null) {
                        seneca.log.info("no result")
                    } else {
                        let outstr = transport_utils.stringifyJSON(seneca, 'listen-' + type, out)
                        if (options.zyre.debug.ztrans) console.log("sending direct to: ", originZyrePeer)
                        zyre.whisper(originZyrePeer.zyrePeerId, outstr)
                    }
                })
            }
        })

        //don't think we need this except we could have a diff group for every pin -- default is just seneca_any
        transport_utils.listen_topics(seneca, args, listen_options, function (topic) {
            seneca.log.debug('listen', 'subscribe', topic + '_act', listen_options, seneca)
            // zyre.join(topic);
        })

        seneca.add('role:seneca,cmd:close', function (close_args, done) {
            let closer = this

            zyre.stop()
            closer.prior(close_args, done)
        })

        seneca.log.info('listen', 'open', listen_options, seneca)

        done()
    }

    function transport_hook_client(args, clientdone) {
        if (options.zyre.debug.ztrans) console.log("inside { role: 'transport', hook: 'client', type: 'zyre' }")
        let seneca = this
        let type = args.type
        let client_options = seneca.util.clean(_.extend({}, options[type], args))

        //if there are pins calls make_pinclient else calls make_anyclient
        transport_utils.make_client(make_send, client_options, clientdone)

        function make_send(spec, topic, send_done) {
            if (options.zyre.debug.ztrans) console.log("inside make_send")

            zyre.on('whisper', (id, name, message) => {
                if (options.zyre.debug.ztrans) console.log("recieved direct msg from ", name)
                let input = transport_utils.parseJSON(seneca, 'client-' + type, message)
                override_transport_util_handle_response(seneca, input, client_options)
            });

            seneca.log.debug('client', 'subscribe', topic + '_res', client_options, seneca)
            send_done(null, function (args, done, meta) {
                let outmsg = transport_utils.prepare_request(this, args, done, meta)
                //add in myZyreIdentity
                outmsg.originZyrePeer = myZyreIdentity;
                let outstr = transport_utils.stringifyJSON(seneca, 'client-' + type, outmsg)
                zyre.shout(DEFAULT_SERVICE_CHANNEL, outstr);
            })

            seneca.add('role:seneca,cmd:close', function (close_args, done) {
                let closer = this

                zyre.stop()
                closer.prior(close_args, done)
            })
        }
    }

    function override_transport_util_handle_response(seneca, data, client_options) {
        if(!data) data = {};
        data.time = data.time || {}
        data.time.client_recv = Date.now()
        data.sync = void 0 === data.sync ? true : data.sync

        if (data.kind !== 'res') {
            if (transport_utils._context.options.warn.invalid_kind) {
                seneca.log.warn('client', 'invalid_kind_res', client_options, data)
            }
            return false
        }

        if (data.id === null) {
            if (transport_utils._context.options.warn.no_message_id) {
                seneca.log.warn('client', 'no_message_id', client_options, data)
            }
            return false
        }

        if (seneca.id !== data.origin) {
            if (transport_utils._context.options.warn.invalid_origin) {
                seneca.log.warn('client', 'invalid_origin', client_options, data)
            }
            return false
        }

        var err = null
        var result = null

        if (data.error) {
            err = new Error(data.error.message)

            _.each(data.error, function (value, key) {
                err[key] = value
            })

            if (!data.sync) {
                seneca.log.warn('client', 'unexcepted_async_error', client_options, data, err)
                return true
            }
        }
        else {
            result = transport_utils.handle_entity(seneca, data.res)
        }

        if (!data.sync) {
            return true
        }

        var callmeta = transport_utils._context.callmap.get(data.id)

        if (callmeta) {
            //the first one deletes it, second one returns false and that is why only one response can be recieved in default implementation
            //FIXME: this does create a problem though when in the lru-cache callmap in seneca-transport module cleared of the msg id, or does it even matter if this is
            //always unique?
            if (!data.res.observed$) transport_utils._context.callmap.del(data.id)

        }
        else {
            if (transport_utils._context.options.warn.unknown_message_id) {
                seneca.log.warn('client', 'unknown_message_id', client_options, data)
            }
            return false
        }


        var actinfo = {
            id: data.id,
            accept: data.accept,
            track: data.track,
            time: data.time
        }

        transport_utils.callmeta({
            callmeta: callmeta,
            err: err,
            result: result,
            actinfo: actinfo,
            seneca: seneca,
            client_options: client_options,
            data: data
        })

        return true
    }



    return {
        name: plugin
    }
}
