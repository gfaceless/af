var slideshow = require('./slideshow');

var root = '/img/slideshow/';
slideshow.init({
    images: [root + "1.jpg", root + "2.jpg", root + "3.jpg"],
    container: "#main-slideshow"
});
