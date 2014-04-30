var $ = require('jquery');
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
