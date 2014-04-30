var mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.Types.ObjectId
  , btoa = require('btoa')
  , Sale = mongoose.model('Sale')
  , Product = mongoose.model('Product')
  , crypto = require('crypto')
  , async = require('async')

var isArray = require('util').isArray;

/*exports.check = function (req, res) {
  var code = req.params.code;
  Sale.findOne({code: code}).exec(function (err, sale) {
    if(err) throw err;
    if(sale) {
      sale.queriedCount ++;
      if(!sale.queriedDate) sale.queriedDate = new Date();
      if(!~sale.ips.indexOf(req.ip)) sale.ips.push(req.ip);
      sale.save(function (err, sale) {
        res.render('sale/check', {
          title: "查询结果",
          sale: sale
        })
      })
    } else {
      res.render('sale/check', {
        title: "查询结果",
        sale: sale
      })
    }
  })
}*/

exports.upload = function (req, res) {
  var codes = req.body.codes
    , pid = req.params._id
    , sales;
  if(!isArray(codes) || !pid) return res.send(500);
  // TODO: async this! IMPORTANT!
  sales = codes.map(function (rawCode) {
    return {
      product: pid,
      code: btoa( pid + rawCode)
    };
  })
  Sale.create(sales, function (err){
    if(err) throw err;
    res.send(200, {success: true, num: arguments.length - 1 });
  })
}

exports.list = function (req, res, next){
  var pid = req.query.pid;
  if(!pid) return next();

  Sale.find({product: pid}).exec(function(err, sales) {
    if(err) return next(err);

    res.render('sale/list',
      {title:'码源', sales: sales, product: req.queriedEl|| null }
    );
  })
};

exports.prep = function (req, res, next) {
  var id = req.query.pid
    , mid;

  if(!id) return next('route');

  mid = req.session.mid;

  Product.findById(id, function (err, product) {
    if(err) return next(err);
    if(!product) return next(404);

    if(mid && product.mfr.toString() === mid){
      req.user = req.user || {};
      req.user.isSelf = res.locals.isSelf = true;
    }
    req.queriedEl = product;

    next();
  })
};

exports.download = function (req, res, next) {
  // GET
  if(req.method == 'GET') {
    return res.render('sale/download');
  }

  // POST
  var count = req.body.count || 1;
  count = count > 2000 ? 2000 : count;
  var pid = req.params._id;
  generateCode(pid, count, function (err, digests) {
    if(err) return next(err);
    var sales = digests.map(function (digest) {
      return {
        product: pid,
        code: digest
      }
    });
    Sale.create(sales, function (err, sale1, sale2, sale3) {
      if(err) return next(err);
      // console.log(sale1, sale2, sale3);
      // if there's no err, we assume success (all arrays have been saved)
      res.send(digests);
    });
  });
};

exports.check = function (req, res, next) {
  var code = req.params.code;
  var pid = req.params._id;
  Sale.findOne({code: code}).exec(function (err, sale) {
    if (err) return next(err);
    if (!sale || sale.product.toString() !== pid) {
      res.render('sale/check', {
        title: "查询结果",
        sale: null
      });
      return;
    }
    sale.queriedCount++;
    if (!sale.queriedDate) sale.queriedDate = new Date();
    if (!~sale.ips.indexOf(req.ip)) sale.ips.push(req.ip);
    sale.save(function (err, sale) {
      res.render('sale/check', {
        title: "查询结果",
        sale: sale
      })
    })

  });
}


function generateCode(key, count, cb) {
  // different syntax for easy use:
  if(!cb && typeof count === 'function') {cb = count; count = 1;}

  //if(count > 100) {throw new TypeError('too much generating-code for now !!')}
  var fns = [];
  var fn = function (cb) {
    _generateSingleCode(key, cb);
  };
  while(count--) {fns.push( fn )}
  // callback receives an err and an array
  async.parallelLimit(fns, 20, cb);

}

function _generateSingleCode(key, cb) {
  var sha2 = crypto.createHash('sha224');

  crypto.randomBytes(48, function (err, r) {
    if(err) return cb(err);
    // default is utf8
    // using base64 is unnecessary, only slows it down.
    // it is here only for future reference.
    var str = key + Date.now() + r.toString('base64');
    sha2.update(str, 'utf8');
    var digest = sha2.digest('base64');
    // actually we could cut the last 3 `digits`, e.g "g==" "A=="
    cb(null, digest.slice(0, -3));
  });
}


















