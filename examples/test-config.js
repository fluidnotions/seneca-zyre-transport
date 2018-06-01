var iface2 = "Wireless Network Connection";
var iface2 = "Local Area Connection";

var config1 = { name: "test1", headers: { terminalId: "term1" }, iface:  iface2, debug: {ztrans: true}};
var config2 = { name: "test2", headers: { terminalId: "term2" }, iface: iface2, debug: {ztrans: true} }
var config3 = { name: "test3", headers: { terminalId: "term3" }, iface: iface2, debug: {ztrans: true} }
var config4 = { name: "test4", headers: { terminalId: "term4" }, iface: iface2, debug: {ztrans: true} }

module.exports = {
    config1,
    config2, 
    config3,
    config4
}

