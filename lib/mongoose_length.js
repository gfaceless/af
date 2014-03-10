var Schema = require('mongoose').Schema;
var util = require('util');
var SchemaString = Schema.Types.String;

SchemaString.prototype.maxlength = function ( number, message) {

  var msg = message || "at most " + number + " length";

  function matchValidator (str){
    return str.length <= number;
  }

  this.validators.push([matchValidator, msg, 'user definedddd']);
  return this;
};

SchemaString.prototype.minlength = function ( number, message) {

  var msg = message || "at least " + number + " length";

  function matchValidator (str){
    return str.length >= number;
  }

  this.validators.push([matchValidator, msg, 'user definedddd']);
  return this;
};

SchemaString.prototype.rangelength = function (min, max, message) {

  var msg = message || "should be within range: " + min + '-' + max;

  function matchValidator (str){
    return str.length >= min && str.length <= max
  }

  this.validators.push([matchValidator, msg, 'user definedddd']);
  return this;
};