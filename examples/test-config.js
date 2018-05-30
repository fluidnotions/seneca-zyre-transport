var iface1 = "Wireless Network Connection";
var iface2 = "Local Area Connection";

var config1 = { name: "test1", headers: { terminalId: "term1" }, iface:  iface1, debug: {ztrans: true}};
var config2 = { name: "test2", headers: { terminalId: "term2" }, iface: iface1, debug: {ztrans: true} }
var config1b = { name: "test1", headers: { terminalId: "term1" }, iface:  iface2, debug: {ztrans: true}};
var config2b = { name: "test2", headers: { terminalId: "term2" }, iface: iface2, debug: {ztrans: true} };

module.exports = {
    config1,
    config2, 
    config1b,
    config2b
}

