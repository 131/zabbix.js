An es7 efficient TCP client for zabbix (abide to zabbix trapper protocol)

[![Build Status](https://travis-ci.org/131/zabbix.js.svg?branch=master)](https://travis-ci.org/131/zabbix.js)
[![Coverage Status](https://coveralls.io/repos/github/131/zabbix.js/badge.svg?branch=master)](https://coveralls.io/github/131/zabbix.js?branch=master)
[![Version](https://img.shields.io/npm/v/zabbix.js.svg)](https://www.npmjs.com/package/zabbix.js)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](http://opensource.org/licenses/MIT)

# API
```
var Zabbix = require('zabbix.js');
var sender = new Zabbix('somezabbixhost');

sender.sendv("somekey", 42); //await me if you want
```


# Credits 
* [131](https://github.com/131)
* Inspired from [node-zabbix-sender](https://github.com/shamil/node-zabbix-sender)
