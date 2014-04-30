var $ = require('jquery');


var $menu = $('.category-menu');
var $back = $('.btn-back');
var $remove = $('.btn-remove');

if ($menu.length) {
    $menu.first().children('h2')
        .on('click', function () {
            $(this).next().toggle();
        })
        .on('mouseover', function () {
            $(this).next().show();
        });

    $menu.children('dl').on('mouseenter mouseleave', '>dd', function (e) {
        // TODO: 1. lazy init; 2. cache for smoothness
        $(this).prev().toggleClass('highlight');
    });
}


//TODO: definitely should not be here: should be in './base/form.js'
if ($back.length) {
    $back.click(function () {
        history && history.back();
    });
}

if ($remove.length) {
    $remove.click(function () {
        if (!confirm('确定要删除么')) return false;
    });
}
