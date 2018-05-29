// local net interfaces:  { 'Local Area Connection':
//    [ { address: 'fe80::2c6e:1bd3:3329:acf',
//        netmask: 'ffff:ffff:ffff:ffff::',
//        family: 'IPv6',
//        mac: 'ec:f4:bb:02:30:f9',
//        scopeid: 13,
//        internal: false,
//        cidr: 'fe80::2c6e:1bd3:3329:acf/64' },
//      { address: '10.50.113.218',
//        netmask: '255.255.0.0',
//        family: 'IPv4',
//        mac: 'ec:f4:bb:02:30:f9',
//        internal: false,
//        cidr: '10.50.113.218/16' } ],
//   'VirtualBox Host-Only Network':
//    [ { address: 'fe80::942a:f13e:9b18:d3c0',
//        netmask: 'ffff:ffff:ffff:ffff::',
//        family: 'IPv6',
//        mac: '0a:00:27:00:00:0b',
//        scopeid: 11,
//        internal: false,
//        cidr: 'fe80::942a:f13e:9b18:d3c0/64' },
//      { address: '192.168.56.1',
//        netmask: '255.255.255.0',
//        family: 'IPv4',
//        mac: '0a:00:27:00:00:0b',
//        internal: false,
//        cidr: '192.168.56.1/24' } ],
//   'Loopback Pseudo-Interface 1':
//    [ { address: '::1',
//        netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
//        family: 'IPv6',
//        mac: '00:00:00:00:00:00',
//        scopeid: 0,
//        internal: true,
//        cidr: '::1/128' },
//      { address: '127.0.0.1',
//        netmask: '255.0.0.0',
//        family: 'IPv4',
//        mac: '00:00:00:00:00:00',
//        internal: true,
//        cidr: '127.0.0.1/8' } ] }

var iface1 = "Wireless Network Connection";
var iface2 = "Local Area Connection";

var config1 = { name: "test1", headers: { terminalId: "term1" }, iface:  iface1, testing: true};
var config2 = { name: "test2", headers: { terminalId: "term2" }, iface: iface1, testing: true };

var config1b = { name: "test1", headers: { terminalId: "term1" }, iface:  iface2, testing: true};
var config2b = { name: "test2", headers: { terminalId: "term2" }, iface: iface2, testing: true };

module.exports = {
    config1,
    config2, 
    config1b,
    config2b
}