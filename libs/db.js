var mongodb = require('mongodb');

var dbConnector = new mongodb.Db('2dc', new mongodb.Server("127.0.0.1", 27017, {}), {
    w: 1
    //, strict:true
});

module.exports = dbConnector;