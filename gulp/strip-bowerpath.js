/**
 * this module just strip bower_components from path.
 * use lib `strip-path` grab from npm
 * but shim it since it does not work as I expected
 */

var strip = require('strip-path');
var fs = require('fs')
var path = require('path')

var re_shim = new RegExp("^\\" + path.sep + "*");
var bowerpath;
try{
    var str = fs.readFileSync( path.join(__dirname , '../.bowerrc'), {encoding: "utf8"});
    bowerpath = JSON.parse(str).directory;
}catch(e){
    //console.log(e);
}
bowerpath = bowerpath || "bower_components";



module.exports = function (path) {
    path = strip(path, bowerpath);
    return path.replace(re_shim, '');
}