var mongoose = require('mongoose')
    , Mfr = mongoose.model('Mfr')
    , User = mongoose.model('User')
    , publishImg = require('../../lib/image.js').publishImg
    , error = require('../error.js');

var validationOpt = JSON.stringify({
    ignore: [],
    rules: {
        "mfr[shortName]": {
            required: true,
            "rangelength": [2, 12]
        },
        "mfr[fullName]": {
            required: true,
            "rangelength": [2, 30]
        }
    },
    messages: {
    }
});


exports.add = function add(req, res) {

    var mid = req.session.mid;

    if (!mid) {
        res.render('mfr/register', {
            title: '生产厂商注册',
            validationOpt: validationOpt
        });

    } else {
        res.redirect('back');
    }
}

exports.create = function create(req, res, next) {

    var mfr = req.body.mfr || {}
        , img = req.files && req.files.image;

    if (!img) doCreate();
    else  publishImg(img, 'mfr', doCreate);


    // TODO: definitely use async here:
    function doCreate(err, img) {
        if (err) return next(err);
        if (img) {
            mfr.images = [img.imgUrl];
            mfr.thumbnail = img.thumbUrl;
        }
        Mfr.create(mfr, function (err, mfr) {
            if (err) return next(err);
            User.findOne({name: req.session.username}, function (err, user) {
                if (err) return next(err);
                user.mfr = mfr;
                user.save(function (err, user) {
                    if (err) return next(err);
                    // user.mfr has been converted to ObjectId
                    req.session.mid = user.mfr;
                    req.flash('info', '您的公司已经注册成功');
                    res.redirect('/mfrs/' + user.mfr);
                });
            })
        })
    }
}

exports.list = function list(req, res) {

    Mfr.find({}, function (err, mfrs) {
        if (err) throw err;
        res.render('mfr/list', {
            title: '生产厂商',
            mfrs: mfrs
        });
    })
};

exports.show = function view(req, res, next) {
    if (req.queriedEl) {
        return render(req.queriedEl);
    }
    // never reach here, isn't it?
    Mfr.findById(req.params['_id'], function (err, mfr) {
        if (err) return next(err);
        if (!mfr) return next(404);
        render(mfr);

    });

    function render(mfr) {
        res.render('mfr/details', {
            title: '生产厂商具体信息',
            mfr: mfr
        });
    }
}


exports.edit = function edit(req, res) {

    if (req.queriedEl) {
        return render(req.queriedEl);
    }

    function render(mfr) {
        res.render('mfr/register', {
            title: '编辑生产商资料',
            mfr: mfr,
            validationOpt: validationOpt
        });
    }

    // never reach here:
    Mfr.findById(mid, function (err, mfr) {
        if (err) return next(err);
        render(mfr);
    });
}

exports.update = function update(req, res, next) {
    // TODO: add admin support


    var id = req.params['_id']
        , mfr = req.body.mfr || {}
        , img = req.files && req.files.image;

    // also prevent malicious overriding:
    mfr._id = id;

    if (!img) doUpdate();
    else  publishImg(img, 'mfr', doUpdate);


    function doUpdate(err, img) {
        if (err) return next(err);
        if (img) {
            mfr.images = [img.imgUrl];
            mfr.thumbnail = img.thumbUrl;
        }
        Mfr.doUpdate(mfr, function (err, doc) {
            if (err) return next(err);
            req.flash('info', '编辑成功！');
            res.redirect('/mfrs/' + id);
        });
    }

}

exports.prep = function (req, res, next) {
    var id = req.params['_id']
        , mid;

//  if(!id) return next();

    mid = req.session.mid;

    Mfr.findById(id, function (err, mfr) {
        if (err) return next(err);
        if (!mfr) return next(404);

        req.queriedEl = mfr;

        if (mid && mfr._id.toString() === mid) {
            req.user = req.user || {};
            req.user.isSelf = res.locals.isSelf = true;
        }
        next();
    });
};