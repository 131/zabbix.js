"use strict";

const net = require('net');
const os  = require('os');
const defer = require('nyks/promise/defer');
const drain = require('nyks/stream/drain');
const fs    = require('fs');
const ini   = require('ini');

const zabbix_conf_path = '/etc/zabbix/zabbix_agentd.conf';

const ZBXD_HEADER  = new Buffer('ZBXD\x01');

class ZabbixSender {

  constructor(opts) {
    var host = 'localhost';

    if(fs.existsSync(zabbix_conf_path))
      host = ini.parse(fs.readFileSync(zabbix_conf_path, 'utf-8')).Server;

    if(typeof opts == "string")
      opts = {host : opts};

    Object.assign(this, {
      host,
      port : 10051,
      timeout : 5000,
      hostname :  os.hostname(),
    }, opts);
  }



  async sendv(host, key, value) /**
  * @param string [host=]
  */ {

    var args = [].slice.apply(arguments);
    value = args.pop();
    key   = args.pop();
    host = args.pop() || this.hostname;

    return this.send([{host, key, value}]);
  }



  async send(items) /**
  * format items as [ {host, key, value} ]
  */ {

    var payload = ZabbixSender.prepareData(items);

    var timeout = defer();
    var i = setTimeout(timeout.reject, this.timeout);

    var client = new net.Socket();
    client.on('error', timeout.reject);

    try {
      let connect = new Promise((resolve) => client.connect(this.port, this.host, resolve));
      await Promise.race([connect, timeout]);
      client.write(payload);
      let response = await Promise.race([drain(client), timeout]);

      if(!response.slice(0, ZBXD_HEADER.length).equals(ZBXD_HEADER))
        throw "got invalid response from server";

      return JSON.parse(response.slice(13));
    } finally {
      clearTimeout(i);
      client.destroy();
    }
  }

  // takes items array and prepares payload for sending
  static prepareData(data) {
    var payload = {request : 'sender data', data};
    payload = new Buffer(JSON.stringify(payload), 'utf8');
    var size  = new Buffer(4); size.writeInt32LE(payload.length);
    return Buffer.concat([ZBXD_HEADER, size, new Buffer('\x00\x00\x00\x00'), payload]);
  }

}


module.exports = ZabbixSender;
