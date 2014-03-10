var dbConnector = require('../libs/db.js')
    , ObjectID = require('mongodb').ObjectID
    , collectionC = dbConnector.collection('categories');

var array = ['汽车配件', '汽车外部用品', '汽车内部用品', '汽车养护用品', '汽车防盗用品', '汽车维护用具']
/*var root = '汽车工业行业';

array.forEach(function (item) {
    collectionC.findOne({name:item}, function(err, doc) {
        if(err) throw err;
        if (doc) {
            collectionC.update({name:root},{$push:{children: doc._id}}, function(err, num) {
                if(err) throw err;
                if(num) {
                    console.log(num);
                } else {
                    console.log('no num')
                }
            })
        }
        else {console.log('err!');}
    })
})*/

var root = '全部商品分类'



