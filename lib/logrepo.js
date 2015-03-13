var sqli = require('sqlite3').verbose();
var _ = require('lodash');

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
	this.db = new sqli.Database(cfg.fileName);
	
};

LogRepository.prototype.addLog = function(source, logName, level, message, correlation) {
	var tm = new Date().getTime();
	db.run("INSERT INTO logentry(ts, level, correlation, source, logname, message) values($ts, $level, $correlation, $source, $logname, $message)", {
		$ts: tm,
		$level: getLogLevelId(level),
		$correlation: correlation,
		$source: source,
		$logname: logname,
		$message: message
	});
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
		//if (!_.isString(query.source)) throw new Error('source should be a string');
	};
	if (_.has(query, 'logname')) {
		
	};
	if (_.has(query, 'level')) {
	};
	var sql = "select ts, level, correlation, source, logname, message from logentry ";
	if (qry.length > 0) sql += "where " + qry.join(" AND ");
	sql += " order by entryid";
	sql += " LIMIT " + limit + ", " + start;
	
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
