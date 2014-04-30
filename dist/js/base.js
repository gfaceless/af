(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var $ = (window.jQuery);


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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxcY29kZXNcXG5vZGVqc1xcYWZcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvYmFzZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyICQgPSAod2luZG93LmpRdWVyeSk7XHJcblxyXG5cclxudmFyICRtZW51ID0gJCgnLmNhdGVnb3J5LW1lbnUnKTtcclxudmFyICRiYWNrID0gJCgnLmJ0bi1iYWNrJyk7XHJcbnZhciAkcmVtb3ZlID0gJCgnLmJ0bi1yZW1vdmUnKTtcclxuXHJcbmlmICgkbWVudS5sZW5ndGgpIHtcclxuICAgICRtZW51LmZpcnN0KCkuY2hpbGRyZW4oJ2gyJylcclxuICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLm5leHQoKS50b2dnbGUoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLm5leHQoKS5zaG93KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgJG1lbnUuY2hpbGRyZW4oJ2RsJykub24oJ21vdXNlZW50ZXIgbW91c2VsZWF2ZScsICc+ZGQnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIFRPRE86IDEuIGxhenkgaW5pdDsgMi4gY2FjaGUgZm9yIHNtb290aG5lc3NcclxuICAgICAgICAkKHRoaXMpLnByZXYoKS50b2dnbGVDbGFzcygnaGlnaGxpZ2h0Jyk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8vVE9ETzogZGVmaW5pdGVseSBzaG91bGQgbm90IGJlIGhlcmU6IHNob3VsZCBiZSBpbiAnLi9iYXNlL2Zvcm0uanMnXHJcbmlmICgkYmFjay5sZW5ndGgpIHtcclxuICAgICRiYWNrLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBoaXN0b3J5ICYmIGhpc3RvcnkuYmFjaygpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmlmICgkcmVtb3ZlLmxlbmd0aCkge1xyXG4gICAgJHJlbW92ZS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCFjb25maXJtKCfnoa7lrpropoHliKDpmaTkuYgnKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuIl19
