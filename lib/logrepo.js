var sqli = require('sqlite3').verbose();
var TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;
var _ = require('lodash');
var fs = require('fs');

var logLevels = {
	NONE: 	0,
	TRACE: 	1,
	DEBUG: 	2,
	INFO: 	3,
	WARN: 	4,
	ERROR: 	5,
	FATAL : 	6
};

function getLogLevelId(lvl) {
	if (_.isNumber(lvl)) return lvl;
	if (!_.isString(lvl)) return 0;
	if (_.has(logLevels, lvl.toUpperCase())) return logLevels[lvl];
	return 0;
};

function LogRepository(cfg) {
	this.logLevel = getLogLevelId(cfg.logLevel || 3);
	this.readOnly = _.has(cfg, 'readOnly') ? cfg.readOnly : false;
	var exists = fs.existsSync(cfg.fileName);
	this.tableName = 'logentry';
	this.eventz = [];
	var me = this;
	console.log('exits', exists);
    var insertStmt = null;
    var flushTimer = null;
    var doClose = false;
    
	var db = new TransactionDatabase(new sqli.Database(cfg.fileName, function() {
		
		if (!this.readOnly) {
            console.log('creating db struct');
		//var qry = "SELECT name FROM sqlite_master WHERE type='table' AND name='" + this.tableName + "'";
			var qry = "CREATE TABLE IF NOT EXISTS logentry(entryid INTEGER NOT NULL PRIMARY KEY, ts INTEGER NOT NULL, level INTEGER NOT NULL, correlation VARCHAR(50), source VARCHAR(50) NOT NULL, logname VARCHAR(50) NOT NULL, message TEXT NOT NULL)";
			db.run(qry, function() {
				console.log('db struct created');
                insertStmt = db.prepare("INSERT INTO logentry(ts, level, correlation, source, logname, message) values($ts, $level, $correlation, $source, $logname, $message)");
                //console.log('tbl created', err);
                flushTimer = setInterval(function() { me.flush(); }, 100);
			});
		};
	}));
    
    var writeEvents = function(events, callback) {
        /*db.exec("BEGIN");
        _.forEach(events, function(evt) {
            if (!_.has(evt, 'ts') || !_.has(evt, 'message')) throw new Error('message missing');
            
            db.exec("INSERT INTO logentry(ts, level, correlation, source, logname, message) values($ts, $level, $correlation, $source, $logname, $message)", {
                $ts: evt.ts,
                $level: getLogLevelId(evt.level),
                $correlation: evt.correlation,
                $source: evt.source,
                $logname: evt.logname,
                $message: evt.message
            });
        });
        db.exec("COMMIT");*/
        db.beginTransaction(function(err, tran) {
            var num = events.length;
            _.forEach(events, function(evt) {
                if (!_.has(evt, 'ts') || !_.has(evt, 'message')) throw new Error('message missing');
                
                tran.run("INSERT INTO logentry(ts, level, correlation, source, logname, message) values($ts, $level, $correlation, $source, $logname, $message)", {
                    $ts: evt.ts,
                    $level: getLogLevelId(evt.level),
                    $correlation: evt.correlation,
                    $source: evt.source,
                    $logname: evt.logname,
                    $message: evt.message
                });
                tran.commit(function(err) {
                    console.log('tran commit', err);
                    callback(err);
                });
            });
        });
    };
	
	this.enqueueEvent = function(evt) {
		me.eventz.push(evt);
	};
    
    var cleanup = function() {
        console.log('closing the db');
        if (flushTimer != null) {
            clearInterval(flushTimer);
            flushTimer = null;
        };
        if (insertStmt != null) {
            insertStmt.finalize();
            insertStmt = null;
        };
        if (db != null) {
            db.close();
            db = null;
        };
    };
    
    var flushing = false;
    
    this.flush = function() {
        if (flushing) {
            console.log('still flushing');
            return;
        };
        flushing = true;
        
        var el = me.eventz;
        me.eventz = [];
        var cln = function() {
            if (doClose) cleanup();
            flushing = false;
        };
        if (el.length > 0) {
            console.log('flushing ', el.length, 'events');
            writeEvents(el, cln);
        } else cln();
    };
    
    this.close = function() {
        doClose = true;
    };
    
	
};

//add log entry
// source - source file name
// logName - log name
// level - DEBUG, INFO, TRACE, ERROR, WARNING/WARN 
LogRepository.prototype.addLog = function(source, logName, level, message, correlation) {
	var evt = {
		source: source,
		logname: logName,
		level: getLogLevelId(level),
		message: message,
		correlation: correlation,
		ts: new Date().getTime()
	};
	this.enqueueEvent(evt);
};

LogRepository.prototype.flushEvents = function() {
	var evt = this.events;
	this.events = [];
	if (evt.length == 0) return;
	
};

LogRepository.prototype.queryLogs = function(query, start, limit, callback) {
	var qry = [];
	prm = {};
	if (_.has(query, 'timestamp')) {
		var ts = query.timestamp;
		if (!_.isArray(ts) || ts.length != 2) throw new Error('timestamp should be a 2-element array [from, to]');
		qry.push("ts >= $ts_from AND ts < $ts_to");
		prm.$ts_from = ts[0];
		prm.$ts_to = ts[1];
	};
	if (_.has(query, 'correlation')) {
		if (!_.isString(query.correlation)) throw new Error('correlation should be a string');
		qry.push('correlation = $correlation');
		prm.$correlation = query.correlation;
	};
	if (_.has(query, 'source')) {
		if (!_.isString(query.source)) throw new Error('source should be a string');
		qry.push('source == $source');
		prm.$source = query.source;
	};
	if (_.has(query, 'logname')) {
		qry.push('logname LIKE $logname');
		prm.$logname = query.logname;
	};
	if (_.has(query, 'level')) {
		var lvl = _.isArray(query.level) ? query.level : [query.level];
		lvl = _.map(lvl, getLogLevelId);
		qry.push('level in (' + lvl.join(', ') + ')');
	};
	var sql = "select ts, level, correlation, source, logname, message from logentry ";
	if (qry.length > 0) sql += "where " + qry.join(" AND ");
	sql += " order by entryid";
	sql += " LIMIT " + limit + ", " + start;
	console.log('sql', sql);
	this.db.each(sql, function(err, r) {
		console.log(r);
	});
};

module.exports = {
	openLogRepository: function(cfg) {
		return new LogRepository(cfg);
	}
};
