var lr = require('./lib/logcollector');
var lrepo = require('./lib/logrepo');

module.exports = {
    openLogRepository: lrepo.openLogRepository,
    openLogSearcher: lrepo.openLogSearcher,
    createLogCollector: lr.createLogCollector
};