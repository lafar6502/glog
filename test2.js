var lc = require('./lib/logcollector');



var cfg = {
    fileName: '../glogs/updtest_',
    fileDateFormat: 'YYYY-MM-DD',
    udpPort: 10444,
    listenAddress: '0.0.0.0'
};

var col = lc.createLogCollector(cfg);

col.start();
