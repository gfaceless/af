// TODO: this file is too large. maybe split it into some small chunks in the same folder
var crypto = require('crypto')
  , mongodb = require('mongodb')
  , dbConnector = require('.././db')
  , fs = require('fs')
  , path = require('path')
  , Product = require('.././product')
  , mongoose = require('mongoose');


// NOTE: should these collections be avoid as `global` because the db connection pool?
var collectionM = dbConnector.collection('manufacturers'),
  collectionP = dbConnector.collection('products'),
  collectionS = dbConnector.collection('sales');

var productSchema = new mongoose.Schema({
  name: String,
  pid: {type: String, index:{unique: true}}
});

function add(req, res) {
  var logged_in = req.session.logged_in
    , user
    , username
    , mid = req.session.mid
    , isAdmin;

  mid && res.render('product/register', {title: '添加/注册产品'});

}

function create(req, res) {


  var logged_in = req.session.logged_in
    , username = req.session.username
    , sessMid = req.session.mid
    , isAdmin = req.session.isAdmin;


  var product = new Product(req.body, sessMid, req.files.image);
  product.save(function (product) {
    collectionM.update({mid: sessMid}, {$inc: {count: 1}}, function (err, num) {
      if (err) throw err;
      req.flash('info', '上传产品成功！');
      res.redirect('/products/list/' + product.pid);
    });
  });

  return;


  // if there is no callback, then the 2 functions are the same.
  // (I read the source code)
  // the latter is more useful under strict mode,
  // where it requires true async callback
  /*var collectionM = new mongodb.Collection(dbConnector, 'manufacturers'),
   collectionP = dbConnector.collection('products');*/

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


exports.check = check;

// CRUD:
exports.add = add;
exports.create = create;

exports.list = listProducts;

exports.edit = edit;
exports.update = update;

exports.destroy = destroy;


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
exports.hasPid = function (mid, pid, fn) {
  findByMid(mid, function (err, arr) {
    if (err) throw err;
    fn(~arr.indexOf(pid));
  })
};