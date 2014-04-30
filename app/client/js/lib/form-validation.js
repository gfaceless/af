var $ = require('jquery');
require('jquery-validation');

var form_selector = 'form.main-content';
var container_selector = ".form-set";


var chineseMsg = {
    required: "必填",
    minlength: $.validator.format("请输入不少于{0}个字"),
    maxlength: $.validator.format("请输入不多于{0}个字"),
    rangelength: $.validator.format("请输入{0}-{1}个字")
};

$.extend($.validator.messages, chineseMsg);

var defaults = {
    validClass: "has-success",
    errorClass: "has-error",

    highlight: function(element, errorClass, validClass) {
        $(element).parents(container_selector)
            .addClass(errorClass).removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
        $(element).parents(container_selector)
            .removeClass(errorClass)
            .addClass(validClass)
    },/*
    success: function ($label, element) {
        console.log(this);
        $(element).parents(container_selector)
            .removeClass(this.errorClass)
            .addClass(this.validClass)
    },*/


    errorPlacement: function(error, element) {
        error.appendTo( element.parent().next() );
    }





   /*showErrors: function(errorMap, errorList) {
        console.log(errorMap, errorList);
    }*/
};

var options ;
try {
    // We must use .html() instead of .text(), the latter returns empty string under ie8;
    options = JSON.parse($('#val-options').html());
} catch (e) { }
options = options || {};


$.extend(defaults, options);

// for password only:
// TODO: delete following, use name instead (after strengthening back-end name-filter)

$(form_selector).validate(defaults);