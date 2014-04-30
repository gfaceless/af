var crypto = require('crypto')
    , fs = require('fs')
    , path = require('path')
    , mongoose = require('mongoose')
    , ObjectId = mongoose.Schema.Types.ObjectId
    , publishImg = require('../../lib/image.js').publishImg
    , removeImg = require('../../lib/image.js').removeImg

var _ =require('lodash')
var qs = require('querystring')

var makeError = require('../error.js').makeError;
var Product = mongoose.model('Product');

var requireSelf;


var validationOptions = JSON.stringify({
    ignore: [],
    rules: {
        "product[name]": {
            required: true,
            "rangelength": [2, 12]
        },
        "product[categories][0]": "required"
    },
    messages: {
        // "product[name]": {}
        "product[categories][0]": {
            required: "必须选择种类"
        }
    }
});

exports.add = function add(req, res) {
    var mid = req.session.mid

    if (mid) {
        res.render('product/add', {
            validationOpts: validationOptions,
            title: '添加/注册产品',
            categExpanded: true
        });
    }

}

exports.create = function (req, res, next) {
    var product = req.body.product || {}
        , img = req.files && req.files.image;

    product.mfr = req.session.mid;

    if (!img) create();
    else publishImg(img, 'product', create);

    function create(err, img) {
        if (err) return next(err);
        if (img) {
            product.images = [img.imgUrl];
            product.thumbnail = img.thumbUrl;
        }
        // such API leaves the possibilities for multiple creation
        Product.create(product, function (err, product) {
            if (err)  return next(err);
            req.flash('info', '上传产品成功！');
            res.redirect('/products/' + product._id);
        });
    }
}

exports.show = function (req, res, next) {
    var id = req.params['_id'];

    if (req.queriedEl) {
        return render(req.queriedEl);
    }

    // TODO: Product.findById(id).populate(pop).exec( function (err, product)
    if (id) {
        Product.findById(id).lean().exec(function (err, product) {

            if (err) return next(err);
            if (!product) return next(404);

            // populate product.mfr
            Product.populate(product, {path: 'mfr categories'}, function (err, product) {
                if (err) return next(err);
                render(product);
            });

        })
    }

    function render(product) {
        res.render('product/show', {
            title: '产品详细信息',
            product: product
        })
    }
}



function urlAfterSlice(pathname, query, queryname) {
    query = _.clone(query);
    delete query[queryname];
    return pathname + '?' + qs.stringify(query);
}

exports.list = function list(req, res, next) {
    // TODO: SEO?? use !# for google ??

    var category = req.query.category
        , mfr = req.query.mfr
        , name = req.query.name
        , criteria = {}
        , page = parseInt(req.query.page, 10) || 1
        , itemsPerPage = 10
        , skip = (page - 1) * itemsPerPage;


    if (category) criteria.categories = category;
    if (mfr) criteria.mfr = mfr;
    if (name) criteria.name = new RegExp('.*' + name + '.*', 'i');


    Product.find(criteria)
        .populate('mfr categories')
        .skip(skip)
        .limit(itemsPerPage)
        .exec(callback);

    function callback(err, docs) {
        if (err) throw err;

        // only when multiple pages we do a count request:
        if (docs.length === itemsPerPage || skip) {
            Product.count(criteria, function (err, count) {
                // how to solve such code redundancy?
                if (err) if (err) return next(err);
                res.render('product/list', {
                    title: '该类全部产品',
                    products: docs,
                    page_count: Math.ceil(count / itemsPerPage),
                    page_current: page,
                    url: urlAfterSlice(req.path, req.query, 'page')
                });
            })
            return;
        }

        res.render('product/list', {
            title: '该类全部产品',
            products: docs
        })
    }
}
exports.edit = function (req, res, next) {
    var id = req.params['_id'];
    console.log(req.queriedEl);
    if (req.queriedEl) {
        return render(req.queriedEl);
    }

    function render(product) {
        res.render('product/add', {
            title: '编辑',
            product: product,
            categExpanded: true,
            validationOpts: validationOptions
        })
    }

    Product.findById(id).populate('categories').exec(function (err, product) {
        if (err) return next(err);
        if (!product)  return next(404);
        render(product);
    })
}

exports.update = function update(req, res, next) {
    var id = req.params['_id']
        , product = req.body.product || {}
        , img = req.files && req.files.image;

    // also prevent malicious overriding:
    product._id = id;
    // TODO: change logic if Admin operation
    product.mfr = req.session.mid;

    if (!img) doUpdate();
    else publishImg(img, 'product', doUpdate);

    function doUpdate(err, img) {
        if (err) return next(err);

        if (img) {
            product.images = [img.imgUrl];
            product.thumbnail = img.thumbUrl;
        }

        Product.doUpdate(product, function (err, doc) {
            if (err) return next(err);
            req.flash('info', '编辑成功！');
            res.redirect('/products/' + id);

        });
    }

}

