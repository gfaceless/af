var mongoose = require('mongoose');

var SchemaType = mongoose.SchemaType;
var ValidatorError = SchemaType.ValidatorError;
SchemaType.prototype.doValidate = function (value, fn, scope) {
  var err = false
    , path = this.path
    , count = this.validators.length;

  if (!count) return fn(null);

  function validate (ok, message, type, val) {
    if (err) return;
    if (ok === undefined || ok) {
      // so when valid, this function returns undefined,
      // when all finished, returns undefined too.
      --count || fn(null);
    } else {
      fn(err = new ValidatorError(path, message, type, val));
      return true;
    }
  }

  // no async break yet:
  this.validators.some(function (v) {
    var validator = v[0]
      , message = v[1]
      , type = v[2];

    var ret;

    if (validator instanceof RegExp) {
      ret = validate(validator.test(value), message, type, value);
    } else if ('function' === typeof validator) {
      if (2 === validator.length) {
        validator.call(scope, value, function (ok) {
          validate(ok, message, type, value);
        });
      } else {
        ret = validate(validator.call(scope, value), message, type, value);
      }
    }
    return ret;
  });
};


