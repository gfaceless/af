var mongodb = require('mongodb')
    , dbConnector = require('.././db');

var collectionM = dbConnector.collection('manufacturers');
var collectionU = dbConnector.collection('users');


function add(req, res) {
    var mid;

    var logged_in = req.session.logged_in
        , username = req.session.username
        , isAdmin = req.session.isAdmin
        , mid = req.session.mid
        , message = req.flash('info');

    if (mid) {
        res.redirect('manufacturers/list/' + mid);
    } else if (logged_in) {
        res.render('manufacturer/register', {title:'生产厂商注册'});
    } else {
        req.flash('info', '请先登录');
        res.redirect('users/login');
    }
}

function create(req, res) {
    var mid = req.body.mid
        , name = req.body.name
        , username = req.session.username
        , manufacturer;

    if (req.session.logged_in && mid && name) {
        manufacturer = {
            name:name,
            user:username,
            mid:mid
        };

        collectionM.insert(manufacturer, function (err, m) {
            if (err) throw err;
            if (m) {
                collectionU.update(
                    {username:username},
                    {$set:{mid:mid}},
                    function (err, result) {
                        if (err) throw err;
                        if (result) {
                            req.session.mid = mid;
                            req.flash('info', '您的公司已经注册成功');
                            res.redirect('/manufacturers/list/' + mid);
                        }
                    });
            } else {
                res.send(404);
            }
        });

    }
}

function list(req, res) {

    var mid = req.params.mid;

    if (!mid) {


        collectionM.find({}, {limit:100}).toArray(function (err, ms) {
            if (err) throw err;
            res.render('manufacturer/list', {
                title:'生产厂商',
                manufacturers:ms
            });
        });
    } else {
        collectionM.findOne({mid:mid}, function (err, m) {
            if (err) throw err;
            if(m) {
            res.render('manufacturer/details', {
                title:'生产厂商具体信息',
                manufacturer:m
            });

            } else {
                res.send(404);
            }

        })
    }
}


function edit(req, res) {
    var mid = req.session.mid;
    if (mid) {

        collectionM.findOne({mid:mid}, function (err, m) {
            if (err) throw err;
            if (m) {
                console.log(m);
                res.render('manufacturer/edit', {
                    title:'编辑生产商资料',
                    manufacturer:m

                });
            } else {
                res.send(404);
            }
        });
    } else {
        res.redirect('/manufacturers/register');
    }
}

function update(req, res) {
    // TODO: add admin support
    var mid = req.session.mid
        , manufacturer = {};

    var fields = ['name', 'description', 'date', 'province', 'extraInfo'];
    if (mid) {
        // I want to use Form Control(js) in the front end,
        // in case of user only changing a few fields.
        // to boost proficiency.
        fields.forEach(function (field) {
            var value = req.body[field];
            if (value) {
                manufacturer[field] = value;
            }
        });

        collectionM.update({mid:mid }, {$set:manufacturer}, function (err, num) {
            if (err) throw err;
            console.log('update success, num is: ', num);
            req.flash('info', '编辑成功');
            res.redirect('/manufacturers/list/' + mid);
        })
    } else {
        res.redirect('/');
    }
}


exports.add = add;
exports.create = create;

exports.list = list;

exports.edit = edit;
exports.update = update;