exports.destroy = function destory(req, res, next) {
    var id = req.params['_id'];

    // we could use async lib here (if this pyramid continues to grow)
    Product.findByIdAndRemove(id, function (err, doc) {
        var imgUrl, thumbUrl;
        if (err) return next(err);
        // we do img cleaning after res.redirect, enhancing user experience. (but harder to debug)
        req.flash('info', '删除成功');
        res.redirect('/products?mfr=' + doc.mfr);
        if (imgUrl = Array.isArray(doc.images) && doc.images[0]) {
            removeImg(imgUrl, function (err) {
                if (err) return next(err);
                if (thumbUrl = doc.thumbnail) {
                    removeImg(thumbUrl, function (err) {
                        if (err) return next(err);
                    });
                }
            });
        }
    })
}

function prep(req, res, next) {
    var id = req.params['_id']
        , mid
        , pop;

//  if(!id) return next('route');

    mid = req.session.mid;
    // when edit, restrict mfr, or one can insert arbitrary product into others' account
    pop = 'mfr categories';

    Product.findById(id).populate(pop).exec(function (err, product) {
        if (err) return next(err);
        if (!product) return next(404);
        req.queriedEl = product;
        if (mid && product.mfr._id.toString() === mid) {
            req.user = req.user || {};
            req.user.isSelf = res.locals.isSelf = true;
        }
        next();
    })
};


exports.inputValidate = function (req, res, next) {

    db.multiArr.insert({"id": "m1", "category": [
        ["E", "B", "A"],
        ["F", "D", "A"]
    ]})
    db.multiArr.insert({"id": "m2", "category": [
        ["G", "C", "A"],
        ["H", "D", "A"]
    ]})

    db.multiArr.find({
        category: { $elemMatch: { $elemMatch: {"$in": ["E"]}} }
    })


    // should only deal with xhr
//  if(!req.xhr) return next(404);
    // one field a time
    // what about array?
    /*var path = req.body.fieldName;
     var value = req.body.value || null;

     console.log(Product.schema.paths);
     console.log(Product.schema.constructor.prototype.paths);
     path = 'name';
     value = "壳牌超凡喜列";

     Product.create({
     name: value
     }, function (err, b) {
     console.log(err, b);
     })*/


    /*  var schemaType = Product.schema.path(path);

     schemaType.doValidate(value, function (err){

     if(err) {
     res.send({valid: false, err: err, s: schemaType});
     } else {
     res.send({valid: true, s: schemaType});
     }
     }, new Product());*/
};

requireSelf = function (req, res, next) {

    var id = req.params['_id']
        , mid
        , pop;

    mid = req.session.mid;
    // when edit, restrict mfr, or one can insert arbitrary product into others' account
    pop = 'mfr categories';

    Product.findById(id).populate(pop).exec(function (err, product) {
        if (err) return next(err);
        //TODO: maybe such error here reveals too much info:
        if (!product) return next(404);
        // cache it
        req.queriedEl = product;
        if (mid && product.mfr._id.toString() !== mid) {
            req.flash('info', '没有权限');
            res.redirect('back');
        }
        req.isSelf = res.locals.isSelf = true;
        next();
    })


};


exports.hello2 = function (req, res, next) {
    var gm = require('gm').subClass({ imageMagick: true });
    var fs = require('fs');
    /*fs.stat('d:/test-img/img.jpg', function (err, stat) {
     console.log(err, stat);
     });*/

    /*var wstream = fs.createWriteStream('pipe.png');
     gm('img.jpg')
     .resize(100, 100)
     .stream('png')
     .pipe(wstream);*/
    gm('img.jpg')
        .thumb(100, 100, 'img-thumb.png', 75, function (err, b) {
            console.log(err, b);
        });


    /*gm('img.jpg')
     .stroke("#ffffff")
     .drawCircle(10, 10, 20, 10)
     .font("Helvetica.ttf", 12)
     .drawText(30, 20, "GMagick!")
     .write("drawing.png", function (err) {
     if (!err) console.log('done');
     });*/
    /*.flip()
     .magnify()
     .rotate('green', 45)
     .blur(7, 3)
     .crop(300, 300, 150, 130)
     .edge(3)
     .write('img-gai.jpg', function (err) {
     console.log(err);
     });*/
    /*.thumb(30, 30, 'img_thumb.jpg', 50, function (err) {
     console.log(err, 'done');
     })*/
};


exports.requireSelf = requireSelf;
exports.prep = prep;


