(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var slideshow = require('./slideshow');

var root = '/img/slideshow/';
slideshow.init({
    images: [root + "1.jpg", root + "2.jpg", root + "3.jpg"],
    container: "#main-slideshow"
});

},{"./slideshow":2}],2:[function(require,module,exports){
var $ = (window.jQuery);
var mediator = require('./ss-mediator');
var Timer = require('../lib/timer');

// defaults:
var options = {
    interval: 5000,
    active_class: "active",
    slides_class: "slides",
    controls_class: "ss-controls"
};
var $container;
var $slides = [];
var $controls = [];
var running_index = 0;
var timer = Timer();


function toggleClass(r, n) {
    var active_class = options.active_class;
    $slides[r].removeClass(active_class);
    $slides[n].addClass(active_class);
    $controls[r].removeClass(active_class)
    $controls[n].addClass(active_class);
}

function run(r) {
    running_index = r;
    _run();

    function _run() {
        timer.delay( function () {
            mediator.track(r).done(function (n) {
                toggleClass(r, n);
                running_index = r = n;
                //console.log('running_index is:', running_index);
                _run();
            })
        }, options.interval);
    }

}


function _build() {

    $container = $(options.container)
        .append(_createSlides())
        .append(_createControls());

}

function _createSlides() {
    var $ul = $('<ul/>', {"class": options.slides_class})
    var len = options.images.length;
    var current = 0;

    // TODO: add condition when the image failed to load
    _buildImg(true).done(next);
    return $ul;

    function next(img) {
        mediator.trigger('imgloaded', [current, img]);
        if (++current < len) _buildImg().done(next);
    }

    function _buildImg(active) {
        // maybe return $li.
        var src = options.images[current];
        var dfd = $.Deferred();
        var $img =
            $('<img/>', {src: src})
                .one('load', function () {
                    dfd.resolve(this);
                }).each(function () {
                    // in case the img is in cache:
                    if (this.complete) $(this).trigger('load');
                });

        var $li = $('<li/>', {"class": active ? options.active_class : ''})
            .append($img)
            .appendTo($ul);
        $slides.push($li);
        return dfd.promise();
    }

}

function _createControls() {
    var length = options.images.length;
    var $ul = $('<ul/>', {"class": options.controls_class});
    var $li;
    for(var i=0;i<length; i++) {
        $li = $('<li/>', {"class": i ? '' : 'active'})
            .append($('<a/>', {text: i + 1}));
        $controls.push($li)
        $ul.append($li);
    }

    return $ul;
}

function _bind() {
    var controls = $.map($controls, function ($v) {
        return $v[0];
    });

    $container.find('.' + options.controls_class)
        .on('mouseenter', 'li', function () {
            var i = $.inArray(this, controls);
            if (running_index === i) return;
            toggleClass(running_index, i);
            run(i);
        })
        .end()
        .on('mouseenter', function () {
            timer.pause();
        })
        .on('mouseleave', function () {
            timer.resume();
        });
}

function init(opts) {
    $.extend(options, opts);
    if(!options.images || !options.container) {
        console.warn('no img src passed');
        return;
    }
    mediator.init(options.images);
    _build();
    run(0);
    _bind();
}
module.exports = {
    init: init,
    run: run
};

},{"../lib/timer":4,"./ss-mediator":3}],3:[function(require,module,exports){
var $ = (window.jQuery);

var images = [];
var total;

var mediator = $({});
var dfd;

mediator.on('imgloaded', function (e, i, img) {
    // img is w/e

    images.push(img);
    _tryResolve(dfd);

});

function getNext(i) {
    var len = images.length;
    if(++i>len) return;
    if(i===len) {
        if(len<total) return;
        if(len===total) i=0;
    }
    return i;
}

function _tryResolve(dfd) {
    if(!dfd) return;
    var i = dfd.running_index;
    var next_index = getNext(i);
    if(next_index !== undefined) {
        dfd.resolve(next_index);
        dfd = null;
    }
}



function tracker(i) {
    dfd = new $.Deferred();
    dfd.running_index = i;
    _tryResolve(dfd);
    return dfd.promise();
}


mediator.init = function(sources) {
    total = sources.length;
};

mediator.track = tracker;

module.exports = mediator;
},{}],4:[function(require,module,exports){
var now = (window.jQuery).now;

function Timer() {
    if(!(this instanceof Timer)) return new Timer();
}



Timer.prototype = {
    constructor: Timer,
    delay: function (fn, ms) {

        this.clear();

        this.rest_time = ms;
        this.start_time = now();
        // what about context? makeshift: use $.proxy:
        this.callback = fn;
        // make sure if we were at paused state, continue to pause:
        if(!this.paused) this.timer = setTimeout(fn, ms);


    },
    pause: function () {

        if(this.paused) return;
        var passed_time = now() - this.start_time;


        // We can do some extra check here (in case delay_time is less than passed_time due to system halt)
        this.rest_time = this.rest_time - passed_time;
        //console.log('rest:', this.rest_time);
        this.clear();
        this.paused = true;
    },
    resume: function () {
        if(!this.paused) return;
        this.paused = false;
        this.start_time = now();
        this.timer = setTimeout(this.callback, this.rest_time);
    },
    clear: function () {
        clearTimeout(this.timer);
        // maybe not necessary
        // this._destroy();
    },
    _destroy: function () {
        $.each(['callback', 'delay_time', 'timer', 'start_time', 'rest_time'], function (i, item) {
            this[item]=undefined;
        })
    }

};



module.exports = Timer;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxcY29kZXNcXG5vZGVqc1xcYWZcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvaG9tZS9ob21lLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvaG9tZS9zbGlkZXNob3cuanMiLCJlOi9jb2Rlcy9ub2RlanMvYWYvYXBwL2NsaWVudC9qcy9ob21lL3NzLW1lZGlhdG9yLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvbGliL3RpbWVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgc2xpZGVzaG93ID0gcmVxdWlyZSgnLi9zbGlkZXNob3cnKTtcclxuXHJcbnZhciByb290ID0gJy9pbWcvc2xpZGVzaG93Lyc7XHJcbnNsaWRlc2hvdy5pbml0KHtcclxuICAgIGltYWdlczogW3Jvb3QgKyBcIjEuanBnXCIsIHJvb3QgKyBcIjIuanBnXCIsIHJvb3QgKyBcIjMuanBnXCJdLFxyXG4gICAgY29udGFpbmVyOiBcIiNtYWluLXNsaWRlc2hvd1wiXHJcbn0pO1xyXG4iLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KTtcclxudmFyIG1lZGlhdG9yID0gcmVxdWlyZSgnLi9zcy1tZWRpYXRvcicpO1xyXG52YXIgVGltZXIgPSByZXF1aXJlKCcuLi9saWIvdGltZXInKTtcclxuXHJcbi8vIGRlZmF1bHRzOlxyXG52YXIgb3B0aW9ucyA9IHtcclxuICAgIGludGVydmFsOiA1MDAwLFxyXG4gICAgYWN0aXZlX2NsYXNzOiBcImFjdGl2ZVwiLFxyXG4gICAgc2xpZGVzX2NsYXNzOiBcInNsaWRlc1wiLFxyXG4gICAgY29udHJvbHNfY2xhc3M6IFwic3MtY29udHJvbHNcIlxyXG59O1xyXG52YXIgJGNvbnRhaW5lcjtcclxudmFyICRzbGlkZXMgPSBbXTtcclxudmFyICRjb250cm9scyA9IFtdO1xyXG52YXIgcnVubmluZ19pbmRleCA9IDA7XHJcbnZhciB0aW1lciA9IFRpbWVyKCk7XHJcblxyXG5cclxuZnVuY3Rpb24gdG9nZ2xlQ2xhc3Mociwgbikge1xyXG4gICAgdmFyIGFjdGl2ZV9jbGFzcyA9IG9wdGlvbnMuYWN0aXZlX2NsYXNzO1xyXG4gICAgJHNsaWRlc1tyXS5yZW1vdmVDbGFzcyhhY3RpdmVfY2xhc3MpO1xyXG4gICAgJHNsaWRlc1tuXS5hZGRDbGFzcyhhY3RpdmVfY2xhc3MpO1xyXG4gICAgJGNvbnRyb2xzW3JdLnJlbW92ZUNsYXNzKGFjdGl2ZV9jbGFzcylcclxuICAgICRjb250cm9sc1tuXS5hZGRDbGFzcyhhY3RpdmVfY2xhc3MpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW4ocikge1xyXG4gICAgcnVubmluZ19pbmRleCA9IHI7XHJcbiAgICBfcnVuKCk7XHJcblxyXG4gICAgZnVuY3Rpb24gX3J1bigpIHtcclxuICAgICAgICB0aW1lci5kZWxheSggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBtZWRpYXRvci50cmFjayhyKS5kb25lKGZ1bmN0aW9uIChuKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVDbGFzcyhyLCBuKTtcclxuICAgICAgICAgICAgICAgIHJ1bm5pbmdfaW5kZXggPSByID0gbjtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3J1bm5pbmdfaW5kZXggaXM6JywgcnVubmluZ19pbmRleCk7XHJcbiAgICAgICAgICAgICAgICBfcnVuKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSwgb3B0aW9ucy5pbnRlcnZhbCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gX2J1aWxkKCkge1xyXG5cclxuICAgICRjb250YWluZXIgPSAkKG9wdGlvbnMuY29udGFpbmVyKVxyXG4gICAgICAgIC5hcHBlbmQoX2NyZWF0ZVNsaWRlcygpKVxyXG4gICAgICAgIC5hcHBlbmQoX2NyZWF0ZUNvbnRyb2xzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gX2NyZWF0ZVNsaWRlcygpIHtcclxuICAgIHZhciAkdWwgPSAkKCc8dWwvPicsIHtcImNsYXNzXCI6IG9wdGlvbnMuc2xpZGVzX2NsYXNzfSlcclxuICAgIHZhciBsZW4gPSBvcHRpb25zLmltYWdlcy5sZW5ndGg7XHJcbiAgICB2YXIgY3VycmVudCA9IDA7XHJcblxyXG4gICAgLy8gVE9ETzogYWRkIGNvbmRpdGlvbiB3aGVuIHRoZSBpbWFnZSBmYWlsZWQgdG8gbG9hZFxyXG4gICAgX2J1aWxkSW1nKHRydWUpLmRvbmUobmV4dCk7XHJcbiAgICByZXR1cm4gJHVsO1xyXG5cclxuICAgIGZ1bmN0aW9uIG5leHQoaW1nKSB7XHJcbiAgICAgICAgbWVkaWF0b3IudHJpZ2dlcignaW1nbG9hZGVkJywgW2N1cnJlbnQsIGltZ10pO1xyXG4gICAgICAgIGlmICgrK2N1cnJlbnQgPCBsZW4pIF9idWlsZEltZygpLmRvbmUobmV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2J1aWxkSW1nKGFjdGl2ZSkge1xyXG4gICAgICAgIC8vIG1heWJlIHJldHVybiAkbGkuXHJcbiAgICAgICAgdmFyIHNyYyA9IG9wdGlvbnMuaW1hZ2VzW2N1cnJlbnRdO1xyXG4gICAgICAgIHZhciBkZmQgPSAkLkRlZmVycmVkKCk7XHJcbiAgICAgICAgdmFyICRpbWcgPVxyXG4gICAgICAgICAgICAkKCc8aW1nLz4nLCB7c3JjOiBzcmN9KVxyXG4gICAgICAgICAgICAgICAgLm9uZSgnbG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZmQucmVzb2x2ZSh0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0pLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGluIGNhc2UgdGhlIGltZyBpcyBpbiBjYWNoZTpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jb21wbGV0ZSkgJCh0aGlzKS50cmlnZ2VyKCdsb2FkJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyICRsaSA9ICQoJzxsaS8+Jywge1wiY2xhc3NcIjogYWN0aXZlID8gb3B0aW9ucy5hY3RpdmVfY2xhc3MgOiAnJ30pXHJcbiAgICAgICAgICAgIC5hcHBlbmQoJGltZylcclxuICAgICAgICAgICAgLmFwcGVuZFRvKCR1bCk7XHJcbiAgICAgICAgJHNsaWRlcy5wdXNoKCRsaSk7XHJcbiAgICAgICAgcmV0dXJuIGRmZC5wcm9taXNlKCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBfY3JlYXRlQ29udHJvbHMoKSB7XHJcbiAgICB2YXIgbGVuZ3RoID0gb3B0aW9ucy5pbWFnZXMubGVuZ3RoO1xyXG4gICAgdmFyICR1bCA9ICQoJzx1bC8+Jywge1wiY2xhc3NcIjogb3B0aW9ucy5jb250cm9sc19jbGFzc30pO1xyXG4gICAgdmFyICRsaTtcclxuICAgIGZvcih2YXIgaT0wO2k8bGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAkbGkgPSAkKCc8bGkvPicsIHtcImNsYXNzXCI6IGkgPyAnJyA6ICdhY3RpdmUnfSlcclxuICAgICAgICAgICAgLmFwcGVuZCgkKCc8YS8+Jywge3RleHQ6IGkgKyAxfSkpO1xyXG4gICAgICAgICRjb250cm9scy5wdXNoKCRsaSlcclxuICAgICAgICAkdWwuYXBwZW5kKCRsaSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICR1bDtcclxufVxyXG5cclxuZnVuY3Rpb24gX2JpbmQoKSB7XHJcbiAgICB2YXIgY29udHJvbHMgPSAkLm1hcCgkY29udHJvbHMsIGZ1bmN0aW9uICgkdikge1xyXG4gICAgICAgIHJldHVybiAkdlswXTtcclxuICAgIH0pO1xyXG5cclxuICAgICRjb250YWluZXIuZmluZCgnLicgKyBvcHRpb25zLmNvbnRyb2xzX2NsYXNzKVxyXG4gICAgICAgIC5vbignbW91c2VlbnRlcicsICdsaScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSAkLmluQXJyYXkodGhpcywgY29udHJvbHMpO1xyXG4gICAgICAgICAgICBpZiAocnVubmluZ19pbmRleCA9PT0gaSkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0b2dnbGVDbGFzcyhydW5uaW5nX2luZGV4LCBpKTtcclxuICAgICAgICAgICAgcnVuKGkpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aW1lci5wYXVzZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aW1lci5yZXN1bWUoKTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdChvcHRzKSB7XHJcbiAgICAkLmV4dGVuZChvcHRpb25zLCBvcHRzKTtcclxuICAgIGlmKCFvcHRpb25zLmltYWdlcyB8fCAhb3B0aW9ucy5jb250YWluZXIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ25vIGltZyBzcmMgcGFzc2VkJyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbWVkaWF0b3IuaW5pdChvcHRpb25zLmltYWdlcyk7XHJcbiAgICBfYnVpbGQoKTtcclxuICAgIHJ1bigwKTtcclxuICAgIF9iaW5kKCk7XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBpbml0OiBpbml0LFxyXG4gICAgcnVuOiBydW5cclxufTtcclxuIiwidmFyICQgPSAod2luZG93LmpRdWVyeSk7XHJcblxyXG52YXIgaW1hZ2VzID0gW107XHJcbnZhciB0b3RhbDtcclxuXHJcbnZhciBtZWRpYXRvciA9ICQoe30pO1xyXG52YXIgZGZkO1xyXG5cclxubWVkaWF0b3Iub24oJ2ltZ2xvYWRlZCcsIGZ1bmN0aW9uIChlLCBpLCBpbWcpIHtcclxuICAgIC8vIGltZyBpcyB3L2VcclxuXHJcbiAgICBpbWFnZXMucHVzaChpbWcpO1xyXG4gICAgX3RyeVJlc29sdmUoZGZkKTtcclxuXHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gZ2V0TmV4dChpKSB7XHJcbiAgICB2YXIgbGVuID0gaW1hZ2VzLmxlbmd0aDtcclxuICAgIGlmKCsraT5sZW4pIHJldHVybjtcclxuICAgIGlmKGk9PT1sZW4pIHtcclxuICAgICAgICBpZihsZW48dG90YWwpIHJldHVybjtcclxuICAgICAgICBpZihsZW49PT10b3RhbCkgaT0wO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF90cnlSZXNvbHZlKGRmZCkge1xyXG4gICAgaWYoIWRmZCkgcmV0dXJuO1xyXG4gICAgdmFyIGkgPSBkZmQucnVubmluZ19pbmRleDtcclxuICAgIHZhciBuZXh0X2luZGV4ID0gZ2V0TmV4dChpKTtcclxuICAgIGlmKG5leHRfaW5kZXggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGRmZC5yZXNvbHZlKG5leHRfaW5kZXgpO1xyXG4gICAgICAgIGRmZCA9IG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gdHJhY2tlcihpKSB7XHJcbiAgICBkZmQgPSBuZXcgJC5EZWZlcnJlZCgpO1xyXG4gICAgZGZkLnJ1bm5pbmdfaW5kZXggPSBpO1xyXG4gICAgX3RyeVJlc29sdmUoZGZkKTtcclxuICAgIHJldHVybiBkZmQucHJvbWlzZSgpO1xyXG59XHJcblxyXG5cclxubWVkaWF0b3IuaW5pdCA9IGZ1bmN0aW9uKHNvdXJjZXMpIHtcclxuICAgIHRvdGFsID0gc291cmNlcy5sZW5ndGg7XHJcbn07XHJcblxyXG5tZWRpYXRvci50cmFjayA9IHRyYWNrZXI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1lZGlhdG9yOyIsInZhciBub3cgPSAod2luZG93LmpRdWVyeSkubm93O1xyXG5cclxuZnVuY3Rpb24gVGltZXIoKSB7XHJcbiAgICBpZighKHRoaXMgaW5zdGFuY2VvZiBUaW1lcikpIHJldHVybiBuZXcgVGltZXIoKTtcclxufVxyXG5cclxuXHJcblxyXG5UaW1lci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogVGltZXIsXHJcbiAgICBkZWxheTogZnVuY3Rpb24gKGZuLCBtcykge1xyXG5cclxuICAgICAgICB0aGlzLmNsZWFyKCk7XHJcblxyXG4gICAgICAgIHRoaXMucmVzdF90aW1lID0gbXM7XHJcbiAgICAgICAgdGhpcy5zdGFydF90aW1lID0gbm93KCk7XHJcbiAgICAgICAgLy8gd2hhdCBhYm91dCBjb250ZXh0PyBtYWtlc2hpZnQ6IHVzZSAkLnByb3h5OlxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBmbjtcclxuICAgICAgICAvLyBtYWtlIHN1cmUgaWYgd2Ugd2VyZSBhdCBwYXVzZWQgc3RhdGUsIGNvbnRpbnVlIHRvIHBhdXNlOlxyXG4gICAgICAgIGlmKCF0aGlzLnBhdXNlZCkgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZm4sIG1zKTtcclxuXHJcblxyXG4gICAgfSxcclxuICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMucGF1c2VkKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHBhc3NlZF90aW1lID0gbm93KCkgLSB0aGlzLnN0YXJ0X3RpbWU7XHJcblxyXG5cclxuICAgICAgICAvLyBXZSBjYW4gZG8gc29tZSBleHRyYSBjaGVjayBoZXJlIChpbiBjYXNlIGRlbGF5X3RpbWUgaXMgbGVzcyB0aGFuIHBhc3NlZF90aW1lIGR1ZSB0byBzeXN0ZW0gaGFsdClcclxuICAgICAgICB0aGlzLnJlc3RfdGltZSA9IHRoaXMucmVzdF90aW1lIC0gcGFzc2VkX3RpbWU7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygncmVzdDonLCB0aGlzLnJlc3RfdGltZSk7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICByZXN1bWU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZighdGhpcy5wYXVzZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRfdGltZSA9IG5vdygpO1xyXG4gICAgICAgIHRoaXMudGltZXIgPSBzZXRUaW1lb3V0KHRoaXMuY2FsbGJhY2ssIHRoaXMucmVzdF90aW1lKTtcclxuICAgIH0sXHJcbiAgICBjbGVhcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcclxuICAgICAgICAvLyBtYXliZSBub3QgbmVjZXNzYXJ5XHJcbiAgICAgICAgLy8gdGhpcy5fZGVzdHJveSgpO1xyXG4gICAgfSxcclxuICAgIF9kZXN0cm95OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJC5lYWNoKFsnY2FsbGJhY2snLCAnZGVsYXlfdGltZScsICd0aW1lcicsICdzdGFydF90aW1lJywgJ3Jlc3RfdGltZSddLCBmdW5jdGlvbiAoaSwgaXRlbSkge1xyXG4gICAgICAgICAgICB0aGlzW2l0ZW1dPXVuZGVmaW5lZDtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaW1lcjsiXX0=
