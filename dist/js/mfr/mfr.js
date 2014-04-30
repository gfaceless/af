(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var img_upload_selector = "#img-upload"

module.exports = function (selector) {
    $(selector || img_upload_selector ).on('change', function () {

        var $this = $(this);
        var $form = $this.parents('form');
        if($this.val())  $form.attr('enctype', "multipart/form-data");
        // application/x-www-form-urlencoded
        else $form.attr('enctype', null);
    });

};


},{}],2:[function(require,module,exports){
var $ = (window.jQuery);
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
},{"jquery-validation":"id2yvk"}],3:[function(require,module,exports){
var $ = (window.jQuery);

require('../lib/form-validation');

require('../base/img-upload')();
},{"../base/img-upload":1,"../lib/form-validation":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxcY29kZXNcXG5vZGVqc1xcYWZcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvYmFzZS9pbWctdXBsb2FkLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvbGliL2Zvcm0tdmFsaWRhdGlvbi5qcyIsImU6L2NvZGVzL25vZGVqcy9hZi9hcHAvY2xpZW50L2pzL21mci9tZnIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBpbWdfdXBsb2FkX3NlbGVjdG9yID0gXCIjaW1nLXVwbG9hZFwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgJChzZWxlY3RvciB8fCBpbWdfdXBsb2FkX3NlbGVjdG9yICkub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgJGZvcm0gPSAkdGhpcy5wYXJlbnRzKCdmb3JtJyk7XHJcbiAgICAgICAgaWYoJHRoaXMudmFsKCkpICAkZm9ybS5hdHRyKCdlbmN0eXBlJywgXCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIpO1xyXG4gICAgICAgIC8vIGFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFxyXG4gICAgICAgIGVsc2UgJGZvcm0uYXR0cignZW5jdHlwZScsIG51bGwpO1xyXG4gICAgfSk7XHJcblxyXG59O1xyXG5cclxuIiwidmFyICQgPSAod2luZG93LmpRdWVyeSk7XHJcbnJlcXVpcmUoJ2pxdWVyeS12YWxpZGF0aW9uJyk7XHJcblxyXG52YXIgZm9ybV9zZWxlY3RvciA9ICdmb3JtLm1haW4tY29udGVudCc7XHJcbnZhciBjb250YWluZXJfc2VsZWN0b3IgPSBcIi5mb3JtLXNldFwiO1xyXG5cclxuXHJcbnZhciBjaGluZXNlTXNnID0ge1xyXG4gICAgcmVxdWlyZWQ6IFwi5b+F5aGrXCIsXHJcbiAgICBtaW5sZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdChcIuivt+i+k+WFpeS4jeWwkeS6jnswfeS4quWtl1wiKSxcclxuICAgIG1heGxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KFwi6K+36L6T5YWl5LiN5aSa5LqOezB95Liq5a2XXCIpLFxyXG4gICAgcmFuZ2VsZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdChcIuivt+i+k+WFpXswfS17MX3kuKrlrZdcIilcclxufTtcclxuXHJcbiQuZXh0ZW5kKCQudmFsaWRhdG9yLm1lc3NhZ2VzLCBjaGluZXNlTXNnKTtcclxuXHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICAgIHZhbGlkQ2xhc3M6IFwiaGFzLXN1Y2Nlc3NcIixcclxuICAgIGVycm9yQ2xhc3M6IFwiaGFzLWVycm9yXCIsXHJcblxyXG4gICAgaGlnaGxpZ2h0OiBmdW5jdGlvbihlbGVtZW50LCBlcnJvckNsYXNzLCB2YWxpZENsYXNzKSB7XHJcbiAgICAgICAgJChlbGVtZW50KS5wYXJlbnRzKGNvbnRhaW5lcl9zZWxlY3RvcilcclxuICAgICAgICAgICAgLmFkZENsYXNzKGVycm9yQ2xhc3MpLnJlbW92ZUNsYXNzKHZhbGlkQ2xhc3MpO1xyXG4gICAgfSxcclxuICAgIHVuaGlnaGxpZ2h0OiBmdW5jdGlvbihlbGVtZW50LCBlcnJvckNsYXNzLCB2YWxpZENsYXNzKSB7XHJcbiAgICAgICAgJChlbGVtZW50KS5wYXJlbnRzKGNvbnRhaW5lcl9zZWxlY3RvcilcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGVycm9yQ2xhc3MpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyh2YWxpZENsYXNzKVxyXG4gICAgfSwvKlxyXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKCRsYWJlbCwgZWxlbWVudCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xyXG4gICAgICAgICQoZWxlbWVudCkucGFyZW50cyhjb250YWluZXJfc2VsZWN0b3IpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyh0aGlzLmVycm9yQ2xhc3MpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyh0aGlzLnZhbGlkQ2xhc3MpXHJcbiAgICB9LCovXHJcblxyXG5cclxuICAgIGVycm9yUGxhY2VtZW50OiBmdW5jdGlvbihlcnJvciwgZWxlbWVudCkge1xyXG4gICAgICAgIGVycm9yLmFwcGVuZFRvKCBlbGVtZW50LnBhcmVudCgpLm5leHQoKSApO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgIC8qc2hvd0Vycm9yczogZnVuY3Rpb24oZXJyb3JNYXAsIGVycm9yTGlzdCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yTWFwLCBlcnJvckxpc3QpO1xyXG4gICAgfSovXHJcbn07XHJcblxyXG52YXIgb3B0aW9ucyA7XHJcbnRyeSB7XHJcbiAgICAvLyBXZSBtdXN0IHVzZSAuaHRtbCgpIGluc3RlYWQgb2YgLnRleHQoKSwgdGhlIGxhdHRlciByZXR1cm5zIGVtcHR5IHN0cmluZyB1bmRlciBpZTg7XHJcbiAgICBvcHRpb25zID0gSlNPTi5wYXJzZSgkKCcjdmFsLW9wdGlvbnMnKS5odG1sKCkpO1xyXG59IGNhdGNoIChlKSB7IH1cclxub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG5cclxuJC5leHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG5cclxuLy8gZm9yIHBhc3N3b3JkIG9ubHk6XHJcbi8vIFRPRE86IGRlbGV0ZSBmb2xsb3dpbmcsIHVzZSBuYW1lIGluc3RlYWQgKGFmdGVyIHN0cmVuZ3RoZW5pbmcgYmFjay1lbmQgbmFtZS1maWx0ZXIpXHJcblxyXG4kKGZvcm1fc2VsZWN0b3IpLnZhbGlkYXRlKGRlZmF1bHRzKTsiLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KTtcclxuXHJcbnJlcXVpcmUoJy4uL2xpYi9mb3JtLXZhbGlkYXRpb24nKTtcclxuXHJcbnJlcXVpcmUoJy4uL2Jhc2UvaW1nLXVwbG9hZCcpKCk7Il19
