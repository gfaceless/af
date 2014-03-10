// use only for inheritance:
// experiment, not stable. highly likely drastically change or drop in the future.

// precisely speaking, this Constructor is generic CRUD + REST

var dbConnector = require('./db')
    , util = require('util')
    , EventEmitter = require('events').EventEmitter
    , ObjectID = require('mongodb').ObjectID;

function Crud() {
    this._init.apply(this, arguments);
}

// TODO: consider using mixin instead of directly inheritance
util.inherits(Crud, EventEmitter);

Crud.prototype.findById = function (id, fn) {
    this.collection.findOne({});
}

Crud.prototype.list = function (req, res) {
    this.collection.find({})
};

Crud.prototype.create = function (req, res) {
    var content = req.body
        , self = this
        , url
        , idField = self.idField
        , name = self.name;

    delete content._id;
    delete content[idField];
    // sanitize here. check type etc.
    this.collection.insert(content, function (err, docs) {
        if (err) throw err;
        console.log(docs);
        if (req.xhr) {
            res.send({success: true, doc: docs[0]})
        } else {

            url = '/' + name + '/' + docs[0][idField]
            res.redirect(url)
        }
    })
};

Crud.prototype.show = function (req, res) {
    var idField = this.idField
        , id = req.params[idField]
        , criteria = {}
        , self = this;
    criteria[idField] = id;
    this.collection.findOne(criteria, function (err, doc) {
        var url = '/' + self.name + '/' + id;
        if (err) throw err;
        doc = this._cloak(doc);

        res.render(url, {doc: doc});
    })

};

Crud.prototype.update = function (req, res) {

    console.log(req.headers);

    // should be a simple and generic method
    var idField = this.idField;
    var id = req.params[idField]
        , content = req.body
        , criteria = {}
        , document = {}
        , self = this;

    criteria[idField] = idField === '_id' ? ObjectID(id) : id;
    content = this._sanitize(content);

    document['$set'] = content;
    console.log('in update');
    this.collection.update(criteria, document, function (err, result) {
        if (err) throw err;
        if(req.xhr) {
            res.send({success: !!result, result:result});
            return;
        }

        if (result) {
            var url = '/' + self.name + '/' + id;
            req.flash('info', '保存成功!');
            res.redirect(url);
        } else {
            res.send(400);
        }
    })
};


Crud.prototype.destroy = function (req, res) {
    var idField = this.idField
        , id = req.params[idField]
        , criteria = {}
        , self = this;

    criteria[idField] = idField === '_id' ? ObjectID(id) : id;

    this.collection.remove(criteria, function (err, num) {
        if (err) throw err;
        if (num) {
            res.send({success: true, num: num});
        } else {
            res.send({success: false});
        }
    })

};

Crud.prototype._init = function (opt) {
    // TODO: go and learn assert!
    if (!opt.model || !opt.name) throw 'is err string only possible?';

    var model = this.model = opt.model;

    this.name = opt.name;
    this.plName = opt.plName || opt.name + 's';
    this.colName = opt.colName || this.plName;
    this.collection = dbConnector.collection(this.colName);
    console.log(this.collection);
    this.pathPrefix = opt.pathPrefix;

    // iterate model, identifying id, insureIndex,
    // and maybe some tweak of `update` (like choosing $set or $push per type)
    // TODO:  consider rename it into a name with meaning
    this._construct(model);
    this._dealAsync();

    // check if initialized..
    if (this.indexAllEnsured) {
        this.initialized = true;
    }
};


Crud.prototype._construct = function (model) {
    var self = this;

    self.indexEnsuredCount = 0;
    self.indexCounter = 0;

    self.on('indexEnsured', function () {
        self.indexEnsuredCount += 1;
        if (self.indexCount === self.indexEnsuredCount) {
            self.indexAllEnsured = true;

            // if there are other checks, also use event system to reach `initialized`
            self.initialized = true;
            self.emit('initialized');
        }
    });

    Object.keys(model).forEach(function (key, i, array) {
        var cfg = model[key];
        if (typeof cfg === 'object') {
            cfg.isId && (self.idField = key);

            if (cfg.index || cfg.unique) {
                self.indexCounter += 1;
                self._ensureIndex(key, cfg.unique, function (err, indexName) {
                    self.emit('indexEnsured'); // actually `indexTriedEnsured`
                    if (err) throw err;
                    console.log(indexName);
                });
            }
        }
        // reading array.length every time may not be a good idea.
        if (array.length - 1 === i) {
            self.idField = self.idField || '_id';
            self.indexCount = self.indexCounter;
            if (self.indexCount === 0) {
                self.indexAllEnsured = true;
            }
        }

    });
};

Crud.prototype._ensureIndex = function (field, unique, fn) {
    unique = unique || false;
    this.collection.ensureIndex(field, {unique: unique}, fn);
};


Crud.prototype._sanitize = function (data) {
    // actually a lot of work to be done
    var model = this.model
        , output = {}
        , idField = this.idField;
    Object.keys(model).forEach(function (key) {
        if (key === idField) return;
        if (data[key]) {
            // should check every field's type, restraint etc!
            // and should abuse nextTick here for async!
            // use Mongoose instead.
            output[key] = data[key];
        }
    });
    return output;

};

Crud.prototype._cloak = function (data) {
    var self = this
        , model = this.model;

    self.idField !== '_id' && delete data._id;
    Object.keys(data).forEach(function (key) {
        if (model[key] && model[key]['hide']) {
            delete data[key];
        }
    });

    return data;
};

// perhaps getter can make it done with a much better fashion
Crud.prototype._dealAsync = function (obj) {
    var self = this;
    obj = obj || Crud.prototype;
    Object.keys(obj).forEach(function (key, i) {
        var fn = obj[key];

        if (key.indexOf('_')) {
            self[key] = function () {
                var args = arguments;
                if (self.initialized) {
                    fn.apply(self, arguments);
                    delete self[key];

                } else {
                    self.once('initialized', function () {
                        fn.apply(self, args);
                        delete self[key];
                    });
                }
            }
        }
    });
};

module.exports = exports = Crud;