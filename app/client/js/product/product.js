var $ = require('jquery');

require('../lib/form-validation');
require('../base/picker')();
require('../base/img-upload')();

var addFormSet = require('./add-form-set')({container: ".info-added"});

$('.btn-more').click(function () {
    $('.info-more').toggle();
});

$('.btn-add').click(addFormSet);


