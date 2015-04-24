var lr = require('./logrepo');
var _ = require('lodash');
var dgram = require('dgram');
var moment = require('moment');
var gelfserver = require('graygelf/server');
var graygelf   = require('graygelf');

function LogCollector(cfg) {
    var exampleConfig = {
        fileName: '/tmp/test',
        fileDateFormat: 'YYYY-MM-DD',
        udpPort: 10030,
        listenAddress: '0.0.0.0',
        gelfPort: 12201,
        gelfAddress: '0.0.0.0'
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
    
    var gelfsrv = null;
    
    var setupGelfReceiver = function() {
        if (!_.isNumber(cfg.gelfPort)) return;
        console.log('configuring gelf receiver', cfg.gelfAddress, cfg.gelfPort);
        gelfsrv = gelfserver();
        
        gelfsrv.on('message', function(msg) {
            if (!_.has(msg, 'level')) msg.level = 'INFO';
            var m = msg.full_message;
            if (_.has(msg, 'short_message') && m != msg.short_message) m = msg.short_message + ' \n' + msg.full_message;
            var ev = {
                ts: msg.timestamp,
                message: m,
                source: msg.source,
                level: msg.level,
                send_addr: msg.host,
                logname: msg._logname || 'gelf',
                pid: isNaN(msg._pid) ? -1 : msg._pid,
                threadid: isNaN(msg._threadid) ? -1 : msg._threadid,
                correlation: _.has(msg, '_correlation') ? msg._correlation : null,
                seq: msg._seq
            };
            if (!_.isString(ev.source)) ev.source = msg.facility;
            if (!_.isString(ev.source)) ev.source = msg.host;
            if (isNaN(ev.ts)) ev.ts = new Date().getTime();
            if (!_.isString(ev.message)) return;
            me.addEvent(ev);
        });
        gelfsrv.listen(cfg.gelfPort, cfg.gelfAddress);
        console.log('GELF listening on', gelfsrv.address, gelfsrv.port);
    };
    
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
                    ev.send_addr = rinfo.address + ':' + rinfo.port;
                    me.addEvent(ev);
                    
                }
                catch(e) {
                    //failed to parse messsage.....
                    console.log('failed to parse message', msg, e);
                }
            });
            dgsock = s;
        };
        setupGelfReceiver();
    };
    
    
    
    this.stop = function() {
        if (dgsock != null) {
            dgsock.close();
            dgsock = null;
        };
    };
    
    var unixEpochInTicks = 621355968000000000;
    
    this.addEvent = function(ev) {
        var ts = ev.ts;
        if (isNaN(ts)) {
            console.log('ts must be a number (ticks or milliseconds), not ', ev.ts);
        };
        ts = parseInt(ts);
        //ts is in .net ticks (*100ns since 0001-01-01) or unix timestamps (ms since 1970-01-01)
        if (ts >= unixEpochInTicks) ts = Math.floor((ts - unixEpochInTicks) / 10000);
        //ev.ts = ts;
        //console.log('ts is ', ts, new Date(ts));
        repo.enqueueEvent({
            ts: ts,
            message: ev.message,
            source: ev.source || ev.send_addr,
            send_addr: ev.send_addr,
            logname: ev.logname,
            level: ev.level,
            pid: ev.pid,
            threadid: ev.threadid,
            correlation: ev.correlation
        });
        //repo.enqueueEvent(ev);
    };
};

module.exports = {
    createLogCollector: function(cfg) {
        return new LogCollector(cfg);
    }
};