var mongoose = require('mongoose')
  , crypto = require('crypto');

var User = mongoose.model('User');

var validationOpt = JSON.stringify({
  ignore: [],
  rules : {
    "user[name]": {
      required: true,
      "rangelength": [2,12],
      remote: "userexists"
    },
    "user[password]": {
      required: true,
      "rangelength": [6,20]
    }
    // TODO: re-password is done on the client side, should do it here
  },
  messages: {
  }
});

function setSession(req, user) {
  req.session.logged_in = true;
  req.session.username = user.name;
  req.session.mid = user.mfr;
  req.session.isAdmin = user.isAdmin;
}


function add(req, res) {
  /*// TODO: go up hierarchy
  res.locals.stringify = require('../../libs/stringify.js');
  res.locals.expose = User.expose();*/
  res.render('user/register', {
    validationOpt: validationOpt,
    title: '用户注册'
  });
}

function create(req, res, next) {

  var user = req.body.user || {}
    , password = user.password;

  // TODO: use schema#pre and USE ASYNC
  user.password = password && crypto.createHash('sha1')
    .update(password, 'utf8')
    .digest('base64');

  delete user.isAdmin;

  user = new User(user);

  user.save(function (err, user) {
    if (err) return next(err);
    setSession(req, user);
    req.flash('info', '注册成功，已直接登录');
    res.redirect('/');
  })
}

function loginGet(req, res) {
  if (req.session.logged_in) {
    res.redirect('/');
  } else {
    res.render('user/login', {
      title: '用户登录',
      referrer: req.get('referrer')
    });
  }

}

function login(req, res) {
  // what about I pass a non-object `user` object?
  // if there is an error, is the error caught and passed to the errHandler?
  var user = req.body.user || {}
    , password = user.password
    , name = user.name/* && user.name.toLowerCase()*/
    , referrer = req.body.referrer;

  User.findOne({name: name}, function (err, user) {
    if (err) return next(err);
    password = password && crypto.createHash('sha1').update(password, 'utf8').digest('base64')
    if (user && user.password === password) {
      setSession(req, user);

      req.flash('info', '欢迎您, ' + user.name);
      res.redirect(referrer || '/');
    } else {
      req.flash('info', '用户名/密码错误');
      res.redirect('/users/login');
    }
  })
}

function logout(req, res) {
  // don't forget to consider CSRF
  req.session.logged_in = false;
  req.session.isAdmin = false;
  req.session.mid = '';
  res.redirect('/');
}

exports.destroy = function (req, res, next) {
  var id = req.params['_id'];
  User.remove({_id: id} , function (err, user) {
    if(err) return next(err);
    console.log(user);
    req.flash('info', 'deleted!');
    res.redirect('back');
  })

}


exports.create = create;
exports.add = add;

exports.login = login;
exports.loginGet = loginGet;

exports.logout = logout;

exports.list = function (req, res, next){
  User.find().populate('mfr').exec(function(err, users) {
    if(err) return next(err);
    res.render('user/list', {title:'用户列表', users: users});
  })
}

exports.prep = function (req, res, next) {
  var id = req.params['_id'];

//  if(!id) return next();

  User.findById(id, function (err, user) {
    if(err) return next(err);
    if(!user) return next(404);

    req.queriedEl = user;

    if(user.name === req.session.username) {
      res.locals.isSelf = true;
    }
    next();
  })
};

exports.checkUser = function (req, res, next) {
  var name = req.query.user && req.query.user.name;
  if(name) {
    User.findOne({name: name}, function (err, user) {
      if(err) return next(err);

      // per http://jqueryvalidation.org/remote-method/
      //The response is evaluated as JSON and must be true for valid elements,
      // and can be any false, undefined or null for invalid elements, using the default message;
      // or a string, eg. "That name is already taken, try peter123 instead" to display as the error message.

      // per http://expressjs.com/api.html#res.send
      // When a String is given the Content-Type is set defaulted to "text/html":
      res.send( JSON.stringify(  user ? "该用户名已被注册" : true));



    });

  }
};












