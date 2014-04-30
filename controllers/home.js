var mongoose = require('mongoose')

  , Category = mongoose.model('Category')
  , Product = mongoose.model('Product')
  , _ = require('underscore')
  , async = require('async')






function index(req, res, next) {

  res.render('home', {
    title: '企业防伪平台',
    home: true
  });


}


exports.index = index;