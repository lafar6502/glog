var _ = require('lodash');
var gelfserver = require('graygelf/server');
var graygelf   = require('graygelf');

var srv = gelfserver();


srv.on('message', function(msg) {
    console.log('msg: ', msg);
    //console.log('a message ', msg.length, typeof(msg), msg);
});

srv.listen(12201);
console.log('listening on', srv.address, srv.port);