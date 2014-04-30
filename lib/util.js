var _ = require('lodash');

var qs = require('querystring');


module.exports = {
    extend: extend,
    extendDoc: extendDoc
}


function extend(target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (var prop in source) {
      target[prop] = source[prop];
    }
  });
  return target;
}

function extendDoc(doc, body) {
  //TODO: needs work here
  //TODO: this would ruin virtual path:
  // we can iterate check, skip when the iterating value is a function
  var paths = doc.schema.paths;


  var keys = Object.keys(paths);
  console.log('paths: ', keys);
  Object.keys(body).forEach(function (key) {
    if(!_.contains(keys, key)) delete body[key];
  });
  delete body._id;
  return extend(doc, body);
}




