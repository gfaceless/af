var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId
  , util = require('util')
  , uniqueValidator = require('mongoose-unique-validator')
  , _ = require('underscore')
  , extend = _.extend
//  , autoIncrement = require('mongoose-auto-increment');

var catSchema = new Schema({
  name: {type: String, required: true},
  parents: [ {type: ObjectId, ref: 'Category', index: true}],
  level: Number,
  order: Number
});

//catSchema.plugin(autoIncrement.plugin, { model: 'Category', field: 'order' });

catSchema.virtual('parent').set(function (value) {
  this.parents = this.parents || [];
  this.parents[0] = value;
}).get(function () {
    if(!_.isArray(this.parents)) return undefined;
    return this.parents[0];
  });

// TODO: we can actually remove parents[], remove id or _id ? using transform option
catSchema
  .set('toJSON', { getters: true })
  .set('toObject', { getters: true });


catSchema.pre('save', function (next) {
  // if isNew ??
  console.log('is new?', this.isNew);
  this.buildAncestor(next);
});

// just build an array - parents
catSchema.methods.buildAncestor = function (cb) {
//  var parentId = _.isArray(this.parents) && this.parents[0];
  var parentId = this.parent;

  if(!parentId) return cb();
  var cat = this;

  var model = this.constructor;
  model.findOne({ _id: parentId}, function (err, parent) {
    if(err) return cb(err);
    if(parent && _.isArray(parent.parents)) cat.parents = cat.parents.concat(parent.parents);
    cb(null, cat);
  });
};


catSchema.statics.buildTree = function ( cb ) {
  var model = this;
  this.findOne({level: 0}).lean().exec(function (err, root) {
    if (err) return cb(err);
    if (!root)
    {
      root = new model({name: '根', level: 0, parents: []});
      root.save(function (err) {
        if(err) return cb(err);
        cb(new Error('we should have a root, and ... created'));
      });
      return;
    }

    model.find({parents: root._id}).exec(function (err, cats) {
      if (err) return cb(err);
      var tree = root;
      // if no results, cats will be an empty array

      cats = cats.map(function (cat) {
        return cat.toObject();
      });
      _tmp(tree, cats, function () {
        cb(null, tree);
      });
    });

  });
};



function _tmp ( targets, collection, cb) {

  if(!_.isArray(targets)) targets = [targets];
  var ids = targets.map(function (target) {
    return target._id.toString();
  });
  var nextTargets = []
    , length = collection.length
    , count = 0

  var splice = [];
  // if computation goes large, we can make following async:
  collection.forEach(function (item, i) {
    // may fail due to ObjectId.toString() yes!
    console.log(item._id, item.parents[0]);

    var j = ids.indexOf(item.parents[0].toString());
    if(~j) {
      var target = targets[j];
      target.children = target.children || [];
      // should take `order` into account here:
      target.children.push(item);
      nextTargets.push(item);
      splice.push(i);
    } else {
      count ++;
    }
  });

  var l = splice.length;
  while(l--) {
    collection.splice(splice[l], 1);
  }

  if(collection.length === 0 || count === length) return cb();

  // use nextTick??
  _tmp(nextTargets, collection, cb);
}



var Category = mongoose.model('Category', catSchema);


