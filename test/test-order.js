var mongodb = require('mongodb');

var dbConnector = new mongodb.Db('2dc', new mongodb.Server("127.0.0.1", 27017, {}), {
    w: 1
    //, strict:true
});
var col = dbConnector.collection('categories')
/*
col.findOne({name:'blah'}, function(err, doc){
    if(err) throw err;
    console.log(doc);
})*/
col.ensureIndex('name', {unique: true}, function(err, num) {
    if(err) throw err;
    console.log(num)
});