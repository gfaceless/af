var mongoose = require('mongoose')
  , Mfr = mongoose.model('Mfr')
  , User = mongoose.model('User')
  , Product = mongoose.model('Product');

var extend = require('../lib/util').extend;

function login(req, res, next) {
  if (req.session.logged_in) {
    next();
  } else {
    req.flash('info', '请先登录');
    res.redirect('/users/login');
  }
}

function mfr(req, res, next) {
  if (!req.session.mid) {
    req.flash('info', '需要注册为生产厂商');
    res.redirect('/mfrs/register');
  }
  else {
    next();
  }
}

function nonMfr(req, res, next) {
  if (req.session.mid) {
    req.flash('info', '您已经是注册厂商');
    res.redirect('back');
  }
  else {
    next();
  }
}



function admin(req, res, next) {
  if (_isAdmin(req)) {
    res.locals.isAdmin = true;
    return next();
  }
  req.flash('info', '没有权限');
  res.redirect('back');
}

function _isAdmin(req) {
    return req.session.isAdmin ? true : false;
}

function self (options) {
  var defaultOptions = {
    allowAdmin : true
  };
  options = extend(defaultOptions, options);

  return function (req, res, next) {
    var pass = options.allowAdmin && _isAdmin(req);
    if(pass) return next();

    // this is set by other functions, like product.prep:

    if(req.user && req.user.isSelf) return next();
    console.log('ATTENTION, not self!');
    req.flash('info', '没有权限');
    res.redirect('back');
  };


}





exports.login = login;
exports.mfr = [login, mfr];
exports.nonMfr = [login, nonMfr];
exports.admin = [login, admin];
exports.self = function (options) {
  return [login, self(options)];
}

/*// I'M DOING THIS SIMPLY BECAUSE IAM IGNORANT, I BELIEVE THAT PERMISSION CENTRAL CONTROL
// WOULD SIMPLIFY THINGS. BUT...
exports.self = function (options) {
  options = options || {};
  var fn = typeof options === 'function' ? options : (options.fn ? options.fn : null);

  var tmp = function (req, res, next) {
    var pass = options.admin && _isAdmin(req) ? true : false;
    if(pass) return next();
    fn(req, res, next);
  };

  return [login, tmp];


};*/
