var sqli = require('sqlite3').verbose();

var lr = require('./lib/logrepo');

var r = lr.openLogRepository({fileName: 'test.logz', readOnly: false, logLevel: 'DEBUG'});

r.addLog('localhost', 'test.js', 'INFO', 'this is test message');
r.close();