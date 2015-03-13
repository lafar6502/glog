var sqli = require('sqlite3').verbose();
var _ = require('lodash');

function LogRepository(cfg) {
	this.db = new sqli.Database(cfg.fileName);
	
};

LogRepository.prototype.addLog = function(source, logName, level, message, correlation) {

};

LogRepository.prototype.queryLogs = function(query, start, limit) {

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
