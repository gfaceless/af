var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId
  , assert = require('assert')
  , _ = require('underscore')
  , util = require('../lib/util')
  , async = require('async')




var Category = mongoose.model('Category');


exports.create = function (req, res, next) {
  // only xhr and json
  var categories = req.body.categories
    , category = req.body.category
  var multi = _.isArray(categories);
  if(!multi) {
    if(!category) return next(500);
    (new Category(category))
      .save(function (err, cat) {
        if (err) return next(err);
        res.send({success: true, category: cat});
        // maybe here we update
        /*Category.buildTree(function (err, tree) {
         req.app.locals.categories = tree;
         });*/
      });
  } else {
    var ret = [];
    // actually we can use each instead of eachSeries
    async.eachSeries(categories, function (cat, cb) {
      (new Category(cat))
        .save(function (err, cat) {
          if (err) return cb(err);
          ret.push(cat);
          cb();
        });
    }, function (err) {
      if(err) return next(err)
      res.send({success: true, categories: ret});
    });
  }
}

exports.update = function (req, res, next) {
  var cat = req.body.category
    , _id = req.params['_id']
  if(!cat || !_id) return next('no params');

  Category.findOne({_id: _id}, function (err, doc) {
    if(err) return next(err);


    util.extendDoc(doc, cat).save(function (err, doc) {
      if(err) return next(err);
      // should we modify product info here?
      console.log(doc.parent);
      console.log(doc);
      res.send({success: true, category: doc});

    })
  })
};






exports.list = function (req, res, next) {

  res.send(req.app.locals.categories);
};

//





exports.edit = function (req, res) {
  res.render('category/edit', {
    title: '编辑类别'
  });
}



exports.refresh = function (req, res, next) {
  Category.buildTree(function (err, tree) {
    if(err) return next(err);
    req.app.locals.categories = tree;
    res.send({success: true, tree: tree});
  });

}


exports.destroy = function (req, res, next) {
  var _id = req.params._id;
  console.log(_id);
  if(_id){
    Category.remove({ "$or" : [{_id: _id}, {parents: _id}] }, function (err, removed) {
      if(err) return next(err);

      res.send({success: !!removed});
    })
  }
}