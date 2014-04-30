var _ = require('lodash');
var pkg = require('../package.json');


var config = {
    "browserify": {
        "basedir": "./app/client/js",
        "srcs": [
            // opts.basedir is the directory that browserify starts bundling from for filenames that start with .
            "./sale/batch-download.js", "./home/home.js", "./user/user.js", "./mfr/mfr.js",
            "./product/product.js", "./base.js", "./sale/batch-download.js"
        ],
        /*vendors should be used for those which could be helped a lot by browser cache, > 30k I say
         two ways to use: 1.use browserify `require`,`expose` and make it script tag's src
         2.just do nothing about it, helpful for js files from CDN. I treat jquery like this*/

        dest: "dist/js",
        vendor: {

            globals: getGlobalVendors(pkg["browserify-shim"]),
            externals: ["jquery", "lodash", "jquery-validation"],

            dest: "dist/js/vendor"
        }

    },
    "livereload": {
        "watch": ["./dist/js/**/*.js", "./dist/css/**/*.css", "./dist/img"]
    },
    "vendor": {
        css: {
            srcs: [
                "bootstrap/dist/css/bootstrap.css", "ladda-bootstrap/dist/ladda-themeless.css"
            ]
        },
        font: {
            srcs: ["bootstrap/dist/fonts/**"]
        },
        js: {
            srcs: ["jquery/dist/jquery.min.js", "respond/dest/respond.min.js", "bootstrap/dist/js/bootstrap.js"]
        },
        "dest": "dist/vendor",
        "root": "bower_components"
    },
    "less": {
        paths : [ "bower_components/bootstrap" ],
        srcs_all : 'app/client/less/**/*.less',
        basedir: "app/client/less/",
        srcs: [
            "base.less", "home/home.less",
            "main.less", "sale/batch-download.less"
        ],
        exclude_ : '!app/client/less/**/{base,base/**}',
        dest : 'dist/css'
    },
    font: {
        srcs: []
    },
    img: {
        srcs: ["app/client/img/**/{*,.*}"],
        dest: "dist/img/"
    }
};


module.exports = config;

/**
 *
 * @param obj
 * @returns an array e.g. ['jquery', 'three']
 */
function getGlobalVendors(obj) {
    return _.reduce(obj, function (result, v, k) {
        if(/^global/.test(v)) result.push(k);
        return result;
    }, [])
}






















