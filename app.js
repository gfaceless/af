var express = require('express')
  , http = require('http')
  , path = require('path')
  , dbConnector = require('./libs/db')
  , flash = require('connect-flash')
  , combo = require('combohandler')
  , error = require('./controllers/error')
  , fs = require('fs')
  , mongoose = require('mongoose')

require('./lib/mongoose');

// Bootstrap models
var models_path = __dirname + '/app/models';
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})
var Category = mongoose.model('Category');

var app = express();


var allowCrossDomain = function (req, res, next) {
//    res.header('Access-Control-Allow-Origin', config.allowedDomains);
//    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
    if(req.method === 'OPTIONS') {return res.send(200);}
    next();
};

var locals = function (req, res, next) {
  res.locals({
    message: req.flash('info'),
    mid: req.session.mid,
    username: req.session.username,
    logged_in: req.session.logged_in,
    isAdmin: req.session.isAdmin,
    // isSelf: false,
    expose: {},
  });
  next();
};


//app.set('env', 'production');
console.log('current env is: ' + app.settings.env);

app
  .configure(function () {
    this.set('port', process.env.PORT || 3002)
      .set('views', __dirname + '/views')
      .set('view engine', 'jade')
      .use(express.favicon( path.join(__dirname, 'public/img/favicon.ico') ))
  })
  .configure('production', function () {
    this.set('view cache', true)
  })
  .configure('development', function () {
    app.use(express.logger('dev'))
  })
  .configure(function () {

    // https://groups.google.com/forum/#!topic/express-js/iP2VyhkypHo:
    // The default limits for bodyParser(), urlencoded(), multipart(), and json() have also been adjusted.
    // The default limit for multipart is now 100mb, and 1mb for the other two.
    this.use(express.bodyParser({
        keepExtensions: true,
        uploadDir: __dirname + '/upload/images'
      }))

      .use(express.cookieParser())
      .use(express.session({secret: 'some secret word', maxAge: 7 * 24 * 60 * 60 * 1000 }))

      .use(flash())

      .use(express.methodOverride())
      // app.use(allowCrossDomain);

      // from SO:
      // Note that if you don't explicitly use the router,
      // it is implicitly added by Express at the point you define a route
      // (which is why your routes still worked even though you commented out app.use(app.router)).
      //TODO: router and static, which is first?? maybe for finer control, router should go first
      .use(express.static(path.join(__dirname, 'public')))
      .use(locals)
      .use(app.router)

//        .use(express.directory(__dirname + '/public'))

    /*app.use(function (err, req, res, next) {
     if (err instanceof combo.BadRequest) {
     res.charset = 'utf-8';
     res.type('text/plain');
     res.send(400, 'Bad request.');
     } else {
     next();
     }
     });*/
  });


require('./routes')(app);


/*app.get('/yui3', combo.combine({rootPath: __dirname + '/public/yui'}), function (req, res) {
  res.send(res.body);
});*/


//if no url match, here it is:
app.use(error.e404);

app.use(error);

app.configure('development', function () {
  app.use(express.errorHandler());
});
app.configure('production', function () {
  app.use(error.e500);
});

// ..
app.locals.pretty = true;





dbConnector.open(function (err) {
  if (err) throw err;
  // we populate category before application starts:
  Category.buildTree(function (err, tree) {
    if(err) throw err;
    // rename it?
    app.locals.categories = tree;
    http.createServer(app).listen(app.get('port'), function () {
      console.log("Express server listening on port " + app.get('port'));
    });
  });

});




