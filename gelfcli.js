var _ = require('lodash');
var graygelf   = require('graygelf');

var log = graygelf({
    host: 'localhost',
    port: 12201
  });
log.info('i am here!');

var arr = [];  
for (var i=0; i<1000; i++) {
    _.defer(function() {
        arr.push(' (text #' + i + ') {{{{{{ }}}}}} {{{{{{ * }}}}}} ');
        var s = '$' + i + ' : ' + arr.join(' -- ');
        console.log('i:', i, 'len', s.length);
        //log.info(s);
        log.info.a('short', s, { foo: 'bar', counter: arr.length })
    });
};
  