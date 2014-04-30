/*here are all necessary schemas and models
 * as well as connection
 * */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId
  , util = require('util')
  , _ = require('underscore')
  , uniqueValidator = require('mongoose-unique-validator')
//  , autoIncrement = require('mongoose-auto-increment')

//require("./mongoose_patch");
require("./mongoose_length");

mongoose.plugin(uniqueValidator, {message: '已经有重复存在'});


var conn = mongoose.connect('mongodb://localhost/2dc');
//autoIncrement.initialize(conn);


var opt = {
  type: String, required: true, trim: true
};






var userSchema = new Schema({
  name: {
    type: String, trim: true, lowercase: true, rangelength: [2,15],/*validate: lengthValidator,*/
    unique: true, index: true, required: true
  },
  password: {type: String, required: true},
  // TODO: maybe one user can have multiple mfrs
  mfr: {type: ObjectId, ref: 'Mfr'},
  // TODO: change it to `role` or `permission`
  isAdmin: Boolean
});





var mfrSchema = new Schema({
  shortName: _.extend({}, opt, {lowercase: true, index: {unique: true}, rangelength: [2,12]}),
  fullName: _.extend({}, opt, {rangelength: [2,30]}),
  // should confine this field:
  province: String,
  desc: String,
  images: [String]
});

var saleSchema = new Schema ({
  code: {
    // I AM REALLY CURIOUS ABOUT THE COLLISION POSSIBILITY!!
    type: String, index: {unique: true}
  },
  product: {type: ObjectId, ref: 'Product'},
  queriedCount: {type: Number, default: 0},
  queriedDate: {type: Date},
  ips: [{type:String}]
})




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


mfrSchema.statics.doUpdate = function (update, fn) {
  var model = this;
  model.findById(update._id, function (err, doc) {
    if(err) throw err;
    mixin(doc, update, Object.keys(model.schema.paths));
    // err & doc is pass to callback:
    doc.save(fn);
  })
}


mongoose.model('User', userSchema);
mongoose.model('Mfr', mfrSchema);

mongoose.model('Sale', saleSchema);







/*userSchema.statics.expose = function () {
  var obj = {
    "name": lengthValidator,
    "password": 'someth'
  };

  return obj;
}*/


/*var getParamNames = require('./../libs/getParamNames.js');
// consider using regex
function generateLengthValidator(start, end) {
  var args = arguments;
  var arr = [function (str) {
    // if end is not defined, then end-test is passed.
    var endTested = end ? str.length <= end : true;
    var startTested = str.length >= start;
    return  startTested && endTested;
  }, '字符串长度应该在' + start + '到' + (end || '无限制') + '之间'
    *//* util.format('字符串长度应该在%s到%s之间', start, end || '无限制')*//*];

  var env = arr.__proto__.env = {}
  getParamNames(generateLengthValidator).forEach(function (name, i){
    env[name] = args[i];
  })
  return arr;
}

// TODO: make it be another file, where the validator can be reused by xhr.
var lengthValidator = generateLengthValidator(2, 15)
  , longLengthValidator = generateLengthValidator(2, 25);*/





// re-construct the `categories` collection
/*
Category.findOne({isRoot: true}).exec(function (err, root) {
  if (err) throw err;

  function iterate(node) {
    node.populate('children', function (err, node) {
      if (!node.children) return;
      node.children.forEach(function (child) {
        child.parent = node;
        child.save();

        iterate(child);
      });
    });
  }

  iterate(root);
})*/

// test
/*
var User = mongoose.model('User')
  , Mfr = mongoose.model('Mfr')
  , Category = mongoose.model('Category')
  , Product = mongoose.model('Product');

var mfr = new Mfr({
    fullName: '太平洋重型工业生产基地', shortName: '南阳重工', desc: 'some thing'
  })

  , user = new User({
    name: 'blah',
    mfr: mfr
  })
  , categoryRoot = new Category({
    name: 'root测试类别',
    isRoot: true
  })
  , category1 = new Category({
    name: '汽车工业行业',
    parent: categoryRoot
  })
  , category2 = new Category({
    name: '品牌专用配件',
    parent: category1
  })
  , category3 = new Category({
    name: '东风配件',
    parent: category2
  })
  , product = new Product({
    name: '测试产品',
    images: ['1.jpg', '2.jpg'],
    desc: 'hey girl',
    mfr: mfr,
    categories: [category3, category2, category1, categoryRoot]
  });
mfr.save(function (err, mfr) {
  if (err) throw err;
  user.save(function (err, user) {
    Category.create(categoryRoot, category1, category2, category3,
      function(err, doc1, doc2, doc3, doc4, doc5) {
      if(err) throw err;

      console.log(doc1, doc2, doc3, doc4, doc5);

      product.save(function (err) {
        if (err) throw err;
        console.log(product);
      })

    })
  })
})
*/



