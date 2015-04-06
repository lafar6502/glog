var sqli = require('sqlite3').verbose();

var lr = require('./lib/logrepo');

var r = lr.openLogRepository({fileName: 'test.logz', readOnly: false, logLevel: 'DEBUG'});

for (var i=0; i<30000; i++) {
    r.addLog('localhost', 'test.js', 'INFO', 'this is test message #' + i);
};
r.close();