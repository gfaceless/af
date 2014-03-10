var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId
  , assert = require('assert');

module.exports = exports = {
  name: 'category',
  plName: 'categories',
  pathPrefix: 'manage',
  idField: '_id'
}


var Category = mongoose.model('Category');

exports.create = function (req, res) {
  var content = req.body
    , parentId = content.parentId;

  var categ = new Category(content);

  if (!parentId && !categ.isRoot) throw 'the one created without parentId should have `isRoot` being true';

  categ.save(function (err, categ) {
    if (err) throw err;

    if (parentId) {
      // TODO: maybe use findOneAndUpdate instead
      Category.findById(parentId, function (err, parent) {
        if (err) throw err;

        if (!parent.children) {parent.children = []}

        parent.children.push(categ);
        parent.save(function (err, parent) {
          if (err) throw err;
          if (parent) {
            if (req.xhr) {
              res.send({success: true, doc: categ, child: categ, parent: parent});

            } else {
              req.flash('info', 'success');
              res.redirect('back')
            }
          }
          // I DO NOT KNOW when it will be here:
          else {
            if (req.xhr) {
              res.send({success: false, child: categ, parent: parent});
            } else {
              req.flash('info', 'fail');
              res.redirect('back')
            }
          }
        });

      })
    } else {
      res.send({success: true, doc: categ, message: 'root saved'});
    }

  })
}




exports.populate2 = function () {

  function pop (node){
    if(node.children && node.children.length) {
      Category.populate(node, {path: 'children'/*, model:'Ccategory'*/}
        , function (err, node) {
          if(err) throw err;
          node.children.forEach(function(child){
            pop(child);
          })
        }
      )
    }
  }

  Category.findOne({isRoot: true}, function (err, tree) {
    if(err) throw err;
    pop(tree);
    setTimeout(function () {
//      console.log(require('util').inspect(tree, {depth: null, colors: true}));
      console.log('bla');
      console.log(tree);
    }, 5000);
  });
};

exports.populate = function () {

  var _popularize = function (node) {
    if (!node || !node.children) return;
    node.children.forEach(function (childId, i) {
      Category.findById(childId, function (err, child) {
        if (err) throw err;
        if (child) {
          node.children[i] = child;
          _popularize(child);
        }
      })
    })
  }

  Category.findOne({isRoot: true}, function (err, doc) {
    if (err) throw err;
    if (doc) {
      exports.tree = doc;
      _popularize(doc);
    }
  })
}


exports.modify = function (req, res) {
  res.render('category/modify', {
    title: '编辑类别',
    doc: exports.tree
  });

}

exports.tree = {};

exports.refresh = function (req, res) {
  exports.populate();
  res.redirect('back');
}

exports.destroy = function (req, res) {
  var parentId = req.body.parentId
    , _id = req.params['_id'];

  if (!parentId) throw 404;

  Category.findByIdAndUpdate(parentId, {$pull: {children: _id}}, function (err, parent) {
    if (err) throw err;
    if (parent) {
      // TODO: recursively remove all children
      Category.findByIdAndRemove(_id, function (err, remove) {
        if (err) throw err;
        if (remove) {
          res.send({success: true, message: 'removed'});
        } else {
          res.send({success: false, message: 'cannot find the child to remove'});
        }
      });
    } else {
      res.send({success: false, message: 'cannot find the parent'});
    }

  })
}

exports.update = function (req, res) {
  var _id = req.params['_id'];
  Category.findById(_id, function (err, categ) {
    if (err) throw err;
    categ.name = req.body.name;
    categ.save(function (err, categ) {
      if (err) throw err;
      res.send({success: true, doc: categ});
      // where to handle failure?

    })
  })
}


