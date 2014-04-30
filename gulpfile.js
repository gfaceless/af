/*
 * in production mode, we need to add gulp-minify-css, gulp-autoprefixer, gulp-clean
 * */
var fs = require('fs');
var _ = require('lodash');
var path = require('path');


var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var less = require('gulp-less');

var gulpif = require('gulp-if');
var changed = require('gulp-changed');

var livereload = require('gulp-livereload');
var server;

var myBrowserify = require('./gulp/my-browserify');

var config = require('./gulp/config');

var production = gutil.env.production;



var cyan = gutil.colors.cyan,
    green = gutil.colors.green,
    magenta = gutil.colors.magenta



gulp.task('default', function () {
    console.log('running');
});

gulp.task('jade', function () {
    var YOUR_LOCALS = {message: ''};
    gulp.src("views/sale/download.jade")
        .pipe(jade({
            locals: YOUR_LOCALS,
            pretty: true
        }))
        .pipe(gulp.dest('test/jade/dist/'))
});


gulp.task('less', function () {


    var basedir = config.less.basedir;
    var dest = config.less.dest;

    // I find it more intuitively to list all those to-be-exported css files instead using glob and anti-glob
    // see config.js
    _.each(config.less.srcs, function (src) {
        gulp.src(basedir + src)
            .pipe(less({
                paths: config.less.paths,
                sourceMap: !production
            }))
            .on('error', gutil.log)
            .pipe(gulp.dest(
                path.join(dest, path.dirname(src))
            ))
    });


    /*if (server) {
        stream.pipe(livereload())
        gutil.log(green('live reloading...'));
    }*/
});



gulp.task('useref', function () {
    return gulp.src('test/useref/*.html')
        .pipe(useref.assets())
        .pipe(useref.restore())
        .pipe(useref())
        .pipe(gulp.dest('test/useref/dist'));
});


gulp.task('js', function () {
    myBrowserify.build();
});

gulp.task('js:vendor', function () {
    myBrowserify.buildVendors();
});

gulp.task('vendor', function () {

    var vendor = config.vendor;
    var dest = vendor.dest;
    var srcs = [vendor.font.srcs, vendor.css.srcs, vendor.js.srcs];
    var root = vendor.root;
    _(srcs)
        .flatten()
        .each(function (src) {
            var _dest = path.join(dest , path.dirname(src));
            var _src = path.join(root, src)
            gulp.src(_src)
                .pipe(gulp.dest(_dest));
        })
    gulp.run('browserify:vendor')
});

gulp.task('img', function () {
    gulp.src(config.img.srcs)

        .pipe(gulp.dest(config.img.dest))
});

gulp.task('watch:js', function (cb) {
    // we cannot use gulp-change because all the dependencies, but there is WATCHIFY
    // see https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md
    myBrowserify.watch(cb);
});



gulp.task('watch:less', function () {
    gulp.watch(config.less.srcs_all, ['less'])
        .on('change', onchange);

});

gulp.task('watch', ["watch:browserify", "watch:less"/*, "livereload"*/]);

gulp.task('build', ['js', 'less', 'img', 'vendor']);

function onchange(e) {
    gutil.log(gutil.colors.cyan(path.basename(e.path)), 'was', e.type, gutil.colors.green('running task..'));
    /* not good: could have loaded files before they are processed,
        and subject to partial construct thingy too. (less, browserify: change of imported files) */
    // server.changed(e.path);
}

// TWO WAYS TO USE LIVERELOAD
// 1.like below; 2.use pipe(server) <-- this one does not suit my need
gulp.task('livereload', function () {
    server = server || livereload();
    gulp.watch(config.livereload.watch)
        .on('change', function (e) {
            // TODO: we want some more levels of path to show
            gutil.log(cyan(path.basename(e.path)), 'was', e.type, green('livereloading...'));
            server.changed(e.path);
        });
});


