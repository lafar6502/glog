var lr = require('./lib/logcollector');
var lrepo = require('./lib/logrepo');

module.exports = {
    openLogRepository: lrepo.openLogRepository,
    createLogCollector: lr.createLogCollector
};