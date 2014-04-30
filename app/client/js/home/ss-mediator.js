var $ = require('jquery');

var images = [];
var total;

var mediator = $({});
var dfd;

mediator.on('imgloaded', function (e, i, img) {
    // img is w/e

    images.push(img);
    _tryResolve(dfd);

});

function getNext(i) {
    var len = images.length;
    if(++i>len) return;
    if(i===len) {
        if(len<total) return;
        if(len===total) i=0;
    }
    return i;
}

function _tryResolve(dfd) {
    if(!dfd) return;
    var i = dfd.running_index;
    var next_index = getNext(i);
    if(next_index !== undefined) {
        dfd.resolve(next_index);
        dfd = null;
    }
}



function tracker(i) {
    dfd = new $.Deferred();
    dfd.running_index = i;
    _tryResolve(dfd);
    return dfd.promise();
}


mediator.init = function(sources) {
    total = sources.length;
};

mediator.track = tracker;

module.exports = mediator;