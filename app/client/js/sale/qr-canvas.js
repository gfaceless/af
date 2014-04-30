var $ = require('jquery');
//var _ = require('lodash');
var qrDefaults = {
    text: 'w/e',
    size: 128,
    // error correction level: `'L'`, `'M'`, `'Q'` or `'H'`
    ecLevel: 'Q',
    //background: "#fff",
    // render method: `'canvas'`, `'image'` or `'div'`
    render: 'canvas',

    // version range somewhere in 1 .. 40
    minVersion: 1, maxVersion: 40,


    // offset in pixel if drawn onto existing canvas
    left: 0, top: 0,

    // code color or image element
    fill: '#000',

    // background color or image element, `null` for transparent background
    //background: null,

    // corner radius relative to module width: 0.0 .. 0.5
    radius: 0,
    // quiet zone in modules
    quiet: 0,
    // modes 0: normal 1: label strip 2: label box 3: image strip 4: image box
    mode: 0,

    mSize: 0.1, mPosX: 0.5, mPosY: 0.5,

    label: 'no label', fontname: 'sans', fontcolor: '#000',

    image: null
};

var canvasDefaults = {
    margin: 20,
    cols: 8,
    rows: 8
};

var
    qrConfig,
    canvasConfig,
    texts

function _init(opts) {
    qrConfig = $.extend(qrDefaults, {
        size: opts.size,
        ecLevel: opts.ecl
    });
    canvasConfig = $.extend(canvasDefaults, {
        margin: opts.margin,
        cols: opts.cols,
        rows: opts.rows,
        size: opts.size
    });
    texts = opts.texts;
    if (!$.isArray(texts)) throw 'INNER ERROR. we must pass original texts(as arrays) to form qr-codes';
}

function makeQrCode(text) {
    qrConfig.text = text;
    // returns a canvas
    return _buildTmpContainer()
        .qrcode(qrConfig)
        .find('canvas')[0];
}

var $tmp;
function _buildTmpContainer() {
    return $tmp = $tmp || $('<div/>');
}
function _removeTmpContainer() {
    $tmp.remove();
    $tmp = null;
}


function drawQrcodes(containerCtx, i, appendingCanvas) {
    var margin = canvasConfig.margin,
        size = qrConfig.size,
        cols = canvasConfig.cols,
        rows = canvasConfig.rows

    var left = margin / 2 + i % cols * (size + margin)
        , top = margin / 2 + Math.floor(i / cols) * (size + margin)

    containerCtx.drawImage(appendingCanvas, left, top);
}


function draw(opts, callback) {
    _init(opts);
    var canvas = _makeCanvas();
    var ctx = canvas.getContext('2d');
    var dfd = new $.Deferred();


    var last = texts.length - 1;
    $.each(texts, function (i, text) {
        setTimeout(function () {
            drawQrcodes(ctx, i, makeQrCode(text));
            _removeTmpContainer();
            if (i === last) {
                dfd.resolve(canvas);
            }
        }, 0);
    });

    //If target is provided, deferred.promise() will attach the methods onto it and then return this object
    // rather than create a new one. This can be useful to attach the Promise behavior to an object that already exists.
    return dfd.promise(canvas);
}


function _makeCanvas() {
    var canvasDimension = calcCanvasDimension(canvasConfig),
        canvas = document.createElement('canvas');
    canvas.className = 'hidden';
    canvas.width = canvasDimension.width;
    canvas.height = canvasDimension.height;

    return canvas;
}

// this function will be exposed, so has an `opts` parameter
function calcCanvasDimension(opts) {
    var tmpDimension = opts.margin + opts.size;
    return {
        width: opts.cols * tmpDimension,
        height: opts.rows * tmpDimension
    }
}


module.exports = {
    draw: draw,
    calcCanvasDimension: calcCanvasDimension
};
