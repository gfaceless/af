var dbConnector = require('./db')
    , collectionM = dbConnector.collection('manufacturers');


function Mfr(){

}

// static:
Mfr.findById = function (id, fn) {
    collectionM.findOne({mid: id}, function(err, mfr){
        if(err) throw err;
        fn(mfr);
    })
}





module.exports = exports = Mfr;