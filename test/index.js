"use strict";


const net = require('net');
const os = require('os');
const expect = require('expect.js');
const drain  = require('nyks/stream/drain');
const defer  = require('nyks/promise/defer');

const Zabbix  =  require('../');

const ZBXD_HEADER  = new Buffer('ZBXD\x01');

describe("Minimal mock suite", function(){

  var port, server;
  var host = '127.0.0.1'; //mock host

  const ALLGOOD = {status :'ok'};
  var buffer;

  it("SHould create a mock server", function(){

     server = net.createServer(async function(sock) {

        var head = defer();
        var head = await new Promise(resolve => sock.once('data', resolve));

        try {

          if(!head.slice(0, ZBXD_HEADER.length).equals(ZBXD_HEADER))
            throw "Invalid header";

          var size = head.readInt32LE(ZBXD_HEADER.length);

          var body = head.slice(ZBXD_HEADER.length + 4 + 4);
          while(body.length < size)
            body = Buffer.concat([body, await new Promise(resolve => sock.once('data', resolve)) ]);

          body = JSON.parse(body);
          buffer = body;

          if(body.data[0].value == "seppuku")
            throw "Bye";
          
          sock.write(ZBXD_HEADER);
          sock.write('\x00\x00\x00\x00\x00\x00\x00\x00');
          sock.write(JSON.stringify(ALLGOOD));

        } catch(err) {
          buffer = err;
        } finally {
          sock.end();
        }
      });

      server.listen(0, host, function(){
        port = this.address().port;
        //console.log("Now listening", port);
      });


  });


  it("should report mock data", async function(){
    var zabbix = new Zabbix({ host, port });

    var res = await zabbix.sendv('value', 42);
    expect(res).to.eql(ALLGOOD);
    expect(buffer.data).to.eql([{ host : os.hostname(), key : 'value', value : 42 }]);


  });

  it("should handler invalid response ", async function(){
    var zabbix = new Zabbix({ host, port });

    try {
      var res = await zabbix.sendv('value', "seppuku");
      throw "Never here";
    } catch(err) {
      expect(err).to.match(/invalid response from server/);
    }
  });


  it("should timeout on server offline", async function(){
    server.close();
    var zabbix = new Zabbix({ host, port });

    try {
      var res = await zabbix.sendv('value', 42);
      throw "Never here";
    } catch(err) {
      expect(err).to.match(/ECONNREFUSED/);
    }
  });





});