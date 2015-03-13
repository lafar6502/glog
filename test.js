var sqli = require('sqlite3').verbose();

var db = new sqli.Database('logz.db', function(s) {
	console.log('aaa', arguments);
});

db.serialize(function() {
//db.run("CREATE TABLE ts1(x INTEGER  PRIMARY KEY, ts INTEGER) ");

console.log('t2');	
//db.run("CREATE TABLE logentry(entryid INTEGER NOT NULL PRIMARY KEY, ts INTEGER NOT NULL, level INTEGER NOT NULL, correlation VARCHAR(50), source VARCHAR(50) NOT NULL, logname VARCHAR(50) NOT NULL, message TEXT NOT NULL)");

addlog('10.3.10.3', 1, 'testing', 'to jest test test');

});

function addlog(source, lvl, logname, message) {
	//var ht = process.hrtime();
	var tm = new Date().getTime();
	db.run("INSERT INTO logentry(ts, level, correlation, source, logname, message) values($ts, $level, $correlation, $source, $logname, $message)", {
	$ts: tm,
	$level: lvl,
	$correlation: '',
	$source: source,
	$logname: logname,
	$message: message
});

db.each("select * from logentry", function(err, r) {
console.log(r);
});
};

db.close();
