var sqli = require('sqlite3').verbose();

var lr = require('./lib/logrepo');

var r = lr.openLogRepository({fileName: 'test_', fileDateFormat: 'YYYY-MM-DD_HH_', readOnly: false, logLevel: 'DEBUG'});

var cnt = 0;
var itv = setInterval(function() {
    for (var i=0; i<1000; i++) {
        r.addLog('localhost', 'test.js', 'INFO', 'this is test message #' + i);
    };
    cnt++;
    if (cnt >= 10) {
        clearInterval(itv);
        r.close();
        r = null;
    };
}, 2000);
