var dbConnector = require('./db')
    , collectionP = dbConnector.collection('products')
    , crypto = require('crypto')
    , Mfr = require('./mfr')
    , EventEmitter = require('events').EventEmitter
    , upload = require('./upload');


function Product() {
    this._init.apply(this, arguments);

}


// static properties and methods:
Product.fields = ['pid', 'mid', 'name', 'category', 'desc', 'extra', 'images'];
Product.modifiableFields = ['name', 'category', 'desc', 'extra', 'images'];
Product.dicHash = {
    "made-in":'产地',
    weight:'重量',
    date:'进入市场日期'
};
Product.findById = function (id, fn) {
    collectionP.findOne({pid:id}, function (err, product) {
        if (err) throw err;
        if (product) {
            product = Product.prototype.toData(product);
            fn(product);
        } else {
            // throw an err to the ErrorHandler
        }
    })
}


// inheritance:
Product.prototype.__proto__ = EventEmitter.prototype;

// prototype:

Product.prototype.initialized = false;

Product.prototype._sanitize = function (body, modifiable) {
    var product = this;

    modifiable.forEach(function (item, i) {
        if (body[item]){
            product[item] = body[item];
        }
    });

};

// TODO: changing it to private?
Product.prototype.toData = function (product) {
    var data = {};
    product = product || this;
    Product.fields.forEach(function (item, i) {

        data[item] = product[item];

    });
    // TODO: should be more generic:
    var extra = data.extra;
    typeof extra === 'object' && Object.keys(extra).forEach(function (key) {
        var tkey = Product.dicHash[key];
        if (tkey) {
            extra[tkey] = extra[key];
            delete extra[key];
        }
    });
    return data;
};


// TODO: should be named SAVE?
Product.prototype.save = function (fn) {
    var product = this;
    var save = function () {
        collectionP.insert(product.toData(), function (err, products) {
            if (err) throw err;
            // TODO: always return an array?
            fn && fn(products[0]);
        });
    };

    this.initialized ?
        save() :
        this.once('initialized', save);

};


Product.prototype._crypt = function (fn) {
    var pid
        , product = this
        , mid = this.mid;

    Mfr.findById(mid, function (mfr) {
        crypto.randomBytes(2, function (err, buf) {
            if (err) throw err;
            pid = mid + buf.toString('hex') + mfr.count || 0;
            product.pid = pid;
            fn();
        });
    })


}

Product.prototype._init = function (body, mid, image, modifiable) {

    //TODO: when sanitize takes more time, it needs to be async too
    var product = this;
    modifiable = modifiable || Product.modifiableFields;
    product._sanitize(body, modifiable);
    if (image) {
        upload(image, function (imageName) {
            // this should actually be done in `sanitize`
            console.log(imageName);
            product.images = [];
            product.images.push(imageName);
            step();
        });
    } else {
        step();
    }
    function step() {
        product.mid = mid;

        product._crypt(function () {
            product.initialized = true;
            product.emit('initialized');
        })
    }
}


module.exports = exports = Product;
