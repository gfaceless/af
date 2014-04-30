var _ = require('lodash');
var path = require('path');
var strip = require('./strip-bowerpath');
var browserify = require('browserify');
var watchify = require('watchify');

var gulp = require('gulp');
var gutil = require('gulp-util')
var source = require('vinyl-source-stream');

var cyan = gutil.colors.cyan,
    green = gutil.colors.green,
    magenta = gutil.colors.magenta

var config = require('./config');

module.exports = {
    build: _.partial(main, true),
    watch: _.partial(main, false),
    buildVendors: vendorify
}

function vendorify() {
    // bvc stands for browserify_vendor_config
    var bvc = config.browserify.vendor;

    browserify()
        .require("lodash", {expose: "lodash"})
        .bundle()
        .on('error', gutil.log)
        .pipe(source("lodash" + ".js"))
        .pipe(gulp.dest(bvc.dest))



    _.each(bvc.externals, function (name) {

        if (_.contains(bvc.globals, name)) {
            // if globally required like jquery, just return,
            // since there already has been some logic to deal with it under `vendor` task.
            return;
        }

        browserify()
            .require(name, {expose: name})
            .bundle()
            .on('error', gutil.log)
            .pipe(source(name + ".js"))
            .pipe(gulp.dest(bvc.dest))

    });
}


function main(init) {
    var fn = init ? browserify : watchify;
    console.log('init:', init);
    var srcs = config.browserify.srcs;
    _.each(srcs, function (src) {
        console.log("src is", src);
        var w = fn({
            // my experience: using opts.basedir is bug prone, so here's the following makeshift:
            entries: './' + path.join( config.browserify.basedir, src)
        });
        _.each(config.browserify.vendor.externals, function (external) {
            w.external(external);
        });
        w.vinyl_source = /\.js$/.test(src) ? src : src + '.js';

        if (!init) w.on('update', rebundle);
        var b = w.bundle({debug: !gutil.env.production})
            .on('error', gutil.log)

        if (init)   b.pipe(source(w.vinyl_source)).pipe(gulp.dest(config.browserify.dest))

        // if(i+1===srcs.length) cb();
    })
}

function rebundle(files) {
    _.each(files, function (file) {
        gutil.log(cyan(path.basename(file)), 'was', 'updated/created'
            , green('updating bundle file:'), magenta(this.vinyl_source));
    }, this);

    this.bundle({debug: !gutil.env.production})
        .on('error', gutil.log)
        .pipe(source(this.vinyl_source))
        .pipe(gulp.dest(config.browserify.dest))
}