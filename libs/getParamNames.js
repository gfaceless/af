/*http://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript*/

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParamNames(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '')
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g)
  if(result === null)
    result = []
  return result
}

module.exports = exports = getParamNames;