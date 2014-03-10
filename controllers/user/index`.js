var mongodb = require('mongodb')
    , dbConnector = require('.././db')
    , crypto = require('crypto');

var collectionU = dbConnector.collection('users');


function setSession (req, user) {
    req.session.logged_in = true;
    req.session.username = user.username;
    req.session.mid = user.mid;
    req.session.isAdmin = user.isAdmin;
}


function add(req, res) {
    res.render('user/register', {title:'用户注册'});
}

function create(req, res) {
    //TODO: there are a lot of work to be done!
    var username = req.body.username
        , password = req.body.password
        , user = {
            username:username,
            password:password && crypto.createHash('sha1').update(password, 'utf8').digest('base64')
        };

    collectionU.insert(user, function (err, results) {
        if (err) throw err;
        if (results) {
            // results is an array he session!
            setSession(req, results[0]);
            req.flash('info', '注册成功，直接登录');

            res.redirect('/');
        }
    })
}

function loginGet(req, res) {
    if(req.session.logged_in) {
        res.redirect('/');
    } else {
        res.render('user/login', {
            title:'用户登录',
            referrer: req.get('referrer')
        });
    }

}

function login(req, res) {
    var username = req.body.username
        , password = req.body.password
        , referrer = req.body.referrer;

    collectionU.findOne({username: username}, function(err, user) {
        if(err) throw  err;
        password = password && crypto.createHash('sha1').update(password, 'utf8').digest('base64')
        if(user && user.password === password) {
            setSession(req, user);

            req.flash('info', '欢迎您, '+ username);
            console.log(referrer);
            res.redirect(referrer||'/');
        } else {
            req.flash('info', '用户名/密码错误');
            res.redirect('/users/login');
        }
    })
}

function logout(req, res) {
    // don't forget to consider CSRF
    req.session.logged_in = false;
    res.redirect('back');
}

exports.create = create;
exports.add = add;

exports.login = login;
exports.loginGet = loginGet;

exports.logout = logout;
