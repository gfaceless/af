var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId
  , util = require('util')
  , _ = require('lodash')
  , uniqueValidator = require('mongoose-unique-validator')
  , async = require('async')

var Category = mongoose.model("Category");

var productSchema = new Schema({
  // TODO: name needs index
  name: {type: String, required: true, trim: true, rangelength: [2,12] /*validate: lengthValidator,*/ /*, match: /^blah/*/},
  mfr: {type: ObjectId,    ref: 'Mfr',    required:true  },
  /* for multiple categories, schema should be something like this:
   * [{arr: []}, {arr:[...]}, {arr: []}]
   * */
  // what if arbitrary cat were passed?? required: true necessary?
  categories: [ {type: ObjectId, required: true, ref: 'Category'} ],

  desc: String,
  images: [String], // could verify here (make sure the suffix is right)
  thumbnail: String,
  "made-in": String,
  weight: Number,
  extra: Schema.Types.Mixed
  // TODO: even is ObjectId, it still needs index, I think

});

// there are quite a lot of intersection between Product and Category
productSchema.methods.buildAncestor = function (callback) {
  var product = this;
  var cats = product.categories;
  if(!cats || _.isEmpty(cats)) return callback();
  Category.findOne({_id: cats[0]}).exec(function (err, cat) {

    if(cat.parents) product.categories = cats.concat(cat.parents);
    callback(err, product);
  });
};

productSchema.pre('save', function (next) {

  this.buildAncestor(function (err, product) {
    // TODO: we can use parallel middleware
    // http://mongoosejs.com/docs/middleware.html
    if(err) return next(err);

    if(_.isObject(product.extra)) {
      var keyOverlong = Object.keys(product.extra).some(function (item) {
        return item.length > 10;
      });
      // can make it a "validationError"
      if(keyOverlong) next(500);
    }
    console.log(product);
    next(null/*, product*/);
  });

});

// TODO: we should employ some caching mechanism here:
var cache;

productSchema.statics.index = function ( callback ) {

  refresh(callback);

};



productSchema.statics.doUpdate = function (update, fn) {
  // TODO: we should update thumb info as well
  var model = this;
  model.findById(update._id, function (err, doc) {
    if(err) return fn(err);
    // object `doc` is a wrapper obj, malicious `update` can be dangerous
    // now mfr is not allowed to be changed
    mixin(doc, update, Object.keys(model.schema.paths), ['mfr']);
    // err & doc is pass to callback:
    doc.save(fn);
  })
}

var Product = mongoose.model('Product', productSchema);

function mixin(a, b, inc, ex) {
  inc = inc || [];
  ex = ex || [];
  Object.keys(b).forEach(function (key) {
    if(~inc.indexOf(key) && !~ex.indexOf(key)) {
      console.log('passed key: %s', key);
      a[key] = b[key];
    }
  })
  return a;
}


// TODO: decide whether this snippet should go in model or stay here (in controller)
// TODO: i think model is a better place since no view is involved
// SO HEAVY WORK!! MUST THROTTLE IT!!! AND ONLY UPDATE WHEN WRITTEN!!
function refresh(callback) {
  async.waterfall([
    findRoot,
    findLvl1Cats,
    findProducts
  ], callback);

  function findRoot(next) {
    Category.findOne({level: 0}).exec(next)
  }

  function findLvl1Cats(root, next) {
    // _id and id will be selected w/e
    Category.find({"parents.0": root}).select('name').exec(function (err, cats) {
      next(err, cats.map(function (cat) {
        return cat.toObject();
      }));
    });
  }

  function findProducts(cats, next) {
    async.map(cats, iterator, next);

    function iterator( cat, callback) {
      // can I make it one single request??? (tricky part is limit)
      // TODO: here we add some index criteria (like products promotion)
      // maybe we can populate mfr here
      Product.find({categories: cat._id}).populate('mfr categories').limit(10).exec(function (err, products) {
        cat.products = products;
        callback(err, cat);
      });
    }

  }

}