var category = require('./category')
    , util = require('util');

function index(req, res) {
    res.render('home', {
      title: '企业防伪平台',
      categories: category.tree,
      categExpanded: true
    });


}


exports.index = index;