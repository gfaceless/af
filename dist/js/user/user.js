(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"jquery-validation":"id2yvk"}],2:[function(require,module,exports){
var $ = (window.jQuery);

require('../lib/form-validation');
var $password_again = $("#re-password");
if ($password_again.length) {
    $password_again.rules('add', {
        required: true,
        equalTo: "#password",
        messages: {
            equalTo: "密码不匹配"
        },
        "rangelength": [6,20]
    });
}
},{"../lib/form-validation":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxcY29kZXNcXG5vZGVqc1xcYWZcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvbGliL2Zvcm0tdmFsaWRhdGlvbi5qcyIsImU6L2NvZGVzL25vZGVqcy9hZi9hcHAvY2xpZW50L2pzL3VzZXIvdXNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KTtcclxucmVxdWlyZSgnanF1ZXJ5LXZhbGlkYXRpb24nKTtcclxuXHJcbnZhciBmb3JtX3NlbGVjdG9yID0gJ2Zvcm0ubWFpbi1jb250ZW50JztcclxudmFyIGNvbnRhaW5lcl9zZWxlY3RvciA9IFwiLmZvcm0tc2V0XCI7XHJcblxyXG5cclxudmFyIGNoaW5lc2VNc2cgPSB7XHJcbiAgICByZXF1aXJlZDogXCLlv4XloatcIixcclxuICAgIG1pbmxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KFwi6K+36L6T5YWl5LiN5bCR5LqOezB95Liq5a2XXCIpLFxyXG4gICAgbWF4bGVuZ3RoOiAkLnZhbGlkYXRvci5mb3JtYXQoXCLor7fovpPlhaXkuI3lpJrkuo57MH3kuKrlrZdcIiksXHJcbiAgICByYW5nZWxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KFwi6K+36L6T5YWlezB9LXsxfeS4quWtl1wiKVxyXG59O1xyXG5cclxuJC5leHRlbmQoJC52YWxpZGF0b3IubWVzc2FnZXMsIGNoaW5lc2VNc2cpO1xyXG5cclxudmFyIGRlZmF1bHRzID0ge1xyXG4gICAgdmFsaWRDbGFzczogXCJoYXMtc3VjY2Vzc1wiLFxyXG4gICAgZXJyb3JDbGFzczogXCJoYXMtZXJyb3JcIixcclxuXHJcbiAgICBoaWdobGlnaHQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGVycm9yQ2xhc3MsIHZhbGlkQ2xhc3MpIHtcclxuICAgICAgICAkKGVsZW1lbnQpLnBhcmVudHMoY29udGFpbmVyX3NlbGVjdG9yKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoZXJyb3JDbGFzcykucmVtb3ZlQ2xhc3ModmFsaWRDbGFzcyk7XHJcbiAgICB9LFxyXG4gICAgdW5oaWdobGlnaHQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGVycm9yQ2xhc3MsIHZhbGlkQ2xhc3MpIHtcclxuICAgICAgICAkKGVsZW1lbnQpLnBhcmVudHMoY29udGFpbmVyX3NlbGVjdG9yKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoZXJyb3JDbGFzcylcclxuICAgICAgICAgICAgLmFkZENsYXNzKHZhbGlkQ2xhc3MpXHJcbiAgICB9LC8qXHJcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAoJGxhYmVsLCBlbGVtZW50KSB7XHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcyk7XHJcbiAgICAgICAgJChlbGVtZW50KS5wYXJlbnRzKGNvbnRhaW5lcl9zZWxlY3RvcilcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKHRoaXMuZXJyb3JDbGFzcylcclxuICAgICAgICAgICAgLmFkZENsYXNzKHRoaXMudmFsaWRDbGFzcylcclxuICAgIH0sKi9cclxuXHJcblxyXG4gICAgZXJyb3JQbGFjZW1lbnQ6IGZ1bmN0aW9uKGVycm9yLCBlbGVtZW50KSB7XHJcbiAgICAgICAgZXJyb3IuYXBwZW5kVG8oIGVsZW1lbnQucGFyZW50KCkubmV4dCgpICk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuICAgLypzaG93RXJyb3JzOiBmdW5jdGlvbihlcnJvck1hcCwgZXJyb3JMaXN0KSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3JNYXAsIGVycm9yTGlzdCk7XHJcbiAgICB9Ki9cclxufTtcclxuXHJcbnZhciBvcHRpb25zIDtcclxudHJ5IHtcclxuICAgIC8vIFdlIG11c3QgdXNlIC5odG1sKCkgaW5zdGVhZCBvZiAudGV4dCgpLCB0aGUgbGF0dGVyIHJldHVybnMgZW1wdHkgc3RyaW5nIHVuZGVyIGllODtcclxuICAgIG9wdGlvbnMgPSBKU09OLnBhcnNlKCQoJyN2YWwtb3B0aW9ucycpLmh0bWwoKSk7XHJcbn0gY2F0Y2ggKGUpIHsgfVxyXG5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcblxyXG4kLmV4dGVuZChkZWZhdWx0cywgb3B0aW9ucyk7XHJcblxyXG4vLyBmb3IgcGFzc3dvcmQgb25seTpcclxuLy8gVE9ETzogZGVsZXRlIGZvbGxvd2luZywgdXNlIG5hbWUgaW5zdGVhZCAoYWZ0ZXIgc3RyZW5ndGhlbmluZyBiYWNrLWVuZCBuYW1lLWZpbHRlcilcclxuXHJcbiQoZm9ybV9zZWxlY3RvcikudmFsaWRhdGUoZGVmYXVsdHMpOyIsInZhciAkID0gKHdpbmRvdy5qUXVlcnkpO1xyXG5cclxucmVxdWlyZSgnLi4vbGliL2Zvcm0tdmFsaWRhdGlvbicpO1xyXG52YXIgJHBhc3N3b3JkX2FnYWluID0gJChcIiNyZS1wYXNzd29yZFwiKTtcclxuaWYgKCRwYXNzd29yZF9hZ2Fpbi5sZW5ndGgpIHtcclxuICAgICRwYXNzd29yZF9hZ2Fpbi5ydWxlcygnYWRkJywge1xyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIGVxdWFsVG86IFwiI3Bhc3N3b3JkXCIsXHJcbiAgICAgICAgbWVzc2FnZXM6IHtcclxuICAgICAgICAgICAgZXF1YWxUbzogXCLlr4bnoIHkuI3ljLnphY1cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJyYW5nZWxlbmd0aFwiOiBbNiwyMF1cclxuICAgIH0pO1xyXG59Il19
