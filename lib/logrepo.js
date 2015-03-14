var sqli = require('sqlite3').verbose();
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
	var db = new sqli.Database(cfg.fileName, function() {
		
		if (!this.readOnly) {
		//var qry = "SELECT name FROM sqlite_master WHERE type='table' AND name='" + this.tableName + "'";
			var qry = "CREATE TABLE IF NOT EXISTS logentry(entryid INTEGER NOT NULL PRIMARY KEY, ts INTEGER NOT NULL, level INTEGER NOT NULL, correlation VARCHAR(50), source VARCHAR(50) NOT NULL, logname VARCHAR(50) NOT NULL, message TEXT NOT NULL)";
			db.run(qry, function() {
				//console.log('tbl created', err);
			});
		};
	});
	
	this.enqueueEvent = function(evt) {
		me.eventz.push(evt);
		if (!_.has(evt, 'ts') || !_.has(evt, 'message')) throw new Error('message missing');
		
		db.run("INSERT INTO logentry(ts, level, correlation, source, logname, message) values($ts, $level, $correlation, $source, $logname, $message)", {
			$ts: ts,
			$level: getLogLevelId(level),
			$correlation: correlation,
			$source: source,
			$logname: logname,
			$message: message
		});
	};
	
};

LogRepository.prototype.addLog = function(source, logName, level, message, correlation) {
	var evt = {
		source: source,
		logName: logName,
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




LogRepository.prototype.close = function() {
	var t = this.db;
	if (t != undefined && t != null) {
		t.close();
	};
	delete this.db;
};

module.exports = {
	openLogRepository: function(cfg) {
		return new LogRepository(cfg);
	}
};
