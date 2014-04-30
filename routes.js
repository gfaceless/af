var user = require('./controllers/user')
  , main = require('./controllers/home')
  , product = require('./controllers/product')
  , mfr = require('./controllers/manufacturer')
  , category = require('./controllers/category')
  , sale = require('./controllers/sale.js')
//  , makeError = require('./controllers/error.js').makeError;

var permission = require('./controllers/permission')
  , requireLogin = permission.login
  , requireMfr = permission.mfr
  , requireNonMfr = permission.nonMfr
  , requireSelf = permission.self()
  , requireAdmin = permission.admin

//  , requirePSelf = requireSelf( {admin: true, fn: product.requireSelf} )

var mongoose = require('mongoose')
  , Mfr = mongoose.model('Mfr')
  , User = mongoose.model('User')
  , Product = mongoose.model('Product')



function startRoute(app) {

  app.get('/test-jade', function (req, res, next) {
    res.render('test/test-jade', {
      data: [
        {name: 'what', id: '123'},
        {name: 'what', id: '124'},
      ]})
  });

  app.get('/test-index', function (req, res, next) {
    Product.index(function (err, results) {
      console.log('in test-index');
      console.log(results);
    });
  })

  app.post('/test-upload', function (req, res,next) {
    console.log(req.files);
    setTimeout(function(){res.send(req.files);}, 5000);
  });



  // TODO: use app.param?

  app.get('/', main.index);

  function checkId (req, res, next){
    var id = req.params['_id'];
    if(!id || !id.match(/^[0-9a-fA-F]{24}$/)) return next('route');
    next();
  }

  // preparations
  app.all('/users/:_id/:op?', checkId, user.prep);
  app.all('/mfrs/:_id/:op?', checkId, mfr.prep);
  app.all('/products/:_id/:op?', checkId, product.prep);
  app.get('/sales', sale.prep);


  app.get('/products/register', requireMfr, product.add);
  app.post('/products/register', requireMfr, product.create);

  // order matters
  app.get('/products/list', product.list);
  app.get('/products', product.list);
  app.get('/products/:_id', product.show);

  app.get('/products/:_id/edit', requireSelf, product.edit);
//  app.post('/products/:_id/edit', requireSelf, product.update);
  app.put('/products/:_id/edit', requireSelf, product.update);
  app.del('/products/:_id', requireSelf, product.destroy);


  // synonym: sign up
  app.get('/users/register', user.add);
  app.post('/users/register', user.create);

  // check if a user already exists:
  app.get('/users/userexists', user.checkUser);

  // TODO: see if loginGet & login can be congregated:
  app.get('/users/login', user.loginGet);
  app.post('/users/login', user.login);
  app.get('/users/logout', requireLogin, user.logout);

  app.get('/users/list', requireAdmin, user.list);
  app.get('/users', requireAdmin, user.list);
  app.del('/users/:_id', requireAdmin, user.destroy);

  app.all('/mfrs/register', requireNonMfr);
  app.get('/mfrs/register', mfr.add);
  app.post('/mfrs/register', mfr.create);

  app.get('/mfrs/list', mfr.list);
  app.get('/mfrs', mfr.list);

  app.get('/mfrs/:_id', mfr.show);
  app.get('/mfrs/:_id/edit', requireSelf, mfr.edit);
  app.put('/mfrs/:_id/edit', requireSelf, mfr.update);


//  app.get('/sales/:code', sale.check)
//  app.post('/sales', sale.upload)*/


  app.get('/sales', requireSelf, sale.list);
  app.get('/sales/:_id/download', sale.download);
  app.get('/sales/:_id/:code', checkId, sale.check);
  app.post('/sales/:_id'/*, requireSelf*/, sale.upload);
  app.post('/sales/:_id/download', sale.download);


  app.all('/manage/*', requireAdmin);

  // we use singular: (would like to use singular in the future)
  app.post('/manage/category', category.create);
  app.get('/manage/category', category.list);
  app.get('/manage/category/edit', category.edit);
  app.del('/manage/category/:_id', category.destroy);
  app.put('/manage/category/:_id', category.update);
  app.post('/manage/category/refresh', category.refresh);




  /*var route = function (app, controllers) {

    var fns = {
      //crud
      add: {noId: true},
      create: {method: 'post', subpath: '', noId: true},

      show: '',
      list: {isPl: true},

      edit: '',
      update: {method: 'put', subpath: null},

      destroy: {method: 'del', subpath: ''}
    }
    controllers.forEach(function (c) {

      Object.keys(fns).forEach(function (fnName) {
        var obj = fns[fnName]
          , method = obj.method || 'get'
          , path
          , pathPrefix
          , mainpath
          , subpath = (typeof obj.subpath === 'undefined') ? fnName : obj.subpath;
        pathPrefix = (c.pathPrefix || '') + '/';
        subpath = ( obj.noId || obj.isPl ? '' : '/:' + c.idField ) + (subpath ? '/' + subpath : '');
        mainpath = (obj.isPl ? c.plName : c.name);
        path = '/' + pathPrefix + mainpath + subpath;
        console.log(fnName, method, path);

        // we don't use c[fnName].bind(c)
        // because later we will delete the function, leaving only the prototype
        // bind will make it stay referenced (though deleted)
        c[fnName] && app[method](path, function () {
          c[fnName].apply(c, arguments);
        });
      })
    })
  }
  route(app, [category]);*/

}


module.exports = exports = startRoute;