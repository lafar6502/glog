var lr = require('./logrepo');
var _ = require('lodash');
var dgram = require('dgram');
var moment = require('moment');

function LogCollector(cfg) {
    var exampleConfig = {
        fileName: '/tmp/test',
        fileDateFormat: 'YYYY-MM-DD',
        udpPort: 10030,
        listenAddress: '0.0.0.0'
    };
    var dgsock = null;
    var me = this;
    var stat = {
        udpReceived: 0
    };
    var repo = lr.openLogRepository({
        readOnly: false,
        fileName: cfg.fileName,
        fileDateFormat: cfg.fileDateFormat,
    });
    
    
    this.start = function() {
        
        if (_.isNumber(cfg.udpPort)) {
            var s = dgram.createSocket('udp4');

            s.bind(cfg.udpPort, cfg.listenAddress, function () {
                console.log('udp bound to ', cfg.listenAddress, cfg.udpPort);
            });

            s.on('message', function (msg, rinfo) {
                stat.udpReceived++;
                if (Buffer.isBuffer(msg)) msg = msg.toString();
                
                msg = msg.trim();
                if (msg.length == 0) return;
                try {
                    var ev = JSON.parse(msg);
                    ev.sender = rinfo.address;
                    ev.sendPort = rinfo.port;
                    me.addEvent(ev);
                    
                }
                catch(e) {
                    //failed to parse messsage.....
                    console.log('failed to parse message', msg, e);
                }
            });
            dgsock = s;
        };
    };
    
    this.stop = function() {
        if (dgsock != null) {
            dgsock.close();
            dgsock = null;
        };
    };
    
    this.addEvent = function(ev) {
        var ts = ev.ts;
        if (isNaN(ts)) {
            console.log('ts must be a number (ticks or milliseconds)');
            return;
            ts = parseInt(ts);
        };
        if (ts >= 100000000000000000) ts = Math.floor(ts / 10000);
        //ev.ts = ts;
        console.log('ts is ', ts);
        repo.enqueueEvent({
            ts: ts,
            message: ev.message,
            source: ev.sender,
            logname: ev.logname,
            level: ev.level 
        });
        //repo.enqueueEvent(ev);
    };
};

module.exports = {
    createLogCollector: function(cfg) {
        return new LogCollector(cfg);
    }
};