function mixin(a, b, inc, ex) {
    inc = inc || [];
    ex = ex || [];
    Object.keys(b).forEach(function (key) {
        if (~inc.indexOf(key) && !~ex.indexOf(key)) {
            console.log('passed key: %s', key);
            a[key] = b[key];
        }
    })
}

// TODO: `check` is a property of SALE controller?
function check(req, res) {

    collectionS.findOne({code: req.params.code}, function (err, doc) {
        if (err) throw err;

        if (doc) {
            res.render('check', {checked: doc.checked, title: 'true!'});

            collectionS.update({code: req.params.code}, {$inc: {checked: 1}}, function (err, num) {
                if (err) throw err;

            });
        } else {
            // TODO: the two routes should be in the same jade file.
            res.render('check-fail', {title: 'fake?'});
        }

    });


}


function listProducts(req, res) {

    var pid = req.params.pid
        , categories
        , category = req.query.category
        , mid = req.query.manufacturer;

    //TODO: everytime read the category is inefficient!
    // TODO: make it nearly static!

    collectionP.distinct('category', {}, function (err, results) {
            if (err) throw err;
            categories = results;
            if (!pid) {

                if (!category && !mid) {
                    // here should list by popularity.
                    collectionP.find({}, {limit: 100}).toArray(function (err, products) {
                        if (err) throw err;
                        res.render('product/list', {
                            title: '所有产品: ',
                            products: products,
                            categories: categories
                        });

                    })
                    return;
                }
                if (mid) {
                    collectionP.find({mid: mid}).toArray(function (err, products) {
                        if (err) throw err;

                        res.render('product/list', {
                            title: mid + '的所有产品',
                            products: products,
                            categories: categories

                        })
                    })
                    return;
                }


                collectionP.find({category: category}, {limit: 100}).toArray(function (err, products) {
                    res.render('product/list', {
                        title: '显示类别: ' + category,
                        products: products,
                        categories: categories
                    });

                })

            }
            else {

                Product.findById(pid, function (product) {
                    res.render('product/details', {
                        title: '产品详细信息',
                        categories: categories,
                        product: product
                    });
                });

                /*collectionP.findOne({pid:pid}, function (err, product) {
                 if (err) throw err;
                 if (product) {

                 res.render('product/details', {
                 title:'产品详细信息',
                 categories:categories,
                 product:product
                 });
                 } else {
                 res.send(404, 'no such product to show!');
                 }
                 })*/
            }
        }
    )
    ;
}


function edit(req, res) {
    var logged_in = req.session.logged_in
        , username = req.session.username
        , mid = req.session.mid;

    var pid = req.params.pid
        , auth;


    if (pid) {
        collectionP.findOne({pid: pid}, {fields: {_id: 0}}, function (err, product) {
            if (err) throw err;
            if (product) {
                if (product.mid === mid) {
                    res.render('product/edit', {
                        title: '编辑',
                        product: product

                    });
                } else {
                    res.send(404);
                }
            } else {
                res.send(404);
            }

        });
    } else {
        // goes here if I used /products/edit/:pid? <- NOTE the question mark
        res.send(404);
    }
}

function update(req, res) {
    var pid = req.params.pid,
        product = {
            name: req.body.name,
            category: req.body.category,
            description: req.body.description
        };

    //TODO: auth: checks if this pid belongs to this user.
    collectionP.update({pid: pid}, {$set: product}, {}, function (err, result) {
        if (err) throw err;

        // FOR NOW, I need to redirect the page.
        if (result) {
            req.flash('info', '保存成功!');
            res.redirect('/products/list/' + pid);
        }
        // it seems I have {w:1} (write concern) before, so I don't need it now.
        // the result is 1.
    });

}

function destroy(req, res) {
    var pid = req.params.pid;
    // need auth too
    collectionP.remove({pid: pid}, /*{w:1},*/ function (err, num) {
        if (err) throw err;
        if (num) {
            res.send({success: true, num: num});
        } else {
            res.send(500, 'please contact us');
        }
    });

}


// this one should definitely be in the "model" or "lib" folder:
var findByMid = function (mid, fn) {
    // I'm considering to change the structure
    // e.g. db.manufacturer has [pid1, pid2, ...]
    // again, storage in exchange of performance. <- typical embedded vs reference
    collectionP.find({mid: mid}, {
        fields: {
            pid: 1,
            _id: 0
        }})
        .toArray(function (err, arr) {
            // if no result, arr will be an empty array:
            // so no need to make a condition.
            console.log(arr);
            if (err) fn(err);
            fn(null, arr.map(function (obj) {
                return obj.pid;
            }));

        });
};
// no route:
var hasPid = function (mid, pid, fn) {
    findByMid(mid, function (err, arr) {
        if (err) throw err;
        fn(~arr.indexOf(pid));
    })
};


