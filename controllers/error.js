var error = function (err, req, res, next) {
  // `throw 500` is different from `throw new Error(500)`
  // the former automatically gives it a status property.
  // next(404) also pass an error obj, who has status 404.
  // the `makeError` arbitrary function can pass msg too (the 2nd param)

  console.log('here we are at the custom error handler,\nthe error is:\n')
  console.log(err);
  if(typeof err === "number") err = {status: err};
  switch (err.status) {
    case 404:
      return error.e404(req, res, next);
      break;
    // does it mean we'll never see that pretty `default error page` again?
    case 500:
      // Error property has some non-enumerable properties.
      /*console.log(Object.getOwnPropertyNames(err));
       console.log(Object.getOwnPropertyDescriptor(err, 'stack').get.toString());
       console.log(err.stack);
       console.log(Object.getOwnPropertyDescriptor(err, 'message'));
       console.log(require('util').inspect(err, {depth: 4, showHidden: true}));*/
      return error.e500(err, req, res, next);
      break;
    default :

  }
  switch  (err.name) {
    case 'ValidationError':
      // here we assume ValidationError always has err.errors.fieldName
      var e = err.errors[Object.keys(err.errors)[0]];
      return error.e500(e, req, res);
      // break seems unnecessary
      break;
    case 'CastError':
      if(err.type === 'ObjectId') {
        console.log('though CastError, we tell the viewer the url does not exist');
        return error.e404(req, res, next);
      }
      // err.type could be `number`
      return error.e500(err, req, res);
      break;
  }

  next(err);
};

error.e500 = function (err, req, res, next) {
    // no next, final offer
    res.status(err.status || 500);
    res.render('errors/500', { title: 'error 500', error: err });
}

// the last place to go (if program cannot find anything to route)
// arbitrary code by programmers, like `throw 404` goes here<- is this true? I don't think so.
error.e404 = function (req, res, next) {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('errors/404', { title: 'error 404', url: req.url });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
}

error.makeError = function (status, msg) {
  var e = new Error(msg);
  e.status = status;
  return e;
}

module.exports = exports = error;