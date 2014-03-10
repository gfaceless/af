var express = require('express')
//    , routes = require('./routes')
  , http = require('http')



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



app.configure(function () {


  app.use(express.cookieParser());
  app.use(express.session({secret: 'nothing'}));

  app.use(allowCrossDomain);

  // from SO:
  // Note that if you don't explicitly use the router,
  // it is implicitly added by Express at the point you define a route
  // (which is why your routes still worked even though you commented out app.use(app.router)).
  app.use(app.router);

  app.use( function (req, res, next) {
    var s = req.query.wd;
    if(s) {
      res.send({success:true, s: obj[s]})
    } else {
      res.send({success:false})
    }
  })
});

var obj = {
  s: ["sina","s4","steam","shinee","skype","sina微博","sohu","super junior","sony","sj"],
  d: ["dnf","dota2","dota","dnf官网","dota视频","dhl","dj","dota2激活码","dnf二次觉醒","dnf17173"],
  a: ["angelababy","acfun","apple","a67","akb48","a67手机电影mp4下载","app","adobe reader","acg","ai"],
  b: ["baidu","bt","btchina","beyond","bbs","bbc","blog","bobo组合","bb霜"],
  c: ["cf","cf官网","csol","cbg","cctv","cf下载","csol官网","cntv","cs","cbg梦幻站"]
}



http.createServer(app).listen(80);




