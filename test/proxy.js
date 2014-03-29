var https = require('https'),
  http  = require('http'),
  util  = require('util'),
  path  = require('path'),
  fs    = require('fs'),
  url = require('url'),
  httpProxy = require('http-proxy');

var httpsOpts = {
  key: fs.readFileSync(__dirname + '/key.pem', 'utf8'),
  cert: fs.readFileSync(__dirname + '/cert.pem', 'utf8')
};



var proxy = new httpProxy.createProxyServer();
var server = http.createServer(function (req, res) {
  console.log(req.url);
  proxy.web(req, res, {
    target: req.url

  });

}).listen(3334);

https.createServer(httpsOpts, function (req, res) {
  console.log(req.url);
  proxy.web(req, res, {
    ssl: {
      key: fs.readFileSync(__dirname + '/key.pem', 'utf8'),
      cert: fs.readFileSync(__dirname + '/cert.pem', 'utf8')
    },
    target: req.url,
    secure: true
  });
}).listen(3335);




process.on('uncaughtException', function (e) {
  console.log(e);
});