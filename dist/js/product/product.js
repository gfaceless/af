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

var
    $container,
    $btn,
    $selected,
    $input,
    $menu

var defaults = {
    container: ".category-picker",
    btn: ".btn-select",
    selected: ".category-selected",
    input: "input",
    menu: ".category-menu"
};


module.exports = picker;


function _init(opts) {

    opts = opts || {};
    // TODO: I wish I could use lodash.defaults
    opts = $.extend(defaults, opts);

    $container = $(opts.container);
    $btn = $(opts.btn);
    $selected = $(opts.selected);
    $input = $container.find(opts.input);
    $menu = $container.find(opts.menu);
}

function _showMenu() {
    $menu.find('>dl').show();

    $menu.show();
}
function _off() {
    _hideMenu();
    $('html').off('click keydown');
}
function _hideMenu() {
    $menu.hide();
}

function _bind() {
    $btn.on('click', function (e) {
        e.stopPropagation();
        _showMenu();

        $('html')
            .on('click', _off)
            .on('keydown', function (e) { if (e.keyCode == 27)  _off(); })
    });

    $menu.on('click', "a", function () {
        var $this = $(this);
        if(!$this.parent().hasClass('lvl3')) {
            alert('暂时只支持底层类别选择');
            return false;
        }
        var href = $this.attr('href');
        var match = href.match(/category=(\w+)/);
        match = match && match[1];

        $selected.text($this.text());
        $input.val(match);
        _hideMenu();
        // validate it if we have validation plugin
        // not only returns true/false, but ALSO TRIGGER THE FEEDBACK
        if($input.valid) $input.valid();

        return false;
    })


}
function picker(opts) {
    _init(opts);
    _bind();
}


},{}],3:[function(require,module,exports){
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
},{"jquery-validation":"id2yvk"}],4:[function(require,module,exports){
var $ = (window.jQuery);
var options;
var defaults = {
    container: ".info-added"

};

var $container
    , initialized
    , $dom

module.exports = factory;

function factory(opts) {
    _init(opts);
    return addFormSet;
}

function _createDom() {
    var $form_set = $("<div/>", {"class": "form-set"})
    var $label_input_wrapper = $('<div/>', {"class": "label-input-wrapper"})
    var $input_wrapper = $('<div/>', {"class": 'input-wrapper'});
    var $error_wrapper = $('<div/>', {"class": 'error-wrapper'});

    $input_wrapper.append(
        $('<input/>', {"class": "form-control"}),
        $('<button/>',{"type": "button", "class": "form-set-remove"})
            .append($('<span/>'))
    );

    $label_input_wrapper.append(
        $("<input/>", {"class": "form-control", placeholder: "(例:内径)"} )
    )

    return $form_set.append(
        $label_input_wrapper, $input_wrapper, $error_wrapper
    )


}

function _clone() {
    $dom = $dom || _createDom();
    return $dom.clone();
}
function addFormSet() {
    $container.append(_clone());
}
function _bind() {

    $container.on('click', ".form-set-remove", function () {
        $(this).parents(".form-set").remove();
    });
    $container.parents('form').on('submit', function () {
        var $label_inputs = $container.find('.label-input-wrapper input');

        function setName(el, name) {
            $(el).parent().next().find('input')
                .prop('name', "product[extra][" + name + "]");
        }

        $label_inputs.each(function (i, el) {
            var name = $.trim($(el).val());
            if(name) setName(el, name);
        });

    });


}


function _init(opts) {
    options = $.extend(defaults, opts);
    $container = $(options.container);
    _bind();
}
},{}],5:[function(require,module,exports){
var $ = (window.jQuery);

require('../lib/form-validation');
require('../base/picker')();
require('../base/img-upload')();

var addFormSet = require('./add-form-set')({container: ".info-added"});

$('.btn-more').click(function () {
    $('.info-more').toggle();
});

$('.btn-add').click(addFormSet);



},{"../base/img-upload":1,"../base/picker":2,"../lib/form-validation":3,"./add-form-set":4}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxcY29kZXNcXG5vZGVqc1xcYWZcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvYmFzZS9pbWctdXBsb2FkLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvYmFzZS9waWNrZXIuanMiLCJlOi9jb2Rlcy9ub2RlanMvYWYvYXBwL2NsaWVudC9qcy9saWIvZm9ybS12YWxpZGF0aW9uLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvcHJvZHVjdC9hZGQtZm9ybS1zZXQuanMiLCJlOi9jb2Rlcy9ub2RlanMvYWYvYXBwL2NsaWVudC9qcy9wcm9kdWN0L3Byb2R1Y3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGltZ191cGxvYWRfc2VsZWN0b3IgPSBcIiNpbWctdXBsb2FkXCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICAkKHNlbGVjdG9yIHx8IGltZ191cGxvYWRfc2VsZWN0b3IgKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciAkZm9ybSA9ICR0aGlzLnBhcmVudHMoJ2Zvcm0nKTtcclxuICAgICAgICBpZigkdGhpcy52YWwoKSkgICRmb3JtLmF0dHIoJ2VuY3R5cGUnLCBcIm11bHRpcGFydC9mb3JtLWRhdGFcIik7XHJcbiAgICAgICAgLy8gYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXHJcbiAgICAgICAgZWxzZSAkZm9ybS5hdHRyKCdlbmN0eXBlJywgbnVsbCk7XHJcbiAgICB9KTtcclxuXHJcbn07XHJcblxyXG4iLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KTtcclxuXHJcbnZhclxyXG4gICAgJGNvbnRhaW5lcixcclxuICAgICRidG4sXHJcbiAgICAkc2VsZWN0ZWQsXHJcbiAgICAkaW5wdXQsXHJcbiAgICAkbWVudVxyXG5cclxudmFyIGRlZmF1bHRzID0ge1xyXG4gICAgY29udGFpbmVyOiBcIi5jYXRlZ29yeS1waWNrZXJcIixcclxuICAgIGJ0bjogXCIuYnRuLXNlbGVjdFwiLFxyXG4gICAgc2VsZWN0ZWQ6IFwiLmNhdGVnb3J5LXNlbGVjdGVkXCIsXHJcbiAgICBpbnB1dDogXCJpbnB1dFwiLFxyXG4gICAgbWVudTogXCIuY2F0ZWdvcnktbWVudVwiXHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwaWNrZXI7XHJcblxyXG5cclxuZnVuY3Rpb24gX2luaXQob3B0cykge1xyXG5cclxuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xyXG4gICAgLy8gVE9ETzogSSB3aXNoIEkgY291bGQgdXNlIGxvZGFzaC5kZWZhdWx0c1xyXG4gICAgb3B0cyA9ICQuZXh0ZW5kKGRlZmF1bHRzLCBvcHRzKTtcclxuXHJcbiAgICAkY29udGFpbmVyID0gJChvcHRzLmNvbnRhaW5lcik7XHJcbiAgICAkYnRuID0gJChvcHRzLmJ0bik7XHJcbiAgICAkc2VsZWN0ZWQgPSAkKG9wdHMuc2VsZWN0ZWQpO1xyXG4gICAgJGlucHV0ID0gJGNvbnRhaW5lci5maW5kKG9wdHMuaW5wdXQpO1xyXG4gICAgJG1lbnUgPSAkY29udGFpbmVyLmZpbmQob3B0cy5tZW51KTtcclxufVxyXG5cclxuZnVuY3Rpb24gX3Nob3dNZW51KCkge1xyXG4gICAgJG1lbnUuZmluZCgnPmRsJykuc2hvdygpO1xyXG5cclxuICAgICRtZW51LnNob3coKTtcclxufVxyXG5mdW5jdGlvbiBfb2ZmKCkge1xyXG4gICAgX2hpZGVNZW51KCk7XHJcbiAgICAkKCdodG1sJykub2ZmKCdjbGljayBrZXlkb3duJyk7XHJcbn1cclxuZnVuY3Rpb24gX2hpZGVNZW51KCkge1xyXG4gICAgJG1lbnUuaGlkZSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfYmluZCgpIHtcclxuICAgICRidG4ub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIF9zaG93TWVudSgpO1xyXG5cclxuICAgICAgICAkKCdodG1sJylcclxuICAgICAgICAgICAgLm9uKCdjbGljaycsIF9vZmYpXHJcbiAgICAgICAgICAgIC5vbigna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7IGlmIChlLmtleUNvZGUgPT0gMjcpICBfb2ZmKCk7IH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICAkbWVudS5vbignY2xpY2snLCBcImFcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYoISR0aGlzLnBhcmVudCgpLmhhc0NsYXNzKCdsdmwzJykpIHtcclxuICAgICAgICAgICAgYWxlcnQoJ+aaguaXtuWPquaUr+aMgeW6leWxguexu+WIq+mAieaLqScpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBocmVmID0gJHRoaXMuYXR0cignaHJlZicpO1xyXG4gICAgICAgIHZhciBtYXRjaCA9IGhyZWYubWF0Y2goL2NhdGVnb3J5PShcXHcrKS8pO1xyXG4gICAgICAgIG1hdGNoID0gbWF0Y2ggJiYgbWF0Y2hbMV07XHJcblxyXG4gICAgICAgICRzZWxlY3RlZC50ZXh0KCR0aGlzLnRleHQoKSk7XHJcbiAgICAgICAgJGlucHV0LnZhbChtYXRjaCk7XHJcbiAgICAgICAgX2hpZGVNZW51KCk7XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgaXQgaWYgd2UgaGF2ZSB2YWxpZGF0aW9uIHBsdWdpblxyXG4gICAgICAgIC8vIG5vdCBvbmx5IHJldHVybnMgdHJ1ZS9mYWxzZSwgYnV0IEFMU08gVFJJR0dFUiBUSEUgRkVFREJBQ0tcclxuICAgICAgICBpZigkaW5wdXQudmFsaWQpICRpbnB1dC52YWxpZCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG5cclxuXHJcbn1cclxuZnVuY3Rpb24gcGlja2VyKG9wdHMpIHtcclxuICAgIF9pbml0KG9wdHMpO1xyXG4gICAgX2JpbmQoKTtcclxufVxyXG5cclxuIiwidmFyICQgPSAod2luZG93LmpRdWVyeSk7XHJcbnJlcXVpcmUoJ2pxdWVyeS12YWxpZGF0aW9uJyk7XHJcblxyXG52YXIgZm9ybV9zZWxlY3RvciA9ICdmb3JtLm1haW4tY29udGVudCc7XHJcbnZhciBjb250YWluZXJfc2VsZWN0b3IgPSBcIi5mb3JtLXNldFwiO1xyXG5cclxuXHJcbnZhciBjaGluZXNlTXNnID0ge1xyXG4gICAgcmVxdWlyZWQ6IFwi5b+F5aGrXCIsXHJcbiAgICBtaW5sZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdChcIuivt+i+k+WFpeS4jeWwkeS6jnswfeS4quWtl1wiKSxcclxuICAgIG1heGxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KFwi6K+36L6T5YWl5LiN5aSa5LqOezB95Liq5a2XXCIpLFxyXG4gICAgcmFuZ2VsZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdChcIuivt+i+k+WFpXswfS17MX3kuKrlrZdcIilcclxufTtcclxuXHJcbiQuZXh0ZW5kKCQudmFsaWRhdG9yLm1lc3NhZ2VzLCBjaGluZXNlTXNnKTtcclxuXHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICAgIHZhbGlkQ2xhc3M6IFwiaGFzLXN1Y2Nlc3NcIixcclxuICAgIGVycm9yQ2xhc3M6IFwiaGFzLWVycm9yXCIsXHJcblxyXG4gICAgaGlnaGxpZ2h0OiBmdW5jdGlvbihlbGVtZW50LCBlcnJvckNsYXNzLCB2YWxpZENsYXNzKSB7XHJcbiAgICAgICAgJChlbGVtZW50KS5wYXJlbnRzKGNvbnRhaW5lcl9zZWxlY3RvcilcclxuICAgICAgICAgICAgLmFkZENsYXNzKGVycm9yQ2xhc3MpLnJlbW92ZUNsYXNzKHZhbGlkQ2xhc3MpO1xyXG4gICAgfSxcclxuICAgIHVuaGlnaGxpZ2h0OiBmdW5jdGlvbihlbGVtZW50LCBlcnJvckNsYXNzLCB2YWxpZENsYXNzKSB7XHJcbiAgICAgICAgJChlbGVtZW50KS5wYXJlbnRzKGNvbnRhaW5lcl9zZWxlY3RvcilcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGVycm9yQ2xhc3MpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyh2YWxpZENsYXNzKVxyXG4gICAgfSwvKlxyXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKCRsYWJlbCwgZWxlbWVudCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xyXG4gICAgICAgICQoZWxlbWVudCkucGFyZW50cyhjb250YWluZXJfc2VsZWN0b3IpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyh0aGlzLmVycm9yQ2xhc3MpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyh0aGlzLnZhbGlkQ2xhc3MpXHJcbiAgICB9LCovXHJcblxyXG5cclxuICAgIGVycm9yUGxhY2VtZW50OiBmdW5jdGlvbihlcnJvciwgZWxlbWVudCkge1xyXG4gICAgICAgIGVycm9yLmFwcGVuZFRvKCBlbGVtZW50LnBhcmVudCgpLm5leHQoKSApO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgIC8qc2hvd0Vycm9yczogZnVuY3Rpb24oZXJyb3JNYXAsIGVycm9yTGlzdCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yTWFwLCBlcnJvckxpc3QpO1xyXG4gICAgfSovXHJcbn07XHJcblxyXG52YXIgb3B0aW9ucyA7XHJcbnRyeSB7XHJcbiAgICAvLyBXZSBtdXN0IHVzZSAuaHRtbCgpIGluc3RlYWQgb2YgLnRleHQoKSwgdGhlIGxhdHRlciByZXR1cm5zIGVtcHR5IHN0cmluZyB1bmRlciBpZTg7XHJcbiAgICBvcHRpb25zID0gSlNPTi5wYXJzZSgkKCcjdmFsLW9wdGlvbnMnKS5odG1sKCkpO1xyXG59IGNhdGNoIChlKSB7IH1cclxub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG5cclxuJC5leHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG5cclxuLy8gZm9yIHBhc3N3b3JkIG9ubHk6XHJcbi8vIFRPRE86IGRlbGV0ZSBmb2xsb3dpbmcsIHVzZSBuYW1lIGluc3RlYWQgKGFmdGVyIHN0cmVuZ3RoZW5pbmcgYmFjay1lbmQgbmFtZS1maWx0ZXIpXHJcblxyXG4kKGZvcm1fc2VsZWN0b3IpLnZhbGlkYXRlKGRlZmF1bHRzKTsiLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KTtcclxudmFyIG9wdGlvbnM7XHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICAgIGNvbnRhaW5lcjogXCIuaW5mby1hZGRlZFwiXHJcblxyXG59O1xyXG5cclxudmFyICRjb250YWluZXJcclxuICAgICwgaW5pdGlhbGl6ZWRcclxuICAgICwgJGRvbVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xyXG5cclxuZnVuY3Rpb24gZmFjdG9yeShvcHRzKSB7XHJcbiAgICBfaW5pdChvcHRzKTtcclxuICAgIHJldHVybiBhZGRGb3JtU2V0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBfY3JlYXRlRG9tKCkge1xyXG4gICAgdmFyICRmb3JtX3NldCA9ICQoXCI8ZGl2Lz5cIiwge1wiY2xhc3NcIjogXCJmb3JtLXNldFwifSlcclxuICAgIHZhciAkbGFiZWxfaW5wdXRfd3JhcHBlciA9ICQoJzxkaXYvPicsIHtcImNsYXNzXCI6IFwibGFiZWwtaW5wdXQtd3JhcHBlclwifSlcclxuICAgIHZhciAkaW5wdXRfd3JhcHBlciA9ICQoJzxkaXYvPicsIHtcImNsYXNzXCI6ICdpbnB1dC13cmFwcGVyJ30pO1xyXG4gICAgdmFyICRlcnJvcl93cmFwcGVyID0gJCgnPGRpdi8+Jywge1wiY2xhc3NcIjogJ2Vycm9yLXdyYXBwZXInfSk7XHJcblxyXG4gICAgJGlucHV0X3dyYXBwZXIuYXBwZW5kKFxyXG4gICAgICAgICQoJzxpbnB1dC8+Jywge1wiY2xhc3NcIjogXCJmb3JtLWNvbnRyb2xcIn0pLFxyXG4gICAgICAgICQoJzxidXR0b24vPicse1widHlwZVwiOiBcImJ1dHRvblwiLCBcImNsYXNzXCI6IFwiZm9ybS1zZXQtcmVtb3ZlXCJ9KVxyXG4gICAgICAgICAgICAuYXBwZW5kKCQoJzxzcGFuLz4nKSlcclxuICAgICk7XHJcblxyXG4gICAgJGxhYmVsX2lucHV0X3dyYXBwZXIuYXBwZW5kKFxyXG4gICAgICAgICQoXCI8aW5wdXQvPlwiLCB7XCJjbGFzc1wiOiBcImZvcm0tY29udHJvbFwiLCBwbGFjZWhvbGRlcjogXCIo5L6LOuWGheW+hClcIn0gKVxyXG4gICAgKVxyXG5cclxuICAgIHJldHVybiAkZm9ybV9zZXQuYXBwZW5kKFxyXG4gICAgICAgICRsYWJlbF9pbnB1dF93cmFwcGVyLCAkaW5wdXRfd3JhcHBlciwgJGVycm9yX3dyYXBwZXJcclxuICAgIClcclxuXHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBfY2xvbmUoKSB7XHJcbiAgICAkZG9tID0gJGRvbSB8fCBfY3JlYXRlRG9tKCk7XHJcbiAgICByZXR1cm4gJGRvbS5jbG9uZSgpO1xyXG59XHJcbmZ1bmN0aW9uIGFkZEZvcm1TZXQoKSB7XHJcbiAgICAkY29udGFpbmVyLmFwcGVuZChfY2xvbmUoKSk7XHJcbn1cclxuZnVuY3Rpb24gX2JpbmQoKSB7XHJcblxyXG4gICAgJGNvbnRhaW5lci5vbignY2xpY2snLCBcIi5mb3JtLXNldC1yZW1vdmVcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQodGhpcykucGFyZW50cyhcIi5mb3JtLXNldFwiKS5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG4gICAgJGNvbnRhaW5lci5wYXJlbnRzKCdmb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGxhYmVsX2lucHV0cyA9ICRjb250YWluZXIuZmluZCgnLmxhYmVsLWlucHV0LXdyYXBwZXIgaW5wdXQnKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc2V0TmFtZShlbCwgbmFtZSkge1xyXG4gICAgICAgICAgICAkKGVsKS5wYXJlbnQoKS5uZXh0KCkuZmluZCgnaW5wdXQnKVxyXG4gICAgICAgICAgICAgICAgLnByb3AoJ25hbWUnLCBcInByb2R1Y3RbZXh0cmFdW1wiICsgbmFtZSArIFwiXVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRsYWJlbF9pbnB1dHMuZWFjaChmdW5jdGlvbiAoaSwgZWwpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSAkLnRyaW0oJChlbCkudmFsKCkpO1xyXG4gICAgICAgICAgICBpZihuYW1lKSBzZXROYW1lKGVsLCBuYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9KTtcclxuXHJcblxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gX2luaXQob3B0cykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKGRlZmF1bHRzLCBvcHRzKTtcclxuICAgICRjb250YWluZXIgPSAkKG9wdGlvbnMuY29udGFpbmVyKTtcclxuICAgIF9iaW5kKCk7XHJcbn0iLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KTtcclxuXHJcbnJlcXVpcmUoJy4uL2xpYi9mb3JtLXZhbGlkYXRpb24nKTtcclxucmVxdWlyZSgnLi4vYmFzZS9waWNrZXInKSgpO1xyXG5yZXF1aXJlKCcuLi9iYXNlL2ltZy11cGxvYWQnKSgpO1xyXG5cclxudmFyIGFkZEZvcm1TZXQgPSByZXF1aXJlKCcuL2FkZC1mb3JtLXNldCcpKHtjb250YWluZXI6IFwiLmluZm8tYWRkZWRcIn0pO1xyXG5cclxuJCgnLmJ0bi1tb3JlJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgJCgnLmluZm8tbW9yZScpLnRvZ2dsZSgpO1xyXG59KTtcclxuXHJcbiQoJy5idG4tYWRkJykuY2xpY2soYWRkRm9ybVNldCk7XHJcblxyXG5cclxuIl19
