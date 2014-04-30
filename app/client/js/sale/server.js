var _ = require('lodash');

var encodedSlash = encodeURIComponent('/')
  , initialized

var productId = _extractProductId();

var defaults = productId ? {
  productId: productId,
  url: '/sales/' + productId + '/download'
} : {};

var url
  , count

function _extractProductId() {
  var arr = location.pathname.match(/sales\/([^\/]+)/);
  return arr && arr[1] ? arr[1] : undefined;
}

function init(opts) {
  _.defaults(opts = opts || {}, defaults);
  url = opts.url;
  productId = opts.productId;
  initialized = true;
}

function getTexts(count, callback) {
  if(!initialized) init();
  _getRawCodes(count, function(raws) {
    callback(_.map(raws, function (raw) {
      return _rawToUrl(raw);
    }));
  })
}


function _getRawCodes(count, callback) {

  $.ajax({
    method: 'post',
    url: url,
    data: {count: count}
  }).done(function (arr) {
      callback(arr);
    });
}

function _rawToUrl(raw) {
  raw = raw.replace('/', encodedSlash);
  return location.host + '/sales/' + productId + '/' + raw;
}


module.exports = {
  getTexts: getTexts,
  init: init
};