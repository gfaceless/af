(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var $ = (window.jQuery);
var _ = require('lodash');

//TODO: ladda an spin has dep relationship.

var Ladda = require('ladda');

require('qrcode');
require('jquery-qrcode');
require('canvas-to-blob');

var getTexts = require('./server').getTexts;
var qrCanvas = require('./qr-canvas');
var draw = qrCanvas.draw;
var calcCanvasDimension = qrCanvas.calcCanvasDimension;


var defaults = {
    size: 128,
    margin: 20,
    cols: 8,
    rows: 8,
    ecl: "H"
};
var options = {};
var canvas;
// dom cache:
var
    $form = $('#qr-form') ,
    $btnSubmit = $form.find('button[type=submit]') ,
    $btnDownload = $('.qr-download') ,
    $qrEcl = $('#qr-ecl') ,

    $amount = $('.qr-amount'),
    $width = $('.qr-width'),
    $height = $('.qr-height')

var laddaSubmit = Ladda.create($btnSubmit[0]);

var time1;


function getCount() {
    return options.cols * options.rows;
}

function _checkValid() {
    var arr = getDropdownValues($qrEcl);

    return _.every( options, function (val) {
        // leaves the possibilities that ecl is a number, i think no need be too specific.
        return _.isNumber(val) || _.contains(arr, val)
    });
}

// THE PREREQUISITE
// populate options (which is passed to the SERVER and DRAW functions)
function gatherInfo() {
    var arr = $form.serializeArray();
    options = _.assign(options, _.reduce(arr, function (result, obj) {
        var number = _.parseInt(obj.value);
        result[obj.name] = _.isNaN(number) ? obj.value : number;
        return result;
    }, {}));
}

function startDraw() {

    $btnDownload.addClass('disabled');
    getTexts(getCount(), function (texts) {
        time1 = _.now();
        var pass = _.assign({}, options);
        pass.texts = texts;
        canvas = draw(pass)
            .done(enableDownload)
        $form.after(canvas);
    });
}





// ----- DOM -------
function popDefaults() {

    $("#qr-dimension").val(defaults.size)
    $('#qr-margin').val(defaults.margin)
    $('#qr-cols').val(defaults.cols)
    $('#qr-rows').val(defaults.rows)
}
function fillExtraInfo() {
    var canvasDimension = calcCanvasDimension(options);

    $amount.text(getCount());
    $height.text(canvasDimension.height);
    $width.text(canvasDimension.width);
}

function enableDownload(canvas) {
    canvas.className = '';
    var time2 = _.now();
    console.log('fin!', time2 - time1);
    laddaSubmit.stop();
    $btnDownload.removeClass('disabled')
}
//---- FIN -------



// --- HELPER FUNCTIONS ----
function getDropdownValues($selction) {
    return $selction.children('option').map(function () {
        return $(this).val();
    });
}
getDropdownValues = _.memoize(getDropdownValues);
// ---- FIN --------


//---- INIT -----
function init() {
    _.defaults(options, defaults);
    popDefaults();
    fillExtraInfo();
}

init();




//----- EVENT BIND -----
$form.on('keyup submit', function (e) {

    gatherInfo();
    fillExtraInfo();

    if(e.type=="submit") {
        e.preventDefault();
        if(!_checkValid()) return alert('无效数据');

        laddaSubmit.start();
        startDraw();
    }
});


$btnDownload.click(function () {
    /*this.counter = this.counter || 0;
     // start from 1;
     var name = ++download.counter + '(产品id:' + productId + ')';*/
    canvas.toBlob(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = $("<a>")
            .attr("href", url)
            .attr("download", "img.png")
            .appendTo("body");

        a[0].click();
        a.remove();
        URL.revokeObjectURL(url);
    });
});

$('.qr-clear').click(function () {
    $('canvas').remove();
});




},{"./qr-canvas":2,"./server":3,"canvas-to-blob":4,"jquery-qrcode":5,"ladda":7,"lodash":"9TlSmm","qrcode":6}],2:[function(require,module,exports){
var $ = (window.jQuery);
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

},{}],3:[function(require,module,exports){
var _ = require('lodash');

var encodedSlash = encodeURIComponent('/')
  , initialized

var productId = _extractProductId();

var defaults = productId ? {
  productId: productId,
  url: '/sales/' + productId + '/download'
} : {};

var url
  , count

function _extractProductId() {
  var arr = location.pathname.match(/sales\/([^\/]+)/);
  return arr && arr[1] ? arr[1] : undefined;
}

function init(opts) {
  _.defaults(opts = opts || {}, defaults);
  url = opts.url;
  productId = opts.productId;
  initialized = true;
}

function getTexts(count, callback) {
  if(!initialized) init();
  _getRawCodes(count, function(raws) {
    callback(_.map(raws, function (raw) {
      return _rawToUrl(raw);
    }));
  })
}


function _getRawCodes(count, callback) {

  $.ajax({
    method: 'post',
    url: url,
    data: {count: count}
  }).done(function (arr) {
      callback(arr);
    });
}

function _rawToUrl(raw) {
  raw = raw.replace('/', encodedSlash);
  return location.host + '/sales/' + productId + '/' + raw;
}


module.exports = {
  getTexts: getTexts,
  init: init
};
},{"lodash":"9TlSmm"}],4:[function(require,module,exports){
(function (global){
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
/*
 * JavaScript Canvas to Blob 2.0.5
 * https://github.com/blueimp/JavaScript-Canvas-to-Blob
 *
 * Copyright 2012, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 * Based on stackoverflow user Stoive's code snippet:
 * http://stackoverflow.com/q/4998908
 */

/*jslint nomen: true, regexp: true */
/*global window, atob, Blob, ArrayBuffer, Uint8Array, define */

(function (window) {
    'use strict';
    var CanvasPrototype = window.HTMLCanvasElement &&
            window.HTMLCanvasElement.prototype,
        hasBlobConstructor = window.Blob && (function () {
            try {
                return Boolean(new Blob());
            } catch (e) {
                return false;
            }
        }()),
        hasArrayBufferViewSupport = hasBlobConstructor && window.Uint8Array &&
            (function () {
                try {
                    return new Blob([new Uint8Array(100)]).size === 100;
                } catch (e) {
                    return false;
                }
            }()),
        BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
            window.MozBlobBuilder || window.MSBlobBuilder,
        dataURLtoBlob = (hasBlobConstructor || BlobBuilder) && window.atob &&
            window.ArrayBuffer && window.Uint8Array && function (dataURI) {
                var byteString,
                    arrayBuffer,
                    intArray,
                    i,
                    mimeString,
                    bb;
                if (dataURI.split(',')[0].indexOf('base64') >= 0) {
                    // Convert base64 to raw binary data held in a string:
                    byteString = atob(dataURI.split(',')[1]);
                } else {
                    // Convert base64/URLEncoded data component to raw binary data:
                    byteString = decodeURIComponent(dataURI.split(',')[1]);
                }
                // Write the bytes of the string to an ArrayBuffer:
                arrayBuffer = new ArrayBuffer(byteString.length);
                intArray = new Uint8Array(arrayBuffer);
                for (i = 0; i < byteString.length; i += 1) {
                    intArray[i] = byteString.charCodeAt(i);
                }
                // Separate out the mime component:
                mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
                // Write the ArrayBuffer (or ArrayBufferView) to a blob:
                if (hasBlobConstructor) {
                    return new Blob(
                        [hasArrayBufferViewSupport ? intArray : arrayBuffer],
                        {type: mimeString}
                    );
                }
                bb = new BlobBuilder();
                bb.append(arrayBuffer);
                return bb.getBlob(mimeString);
            };
    if (window.HTMLCanvasElement && !CanvasPrototype.toBlob) {
        if (CanvasPrototype.mozGetAsFile) {
            CanvasPrototype.toBlob = function (callback, type, quality) {
                if (quality && CanvasPrototype.toDataURL && dataURLtoBlob) {
                    callback(dataURLtoBlob(this.toDataURL(type, quality)));
                } else {
                    callback(this.mozGetAsFile('blob', type));
                }
            };
        } else if (CanvasPrototype.toDataURL && dataURLtoBlob) {
            CanvasPrototype.toBlob = function (callback, type, quality) {
                callback(dataURLtoBlob(this.toDataURL(type, quality)));
            };
        }
    }
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return dataURLtoBlob;
        });
    } else {
        window.dataURLtoBlob = dataURLtoBlob;
    }
}(this));

; browserify_shim__define__module__export__(typeof dataURLtoBlob != "undefined" ? dataURLtoBlob : window.dataURLtoBlob);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
(function (global){

; qrcode = global.qrcode = require("e:\\codes\\nodejs\\af\\bower_components\\jquery.qrcode\\src\\qrcode.js");
;__browserify_shim_require__=require;(function browserifyShim(module, define, require) {
/*! {{pkg.displayName}} {{pkg.version}} - //larsjung.de/qrcode - MIT License */

// Uses [QR Code Generator](http://www.d-project.com/qrcode/index.html) (MIT), appended to the end of this file.
// Kudos to [jquery.qrcode.js](http://github.com/jeromeetienne/jquery-qrcode) (MIT).

(function ($) {
	'use strict';


		// Wrapper for the original QR code generator.
	var QRCode = function (text, level, version, quiet) {

			// `qrcode` is the single public function that will be defined by the `QR Code Generator`
			// at the end of the file.
			var qr = qrcode(version, level);
			qr.addData(text);
			qr.make();

			quiet = quiet || 0;

			var qrModuleCount = qr.getModuleCount(),
				quietModuleCount = qr.getModuleCount() + 2*quiet,
				isDark = function (row, col) {

					row -= quiet;
					col -= quiet;

					if (row < 0 || row >= qrModuleCount || col < 0 || col >= qrModuleCount) {
						return false;
					}

					return qr.isDark(row, col);
				},
				addBlank = function (l, t, r, b) {

					var prevIsDark = this.isDark,
						moduleSize = 1 / quietModuleCount;

					this.isDark = function (row, col) {

						var ml = col * moduleSize,
							mt = row * moduleSize,
							mr = ml + moduleSize,
							mb = mt + moduleSize;

						return prevIsDark(row, col) && (l > mr || ml > r || t > mb || mt > b);
					};
				};

			this.text = text;
			this.level = level;
			this.version = version;
			this.moduleCount = quietModuleCount;
			this.isDark = isDark;
			this.addBlank = addBlank;
		},

		// Check if canvas is available in the browser (as Modernizr does)
		canvasAvailable = (function () {

			var elem = document.createElement('canvas');
			return !!(elem.getContext && elem.getContext('2d'));
		}()),

		arcToAvailable = Object.prototype.toString.call(window.opera) !== '[object Opera]',

		// Returns a minimal QR code for the given text starting with version `minVersion`.
		// Returns `null` if `text` is too long to be encoded in `maxVersion`.
		createQRCode = function (text, level, minVersion, maxVersion, quiet) {

			minVersion = Math.max(1, minVersion || 1);
			maxVersion = Math.min(40, maxVersion || 40);
			for (var version = minVersion; version <= maxVersion; version += 1) {
				try {
					return new QRCode(text, level, version, quiet);
				} catch (err) {}
			}
		},

		drawBackgroundLabel = function (qr, context, settings) {

			var size = settings.size,
				font = "bold " + (settings.mSize * size) + "px " + settings.fontname,
				ctx = $('<canvas/>')[0].getContext("2d");

			ctx.font = font;

			var w = ctx.measureText(settings.label).width,
				sh = settings.mSize,
				sw = w / size,
				sl = (1 - sw) * settings.mPosX,
				st = (1 - sh) * settings.mPosY,
				sr = sl + sw,
				sb = st + sh,
				pad = 0.01;

			if (settings.mode === 1) {
				// Strip
				qr.addBlank(0, st - pad, size, sb + pad);
			} else {
				// Box
				qr.addBlank(sl - pad, st - pad, sr + pad, sb + pad);
			}

			context.fillStyle = settings.fontcolor;
			context.font = font;
			context.fillText(settings.label, sl*size, st*size + 0.75 * settings.mSize * size);
		},

		drawBackgroundImage = function (qr, context, settings) {

			var size = settings.size,
				w = settings.image.naturalWidth || 1,
				h = settings.image.naturalHeight || 1,
				sh = settings.mSize,
				sw = sh * w / h,
				sl = (1 - sw) * settings.mPosX,
				st = (1 - sh) * settings.mPosY,
				sr = sl + sw,
				sb = st + sh,
				pad = 0.01;

			if (settings.mode === 3) {
				// Strip
				qr.addBlank(0, st - pad, size, sb + pad);
			} else {
				// Box
				qr.addBlank(sl - pad, st - pad, sr + pad, sb + pad);
			}

			context.drawImage(settings.image, sl*size, st*size, sw*size, sh*size);
		},

		drawBackground = function (qr, context, settings) {

			if ($(settings.background).is('img')) {
				context.drawImage(settings.background, 0, 0, settings.size, settings.size);
			} else if (settings.background) {
				context.fillStyle = settings.background;
				context.fillRect(settings.left, settings.top, settings.size, settings.size);
			}

			var mode = settings.mode;
			if (mode === 1 || mode === 2) {
				drawBackgroundLabel(qr, context, settings);
			} else if (mode === 3 || mode === 4) {
				drawBackgroundImage(qr, context, settings);
			}
		},

		drawModuleDefault = function (qr, context, settings, left, top, width, row, col) {

			if (qr.isDark(row, col)) {
				context.rect(left, top, width, width);
			}
		},

		drawModuleRoundedDark = function (ctx, l, t, r, b, rad, nw, ne, se, sw) {

			if (nw) {
				ctx.moveTo(l + rad, t);
			} else {
				ctx.moveTo(l, t);
			}

			if (ne) {
				ctx.lineTo(r - rad, t);
				ctx.arcTo(r, t, r, b, rad);
			} else {
				ctx.lineTo(r, t);
			}

			if (se) {
				ctx.lineTo(r, b - rad);
				ctx.arcTo(r, b, l, b, rad);
			} else {
				ctx.lineTo(r, b);
			}

			if (sw) {
				ctx.lineTo(l + rad, b);
				ctx.arcTo(l, b, l, t, rad);
			} else {
				ctx.lineTo(l, b);
			}

			if (nw) {
				ctx.lineTo(l, t + rad);
				ctx.arcTo(l, t, r, t, rad);
			} else {
				ctx.lineTo(l, t);
			}
		},

		drawModuleRoundendLight = function (ctx, l, t, r, b, rad, nw, ne, se, sw) {

			if (nw) {
				ctx.moveTo(l + rad, t);
				ctx.lineTo(l, t);
				ctx.lineTo(l, t + rad);
				ctx.arcTo(l, t, l + rad, t, rad);
			}

			if (ne) {
				ctx.moveTo(r - rad, t);
				ctx.lineTo(r, t);
				ctx.lineTo(r, t + rad);
				ctx.arcTo(r, t, r - rad, t, rad);
			}

			if (se) {
				ctx.moveTo(r - rad, b);
				ctx.lineTo(r, b);
				ctx.lineTo(r, b - rad);
				ctx.arcTo(r, b, r - rad, b, rad);
			}

			if (sw) {
				ctx.moveTo(l + rad, b);
				ctx.lineTo(l, b);
				ctx.lineTo(l, b - rad);
				ctx.arcTo(l, b, l + rad, b, rad);
			}
		},

		drawModuleRounded = function (qr, context, settings, left, top, width, row, col) {

			var isDark = qr.isDark,
				right = left + width,
				bottom = top + width,
				radius = settings.radius * width,
				rowT = row - 1,
				rowB = row + 1,
				colL = col - 1,
				colR = col + 1,
				center = isDark(row, col),
				northwest = isDark(rowT, colL),
				north = isDark(rowT, col),
				northeast = isDark(rowT, colR),
				east = isDark(row, colR),
				southeast = isDark(rowB, colR),
				south = isDark(rowB, col),
				southwest = isDark(rowB, colL),
				west = isDark(row, colL);

			if (center) {
				drawModuleRoundedDark(context, left, top, right, bottom, radius, !north && !west, !north && !east, !south && !east, !south && !west);
			} else {
				drawModuleRoundendLight(context, left, top, right, bottom, radius, north && west && northwest, north && east && northeast, south && east && southeast, south && west && southwest);
			}
		},

		drawModules = function (qr, context, settings) {

			var moduleCount = qr.moduleCount,
				moduleSize = settings.size / moduleCount,
				fn = drawModuleDefault,
				row, col;

			if (arcToAvailable && settings.radius > 0 && settings.radius <= 0.5) {
				fn = drawModuleRounded;
			}

			context.beginPath();
			for (row = 0; row < moduleCount; row += 1) {
				for (col = 0; col < moduleCount; col += 1) {

					var l = settings.left + col * moduleSize,
						t = settings.top + row * moduleSize,
						w = moduleSize;

					fn(qr, context, settings, l, t, w, row, col);
				}
			}
			if ($(settings.fill).is('img')) {
				context.strokeStyle = 'rgba(0,0,0,0.5)';
				context.lineWidth = 2;
				context.stroke();
				var prev = context.globalCompositeOperation;
				context.globalCompositeOperation = "destination-out";
				context.fill();
				context.globalCompositeOperation = prev;

				context.clip();
				context.drawImage(settings.fill, 0, 0, settings.size, settings.size);
				context.restore();
			} else {
				context.fillStyle = settings.fill;
				context.fill();
			}
		},

		// Draws QR code to the given `canvas` and returns it.
		drawOnCanvas = function (canvas, settings) {

			var qr = createQRCode(settings.text, settings.ecLevel, settings.minVersion, settings.maxVersion, settings.quiet);
			if (!qr) {
				return null;
			}

			var $canvas = $(canvas).data('qrcode', qr),
				context = $canvas[0].getContext('2d');

			drawBackground(qr, context, settings);
			drawModules(qr, context, settings);

			return $canvas;
		},

		// Returns a `canvas` element representing the QR code for the given settings.
		createCanvas = function (settings) {

			var $canvas = $('<canvas/>').attr('width', settings.size).attr('height', settings.size);
			return drawOnCanvas($canvas, settings);
		},

		// Returns an `image` element representing the QR code for the given settings.
		createImage = function (settings) {

			return $('<img/>').attr('src', createCanvas(settings)[0].toDataURL('image/png'));
		},

		// Returns a `div` element representing the QR code for the given settings.
		createDiv = function (settings) {

			var qr = createQRCode(settings.text, settings.ecLevel, settings.minVersion, settings.maxVersion, settings.quiet);
			if (!qr) {
				return null;
			}

				// some shortcuts to improve compression
			var settings_size = settings.size,
				settings_bgColor = settings.background,
				math_floor = Math.floor,

				moduleCount = qr.moduleCount,
				moduleSize = math_floor(settings_size / moduleCount),
				offset = math_floor(0.5 * (settings_size - moduleSize * moduleCount)),

				row, col,

				containerCSS = {
					position: 'relative',
					left: 0,
					top: 0,
					padding: 0,
					margin: 0,
					width: settings_size,
					height: settings_size
				},
				darkCSS = {
					position: 'absolute',
					padding: 0,
					margin: 0,
					width: moduleSize,
					height: moduleSize,
					'background-color': settings.fill
				},

				$div = $('<div/>').data('qrcode', qr).css(containerCSS);

			if (settings_bgColor) {
				$div.css('background-color', settings_bgColor);
			}

			for (row = 0; row < moduleCount; row += 1) {
				for (col = 0; col < moduleCount; col += 1) {
					if (qr.isDark(row, col)) {
						$('<div/>')
							.css(darkCSS)
							.css({
								left: offset + col * moduleSize,
								top: offset + row * moduleSize
							})
							.appendTo($div);
					}
				}
			}

			return $div;
		},

		createHTML = function (settings) {

			if (canvasAvailable && settings.render === 'canvas') {
				return createCanvas(settings);
			} else if (canvasAvailable && settings.render === 'image') {
				return createImage(settings);
			}

			return createDiv(settings);
		},

		// Plugin
		// ======

		// Default settings
		// ----------------
		defaults = {

			// render method: `'canvas'`, `'image'` or `'div'`
			render: 'canvas',

			// version range somewhere in 1 .. 40
			minVersion: 1,
			maxVersion: 40,

			// error correction level: `'L'`, `'M'`, `'Q'` or `'H'`
			ecLevel: 'L',

			// offset in pixel if drawn onto existing canvas
			left: 0,
			top: 0,

			// size in pixel
			size: 200,

			// code color or image element
			fill: '#000',

			// background color or image element, `null` for transparent background
			background: null,

			// content
			text: 'no text',

			// corner radius relative to module width: 0.0 .. 0.5
			radius: 0,

			// quiet zone in modules
			quiet: 0,

			// modes
			// 0: normal
			// 1: label strip
			// 2: label box
			// 3: image strip
			// 4: image box
			mode: 0,

			mSize: 0.1,
			mPosX: 0.5,
			mPosY: 0.5,

			label: 'no label',
			fontname: 'sans',
			fontcolor: '#000',

			image: null
		};

	// Register the plugin
	// -------------------
	$.fn.qrcode = function(options) {

		var settings = $.extend({}, defaults, options);

		return this.each(function () {

			if (this.nodeName.toLowerCase() === 'canvas') {
				drawOnCanvas(this, settings);
			} else {
				$(this).append(createHTML(settings));
			}
		});
	};

	// jQuery.qrcode plug in code ends here

	// QR Code Generator
	// =================
	// @include "qrcode.js"

}(jQuery));

}).call(global, module, undefined, undefined);

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"e:\\codes\\nodejs\\af\\bower_components\\jquery.qrcode\\src\\qrcode.js":6}],6:[function(require,module,exports){
(function (global){
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//	http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//	http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

var qrcode = function() {

	//---------------------------------------------------------------------
	// qrcode
	//---------------------------------------------------------------------

	/**
	 * qrcode
	 * @param typeNumber 1 to 10
	 * @param errorCorrectLevel 'L','M','Q','H'
	 */
	var qrcode = function(typeNumber, errorCorrectLevel) {

		var PAD0 = 0xEC;
		var PAD1 = 0x11;

		var _typeNumber = typeNumber;
		var _errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel];
		var _modules = null;
		var _moduleCount = 0;
		var _dataCache = null;
		var _dataList = new Array();

		var _this = {};

		var makeImpl = function(test, maskPattern) {

			_moduleCount = _typeNumber * 4 + 17;
			_modules = function(moduleCount) {
				var modules = new Array(moduleCount);
				for (var row = 0; row < moduleCount; row += 1) {
					modules[row] = new Array(moduleCount);
					for (var col = 0; col < moduleCount; col += 1) {
						modules[row][col] = null;
					}
				}
				return modules;
			}(_moduleCount);

			setupPositionProbePattern(0, 0);
			setupPositionProbePattern(_moduleCount - 7, 0);
			setupPositionProbePattern(0, _moduleCount - 7);
			setupPositionAdjustPattern();
			setupTimingPattern();
			setupTypeInfo(test, maskPattern);

			if (_typeNumber >= 7) {
				setupTypeNumber(test);
			}

			if (_dataCache == null) {
				_dataCache = createData(_typeNumber, _errorCorrectLevel, _dataList);
			}

			mapData(_dataCache, maskPattern);
		};

		var setupPositionProbePattern = function(row, col) {

			for (var r = -1; r <= 7; r += 1) {

				if (row + r <= -1 || _moduleCount <= row + r) continue;

				for (var c = -1; c <= 7; c += 1) {

					if (col + c <= -1 || _moduleCount <= col + c) continue;

					if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
							|| (0 <= c && c <= 6 && (r == 0 || r == 6) )
							|| (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
						_modules[row + r][col + c] = true;
					} else {
						_modules[row + r][col + c] = false;
					}
				}
			}
		};

		var getBestMaskPattern = function() {

			var minLostPoint = 0;
			var pattern = 0;

			for (var i = 0; i < 8; i += 1) {

				makeImpl(true, i);

				var lostPoint = QRUtil.getLostPoint(_this);

				if (i == 0 || minLostPoint > lostPoint) {
					minLostPoint = lostPoint;
					pattern = i;
				}
			}

			return pattern;
		};

		var setupTimingPattern = function() {

			for (var r = 8; r < _moduleCount - 8; r += 1) {
				if (_modules[r][6] != null) {
					continue;
				}
				_modules[r][6] = (r % 2 == 0);
			}

			for (var c = 8; c < _moduleCount - 8; c += 1) {
				if (_modules[6][c] != null) {
					continue;
				}
				_modules[6][c] = (c % 2 == 0);
			}
		};

		var setupPositionAdjustPattern = function() {

			var pos = QRUtil.getPatternPosition(_typeNumber);

			for (var i = 0; i < pos.length; i += 1) {

				for (var j = 0; j < pos.length; j += 1) {

					var row = pos[i];
					var col = pos[j];

					if (_modules[row][col] != null) {
						continue;
					}

					for (var r = -2; r <= 2; r += 1) {

						for (var c = -2; c <= 2; c += 1) {

							if (r == -2 || r == 2 || c == -2 || c == 2
									|| (r == 0 && c == 0) ) {
								_modules[row + r][col + c] = true;
							} else {
								_modules[row + r][col + c] = false;
							}
						}
					}
				}
			}
		};

		var setupTypeNumber = function(test) {

			var bits = QRUtil.getBCHTypeNumber(_typeNumber);

			for (var i = 0; i < 18; i += 1) {
				var mod = (!test && ( (bits >> i) & 1) == 1);
				_modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
			}

			for (var i = 0; i < 18; i += 1) {
				var mod = (!test && ( (bits >> i) & 1) == 1);
				_modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
			}
		};

		var setupTypeInfo = function(test, maskPattern) {

			var data = (_errorCorrectLevel << 3) | maskPattern;
			var bits = QRUtil.getBCHTypeInfo(data);

			// vertical
			for (var i = 0; i < 15; i += 1) {

				var mod = (!test && ( (bits >> i) & 1) == 1);

				if (i < 6) {
					_modules[i][8] = mod;
				} else if (i < 8) {
					_modules[i + 1][8] = mod;
				} else {
					_modules[_moduleCount - 15 + i][8] = mod;
				}
			}

			// horizontal
			for (var i = 0; i < 15; i += 1) {

				var mod = (!test && ( (bits >> i) & 1) == 1);

				if (i < 8) {
					_modules[8][_moduleCount - i - 1] = mod;
				} else if (i < 9) {
					_modules[8][15 - i - 1 + 1] = mod;
				} else {
					_modules[8][15 - i - 1] = mod;
				}
			}

			// fixed module
			_modules[_moduleCount - 8][8] = (!test);
		};

		var mapData = function(data, maskPattern) {

			var inc = -1;
			var row = _moduleCount - 1;
			var bitIndex = 7;
			var byteIndex = 0;
			var maskFunc = QRUtil.getMaskFunction(maskPattern);

			for (var col = _moduleCount - 1; col > 0; col -= 2) {

				if (col == 6) col -= 1;

				while (true) {

					for (var c = 0; c < 2; c += 1) {

						if (_modules[row][col - c] == null) {

							var dark = false;

							if (byteIndex < data.length) {
								dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
							}

							var mask = maskFunc(row, col - c);

							if (mask) {
								dark = !dark;
							}

							_modules[row][col - c] = dark;
							bitIndex -= 1;

							if (bitIndex == -1) {
								byteIndex += 1;
								bitIndex = 7;
							}
						}
					}

					row += inc;

					if (row < 0 || _moduleCount <= row) {
						row -= inc;
						inc = -inc;
						break;
					}
				}
			}
		};

		var createBytes = function(buffer, rsBlocks) {

			var offset = 0;

			var maxDcCount = 0;
			var maxEcCount = 0;

			var dcdata = new Array(rsBlocks.length);
			var ecdata = new Array(rsBlocks.length);

			for (var r = 0; r < rsBlocks.length; r += 1) {

				var dcCount = rsBlocks[r].dataCount;
				var ecCount = rsBlocks[r].totalCount - dcCount;

				maxDcCount = Math.max(maxDcCount, dcCount);
				maxEcCount = Math.max(maxEcCount, ecCount);

				dcdata[r] = new Array(dcCount);

				for (var i = 0; i < dcdata[r].length; i += 1) {
					dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
				}
				offset += dcCount;

				var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
				var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

				var modPoly = rawPoly.mod(rsPoly);
				ecdata[r] = new Array(rsPoly.getLength() - 1);
				for (var i = 0; i < ecdata[r].length; i += 1) {
					var modIndex = i + modPoly.getLength() - ecdata[r].length;
					ecdata[r][i] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
				}
			}

			var totalCodeCount = 0;
			for (var i = 0; i < rsBlocks.length; i += 1) {
				totalCodeCount += rsBlocks[i].totalCount;
			}

			var data = new Array(totalCodeCount);
			var index = 0;

			for (var i = 0; i < maxDcCount; i += 1) {
				for (var r = 0; r < rsBlocks.length; r += 1) {
					if (i < dcdata[r].length) {
						data[index] = dcdata[r][i];
						index += 1;
					}
				}
			}

			for (var i = 0; i < maxEcCount; i += 1) {
				for (var r = 0; r < rsBlocks.length; r += 1) {
					if (i < ecdata[r].length) {
						data[index] = ecdata[r][i];
						index += 1;
					}
				}
			}

			return data;
		};

		var createData = function(typeNumber, errorCorrectLevel, dataList) {

			var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);

			var buffer = qrBitBuffer();

			for (var i = 0; i < dataList.length; i += 1) {
				var data = dataList[i];
				buffer.put(data.getMode(), 4);
				buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
				data.write(buffer);
			}

			// calc num max data.
			var totalDataCount = 0;
			for (var i = 0; i < rsBlocks.length; i += 1) {
				totalDataCount += rsBlocks[i].dataCount;
			}

			if (buffer.getLengthInBits() > totalDataCount * 8) {
				throw new Error('code length overflow. ('
					+ buffer.getLengthInBits()
					+ '>'
					+ totalDataCount * 8
					+ ')');
			}

			// end code
			if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
				buffer.put(0, 4);
			}

			// padding
			while (buffer.getLengthInBits() % 8 != 0) {
				buffer.putBit(false);
			}

			// padding
			while (true) {

				if (buffer.getLengthInBits() >= totalDataCount * 8) {
					break;
				}
				buffer.put(PAD0, 8);

				if (buffer.getLengthInBits() >= totalDataCount * 8) {
					break;
				}
				buffer.put(PAD1, 8);
			}

			return createBytes(buffer, rsBlocks);
		};

		_this.addData = function(data) {
			var newData = qr8BitByte(data);
			_dataList.push(newData);
			_dataCache = null;
		};

		_this.isDark = function(row, col) {
			if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
				throw new Error(row + ',' + col);
			}
			return _modules[row][col];
		};

		_this.getModuleCount = function() {
			return _moduleCount;
		};

		_this.make = function() {
			makeImpl(false, getBestMaskPattern() );
		};

		_this.createTableTag = function(cellSize, margin) {

			cellSize = cellSize || 2;
			margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

			var qrHtml = '';

			qrHtml += '<table style="';
			qrHtml += ' border-width: 0px; border-style: none;';
			qrHtml += ' border-collapse: collapse;';
			qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
			qrHtml += '">';
			qrHtml += '<tbody>';

			for (var r = 0; r < _this.getModuleCount(); r += 1) {

				qrHtml += '<tr>';

				for (var c = 0; c < _this.getModuleCount(); c += 1) {
					qrHtml += '<td style="';
					qrHtml += ' border-width: 0px; border-style: none;';
					qrHtml += ' border-collapse: collapse;';
					qrHtml += ' padding: 0px; margin: 0px;';
					qrHtml += ' width: ' + cellSize + 'px;';
					qrHtml += ' height: ' + cellSize + 'px;';
					qrHtml += ' background-color: ';
					qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
					qrHtml += ';';
					qrHtml += '"/>';
				}

				qrHtml += '</tr>';
			}

			qrHtml += '</tbody>';
			qrHtml += '</table>';

			return qrHtml;
		};

		_this.createImgTag = function(cellSize, margin) {

			cellSize = cellSize || 2;
			margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

			var size = _this.getModuleCount() * cellSize + margin * 2;
			var min = margin;
			var max = size - margin;

			return createImgTag(size, size, function(x, y) {
				if (min <= x && x < max && min <= y && y < max) {
					var c = Math.floor( (x - min) / cellSize);
					var r = Math.floor( (y - min) / cellSize);
					return _this.isDark(r, c)? 0 : 1;
				} else {
					return 1;
				}
			} );
		};

		return _this;
	};

	//---------------------------------------------------------------------
	// qrcode.stringToBytes
	//---------------------------------------------------------------------

	qrcode.stringToBytes = function(s) {
		var bytes = new Array();
		for (var i = 0; i < s.length; i += 1) {
			var c = s.charCodeAt(i);
			bytes.push(c & 0xff);
		}
		return bytes;
	};

	//---------------------------------------------------------------------
	// qrcode.createStringToBytes
	//---------------------------------------------------------------------

	/**
	 * @param unicodeData base64 string of byte array.
	 * [16bit Unicode],[16bit Bytes], ...
	 * @param numChars
	 */
	qrcode.createStringToBytes = function(unicodeData, numChars) {

		// create conversion map.

		var unicodeMap = function() {

			var bin = base64DecodeInputStream(unicodeData);
			var read = function() {
				var b = bin.read();
				if (b == -1) throw new Error();
				return b;
			};

			var count = 0;
			var unicodeMap = {};
			while (true) {
				var b0 = bin.read();
				if (b0 == -1) break;
				var b1 = read();
				var b2 = read();
				var b3 = read();
				var k = String.fromCharCode( (b0 << 8) | b1);
				var v = (b2 << 8) | b3;
				unicodeMap[k] = v;
				count += 1;
			}
			if (count != numChars) {
				throw new Error(count + ' != ' + numChars);
			}

			return unicodeMap;
		}();

		var unknownChar = '?'.charCodeAt(0);

		return function(s) {
			var bytes = new Array();
			for (var i = 0; i < s.length; i += 1) {
				var c = s.charCodeAt(i);
				if (c < 128) {
					bytes.push(c);
				} else {
					var b = unicodeMap[s.charAt(i)];
					if (typeof b == 'number') {
						if ( (b & 0xff) == b) {
							// 1byte
							bytes.push(b);
						} else {
							// 2bytes
							bytes.push(b >>> 8);
							bytes.push(b & 0xff);
						}
					} else {
						bytes.push(unknownChar);
					}
				}
			}
			return bytes;
		};
	};

	//---------------------------------------------------------------------
	// QRMode
	//---------------------------------------------------------------------

	var QRMode = {
		MODE_NUMBER :		1 << 0,
		MODE_ALPHA_NUM : 	1 << 1,
		MODE_8BIT_BYTE : 	1 << 2,
		MODE_KANJI :		1 << 3
	};

	//---------------------------------------------------------------------
	// QRErrorCorrectLevel
	//---------------------------------------------------------------------

	var QRErrorCorrectLevel = {
		L : 1,
		M : 0,
		Q : 3,
		H : 2
	};

	//---------------------------------------------------------------------
	// QRMaskPattern
	//---------------------------------------------------------------------

	var QRMaskPattern = {
		PATTERN000 : 0,
		PATTERN001 : 1,
		PATTERN010 : 2,
		PATTERN011 : 3,
		PATTERN100 : 4,
		PATTERN101 : 5,
		PATTERN110 : 6,
		PATTERN111 : 7
	};

	//---------------------------------------------------------------------
	// QRUtil
	//---------------------------------------------------------------------

	var QRUtil = function() {

		var PATTERN_POSITION_TABLE = [
			[],
			[6, 18],
			[6, 22],
			[6, 26],
			[6, 30],
			[6, 34],
			[6, 22, 38],
			[6, 24, 42],
			[6, 26, 46],
			[6, 28, 50],
			[6, 30, 54],
			[6, 32, 58],
			[6, 34, 62],
			[6, 26, 46, 66],
			[6, 26, 48, 70],
			[6, 26, 50, 74],
			[6, 30, 54, 78],
			[6, 30, 56, 82],
			[6, 30, 58, 86],
			[6, 34, 62, 90],
			[6, 28, 50, 72, 94],
			[6, 26, 50, 74, 98],
			[6, 30, 54, 78, 102],
			[6, 28, 54, 80, 106],
			[6, 32, 58, 84, 110],
			[6, 30, 58, 86, 114],
			[6, 34, 62, 90, 118],
			[6, 26, 50, 74, 98, 122],
			[6, 30, 54, 78, 102, 126],
			[6, 26, 52, 78, 104, 130],
			[6, 30, 56, 82, 108, 134],
			[6, 34, 60, 86, 112, 138],
			[6, 30, 58, 86, 114, 142],
			[6, 34, 62, 90, 118, 146],
			[6, 30, 54, 78, 102, 126, 150],
			[6, 24, 50, 76, 102, 128, 154],
			[6, 28, 54, 80, 106, 132, 158],
			[6, 32, 58, 84, 110, 136, 162],
			[6, 26, 54, 82, 110, 138, 166],
			[6, 30, 58, 86, 114, 142, 170]
		];
		var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
		var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
		var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

		var _this = {};

		var getBCHDigit = function(data) {
			var digit = 0;
			while (data != 0) {
				digit += 1;
				data >>>= 1;
			}
			return digit;
		};

		_this.getBCHTypeInfo = function(data) {
			var d = data << 10;
			while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
				d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
			}
			return ( (data << 10) | d) ^ G15_MASK;
		};

		_this.getBCHTypeNumber = function(data) {
			var d = data << 12;
			while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
				d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
			}
			return (data << 12) | d;
		};

		_this.getPatternPosition = function(typeNumber) {
			return PATTERN_POSITION_TABLE[typeNumber - 1];
		};

		_this.getMaskFunction = function(maskPattern) {

			switch (maskPattern) {

			case QRMaskPattern.PATTERN000 :
				return function(i, j) { return (i + j) % 2 == 0; };
			case QRMaskPattern.PATTERN001 :
				return function(i, j) { return i % 2 == 0; };
			case QRMaskPattern.PATTERN010 :
				return function(i, j) { return j % 3 == 0; };
			case QRMaskPattern.PATTERN011 :
				return function(i, j) { return (i + j) % 3 == 0; };
			case QRMaskPattern.PATTERN100 :
				return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
			case QRMaskPattern.PATTERN101 :
				return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
			case QRMaskPattern.PATTERN110 :
				return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
			case QRMaskPattern.PATTERN111 :
				return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

			default :
				throw new Error('bad maskPattern:' + maskPattern);
			}
		};

		_this.getErrorCorrectPolynomial = function(errorCorrectLength) {
			var a = qrPolynomial([1], 0);
			for (var i = 0; i < errorCorrectLength; i += 1) {
				a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
			}
			return a;
		};

		_this.getLengthInBits = function(mode, type) {

			if (1 <= type && type < 10) {

				// 1 - 9

				switch(mode) {
				case QRMode.MODE_NUMBER 	: return 10;
				case QRMode.MODE_ALPHA_NUM 	: return 9;
				case QRMode.MODE_8BIT_BYTE	: return 8;
				case QRMode.MODE_KANJI		: return 8;
				default :
					throw new Error('mode:' + mode);
				}

			} else if (type < 27) {

				// 10 - 26

				switch(mode) {
				case QRMode.MODE_NUMBER 	: return 12;
				case QRMode.MODE_ALPHA_NUM 	: return 11;
				case QRMode.MODE_8BIT_BYTE	: return 16;
				case QRMode.MODE_KANJI		: return 10;
				default :
					throw new Error('mode:' + mode);
				}

			} else if (type < 41) {

				// 27 - 40

				switch(mode) {
				case QRMode.MODE_NUMBER 	: return 14;
				case QRMode.MODE_ALPHA_NUM	: return 13;
				case QRMode.MODE_8BIT_BYTE	: return 16;
				case QRMode.MODE_KANJI		: return 12;
				default :
					throw new Error('mode:' + mode);
				}

			} else {
				throw new Error('type:' + type);
			}
		};

		_this.getLostPoint = function(qrcode) {

			var moduleCount = qrcode.getModuleCount();

			var lostPoint = 0;

			// LEVEL1

			for (var row = 0; row < moduleCount; row += 1) {
				for (var col = 0; col < moduleCount; col += 1) {

					var sameCount = 0;
					var dark = qrcode.isDark(row, col);

					for (var r = -1; r <= 1; r += 1) {

						if (row + r < 0 || moduleCount <= row + r) {
							continue;
						}

						for (var c = -1; c <= 1; c += 1) {

							if (col + c < 0 || moduleCount <= col + c) {
								continue;
							}

							if (r == 0 && c == 0) {
								continue;
							}

							if (dark == qrcode.isDark(row + r, col + c) ) {
								sameCount += 1;
							}
						}
					}

					if (sameCount > 5) {
						lostPoint += (3 + sameCount - 5);
					}
				}
			};

			// LEVEL2

			for (var row = 0; row < moduleCount - 1; row += 1) {
				for (var col = 0; col < moduleCount - 1; col += 1) {
					var count = 0;
					if (qrcode.isDark(row, col) ) count += 1;
					if (qrcode.isDark(row + 1, col) ) count += 1;
					if (qrcode.isDark(row, col + 1) ) count += 1;
					if (qrcode.isDark(row + 1, col + 1) ) count += 1;
					if (count == 0 || count == 4) {
						lostPoint += 3;
					}
				}
			}

			// LEVEL3

			for (var row = 0; row < moduleCount; row += 1) {
				for (var col = 0; col < moduleCount - 6; col += 1) {
					if (qrcode.isDark(row, col)
							&& !qrcode.isDark(row, col + 1)
							&&  qrcode.isDark(row, col + 2)
							&&  qrcode.isDark(row, col + 3)
							&&  qrcode.isDark(row, col + 4)
							&& !qrcode.isDark(row, col + 5)
							&&  qrcode.isDark(row, col + 6) ) {
						lostPoint += 40;
					}
				}
			}

			for (var col = 0; col < moduleCount; col += 1) {
				for (var row = 0; row < moduleCount - 6; row += 1) {
					if (qrcode.isDark(row, col)
							&& !qrcode.isDark(row + 1, col)
							&&  qrcode.isDark(row + 2, col)
							&&  qrcode.isDark(row + 3, col)
							&&  qrcode.isDark(row + 4, col)
							&& !qrcode.isDark(row + 5, col)
							&&  qrcode.isDark(row + 6, col) ) {
						lostPoint += 40;
					}
				}
			}

			// LEVEL4

			var darkCount = 0;

			for (var col = 0; col < moduleCount; col += 1) {
				for (var row = 0; row < moduleCount; row += 1) {
					if (qrcode.isDark(row, col) ) {
						darkCount += 1;
					}
				}
			}

			var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
			lostPoint += ratio * 10;

			return lostPoint;
		};

		return _this;
	}();

	//---------------------------------------------------------------------
	// QRMath
	//---------------------------------------------------------------------

	var QRMath = function() {

		var EXP_TABLE = new Array(256);
		var LOG_TABLE = new Array(256);

		// initialize tables
		for (var i = 0; i < 8; i += 1) {
			EXP_TABLE[i] = 1 << i;
		}
		for (var i = 8; i < 256; i += 1) {
			EXP_TABLE[i] = EXP_TABLE[i - 4]
				^ EXP_TABLE[i - 5]
				^ EXP_TABLE[i - 6]
				^ EXP_TABLE[i - 8];
		}
		for (var i = 0; i < 255; i += 1) {
			LOG_TABLE[EXP_TABLE[i] ] = i;
		}

		var _this = {};

		_this.glog = function(n) {

			if (n < 1) {
				throw new Error('glog(' + n + ')');
			}

			return LOG_TABLE[n];
		};

		_this.gexp = function(n) {

			while (n < 0) {
				n += 255;
			}

			while (n >= 256) {
				n -= 255;
			}

			return EXP_TABLE[n];
		};

		return _this;
	}();

	//---------------------------------------------------------------------
	// qrPolynomial
	//---------------------------------------------------------------------

	function qrPolynomial(num, shift) {

		if (typeof num.length == 'undefined') {
			throw new Error(num.length + '/' + shift);
		}

		var _num = function() {
			var offset = 0;
			while (offset < num.length && num[offset] == 0) {
				offset += 1;
			}
			var _num = new Array(num.length - offset + shift);
			for (var i = 0; i < num.length - offset; i += 1) {
				_num[i] = num[i + offset];
			}
			return _num;
		}();

		var _this = {};

		_this.get = function(index) {
			return _num[index];
		};

		_this.getLength = function() {
			return _num.length;
		};

		_this.multiply = function(e) {

			var num = new Array(_this.getLength() + e.getLength() - 1);

			for (var i = 0; i < _this.getLength(); i += 1) {
				for (var j = 0; j < e.getLength(); j += 1) {
					num[i + j] ^= QRMath.gexp(QRMath.glog(_this.get(i) ) + QRMath.glog(e.get(j) ) );
				}
			}

			return qrPolynomial(num, 0);
		};

		_this.mod = function(e) {

			if (_this.getLength() - e.getLength() < 0) {
				return _this;
			}

			var ratio = QRMath.glog(_this.get(0) ) - QRMath.glog(e.get(0) );

			var num = new Array(_this.getLength() );
			for (var i = 0; i < _this.getLength(); i += 1) {
				num[i] = _this.get(i);
			}

			for (var i = 0; i < e.getLength(); i += 1) {
				num[i] ^= QRMath.gexp(QRMath.glog(e.get(i) ) + ratio);
			}

			// recursive call
			return qrPolynomial(num, 0).mod(e);
		};

		return _this;
	};

	//---------------------------------------------------------------------
	// QRRSBlock
	//---------------------------------------------------------------------

	var QRRSBlock = function() {

		var RS_BLOCK_TABLE = [

			// L
			// M
			// Q
			// H

			// 1
			[1, 26, 19],
			[1, 26, 16],
			[1, 26, 13],
			[1, 26, 9],

			// 2
			[1, 44, 34],
			[1, 44, 28],
			[1, 44, 22],
			[1, 44, 16],

			// 3
			[1, 70, 55],
			[1, 70, 44],
			[2, 35, 17],
			[2, 35, 13],

			// 4
			[1, 100, 80],
			[2, 50, 32],
			[2, 50, 24],
			[4, 25, 9],

			// 5
			[1, 134, 108],
			[2, 67, 43],
			[2, 33, 15, 2, 34, 16],
			[2, 33, 11, 2, 34, 12],

			// 6
			[2, 86, 68],
			[4, 43, 27],
			[4, 43, 19],
			[4, 43, 15],

			// 7
			[2, 98, 78],
			[4, 49, 31],
			[2, 32, 14, 4, 33, 15],
			[4, 39, 13, 1, 40, 14],

			// 8
			[2, 121, 97],
			[2, 60, 38, 2, 61, 39],
			[4, 40, 18, 2, 41, 19],
			[4, 40, 14, 2, 41, 15],

			// 9
			[2, 146, 116],
			[3, 58, 36, 2, 59, 37],
			[4, 36, 16, 4, 37, 17],
			[4, 36, 12, 4, 37, 13],

			// 10
			[2, 86, 68, 2, 87, 69],
			[4, 69, 43, 1, 70, 44],
			[6, 43, 19, 2, 44, 20],
			[6, 43, 15, 2, 44, 16],

			// 11
			[4, 101, 81],
			[1, 80, 50, 4, 81, 51],
			[4, 50, 22, 4, 51, 23],
			[3, 36, 12, 8, 37, 13],

			// 12
			[2, 116, 92, 2, 117, 93],
			[6, 58, 36, 2, 59, 37],
			[4, 46, 20, 6, 47, 21],
			[7, 42, 14, 4, 43, 15],

			// 13
			[4, 133, 107],
			[8, 59, 37, 1, 60, 38],
			[8, 44, 20, 4, 45, 21],
			[12, 33, 11, 4, 34, 12],

			// 14
			[3, 145, 115, 1, 146, 116],
			[4, 64, 40, 5, 65, 41],
			[11, 36, 16, 5, 37, 17],
			[11, 36, 12, 5, 37, 13],

			// 15
			[5, 109, 87, 1, 110, 88],
			[5, 65, 41, 5, 66, 42],
			[5, 54, 24, 7, 55, 25],
			[11, 36, 12],

			// 16
			[5, 122, 98, 1, 123, 99],
			[7, 73, 45, 3, 74, 46],
			[15, 43, 19, 2, 44, 20],
			[3, 45, 15, 13, 46, 16],

			// 17
			[1, 135, 107, 5, 136, 108],
			[10, 74, 46, 1, 75, 47],
			[1, 50, 22, 15, 51, 23],
			[2, 42, 14, 17, 43, 15],

			// 18
			[5, 150, 120, 1, 151, 121],
			[9, 69, 43, 4, 70, 44],
			[17, 50, 22, 1, 51, 23],
			[2, 42, 14, 19, 43, 15],

			// 19
			[3, 141, 113, 4, 142, 114],
			[3, 70, 44, 11, 71, 45],
			[17, 47, 21, 4, 48, 22],
			[9, 39, 13, 16, 40, 14],

			// 20
			[3, 135, 107, 5, 136, 108],
			[3, 67, 41, 13, 68, 42],
			[15, 54, 24, 5, 55, 25],
			[15, 43, 15, 10, 44, 16],

			// 21
			[4, 144, 116, 4, 145, 117],
			[17, 68, 42],
			[17, 50, 22, 6, 51, 23],
			[19, 46, 16, 6, 47, 17],

			// 22
			[2, 139, 111, 7, 140, 112],
			[17, 74, 46],
			[7, 54, 24, 16, 55, 25],
			[34, 37, 13],

			// 23
			[4, 151, 121, 5, 152, 122],
			[4, 75, 47, 14, 76, 48],
			[11, 54, 24, 14, 55, 25],
			[16, 45, 15, 14, 46, 16],

			// 24
			[6, 147, 117, 4, 148, 118],
			[6, 73, 45, 14, 74, 46],
			[11, 54, 24, 16, 55, 25],
			[30, 46, 16, 2, 47, 17],

			// 25
			[8, 132, 106, 4, 133, 107],
			[8, 75, 47, 13, 76, 48],
			[7, 54, 24, 22, 55, 25],
			[22, 45, 15, 13, 46, 16],

			// 26
			[10, 142, 114, 2, 143, 115],
			[19, 74, 46, 4, 75, 47],
			[28, 50, 22, 6, 51, 23],
			[33, 46, 16, 4, 47, 17],

			// 27
			[8, 152, 122, 4, 153, 123],
			[22, 73, 45, 3, 74, 46],
			[8, 53, 23, 26, 54, 24],
			[12, 45, 15, 28, 46, 16],

			// 28
			[3, 147, 117, 10, 148, 118],
			[3, 73, 45, 23, 74, 46],
			[4, 54, 24, 31, 55, 25],
			[11, 45, 15, 31, 46, 16],

			// 29
			[7, 146, 116, 7, 147, 117],
			[21, 73, 45, 7, 74, 46],
			[1, 53, 23, 37, 54, 24],
			[19, 45, 15, 26, 46, 16],

			// 30
			[5, 145, 115, 10, 146, 116],
			[19, 75, 47, 10, 76, 48],
			[15, 54, 24, 25, 55, 25],
			[23, 45, 15, 25, 46, 16],

			// 31
			[13, 145, 115, 3, 146, 116],
			[2, 74, 46, 29, 75, 47],
			[42, 54, 24, 1, 55, 25],
			[23, 45, 15, 28, 46, 16],

			// 32
			[17, 145, 115],
			[10, 74, 46, 23, 75, 47],
			[10, 54, 24, 35, 55, 25],
			[19, 45, 15, 35, 46, 16],

			// 33
			[17, 145, 115, 1, 146, 116],
			[14, 74, 46, 21, 75, 47],
			[29, 54, 24, 19, 55, 25],
			[11, 45, 15, 46, 46, 16],

			// 34
			[13, 145, 115, 6, 146, 116],
			[14, 74, 46, 23, 75, 47],
			[44, 54, 24, 7, 55, 25],
			[59, 46, 16, 1, 47, 17],

			// 35
			[12, 151, 121, 7, 152, 122],
			[12, 75, 47, 26, 76, 48],
			[39, 54, 24, 14, 55, 25],
			[22, 45, 15, 41, 46, 16],

			// 36
			[6, 151, 121, 14, 152, 122],
			[6, 75, 47, 34, 76, 48],
			[46, 54, 24, 10, 55, 25],
			[2, 45, 15, 64, 46, 16],

			// 37
			[17, 152, 122, 4, 153, 123],
			[29, 74, 46, 14, 75, 47],
			[49, 54, 24, 10, 55, 25],
			[24, 45, 15, 46, 46, 16],

			// 38
			[4, 152, 122, 18, 153, 123],
			[13, 74, 46, 32, 75, 47],
			[48, 54, 24, 14, 55, 25],
			[42, 45, 15, 32, 46, 16],

			// 39
			[20, 147, 117, 4, 148, 118],
			[40, 75, 47, 7, 76, 48],
			[43, 54, 24, 22, 55, 25],
			[10, 45, 15, 67, 46, 16],

			// 40
			[19, 148, 118, 6, 149, 119],
			[18, 75, 47, 31, 76, 48],
			[34, 54, 24, 34, 55, 25],
			[20, 45, 15, 61, 46, 16]
		];

		var qrRSBlock = function(totalCount, dataCount) {
			var _this = {};
			_this.totalCount = totalCount;
			_this.dataCount = dataCount;
			return _this;
		};

		var _this = {};

		var getRsBlockTable = function(typeNumber, errorCorrectLevel) {

			switch(errorCorrectLevel) {
			case QRErrorCorrectLevel.L :
				return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
			case QRErrorCorrectLevel.M :
				return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
			case QRErrorCorrectLevel.Q :
				return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
			case QRErrorCorrectLevel.H :
				return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
			default :
				return undefined;
			}
		};

		_this.getRSBlocks = function(typeNumber, errorCorrectLevel) {

			var rsBlock = getRsBlockTable(typeNumber, errorCorrectLevel);

			if (typeof rsBlock == 'undefined') {
				throw new Error('bad rs block @ typeNumber:' + typeNumber +
						'/errorCorrectLevel:' + errorCorrectLevel);
			}

			var length = rsBlock.length / 3;

			var list = new Array();

			for (var i = 0; i < length; i += 1) {

				var count = rsBlock[i * 3 + 0];
				var totalCount = rsBlock[i * 3 + 1];
				var dataCount = rsBlock[i * 3 + 2];

				for (var j = 0; j < count; j += 1) {
					list.push(qrRSBlock(totalCount, dataCount) );
				}
			}

			return list;
		};

		return _this;
	}();

	//---------------------------------------------------------------------
	// qrBitBuffer
	//---------------------------------------------------------------------

	var qrBitBuffer = function() {

		var _buffer = new Array();
		var _length = 0;

		var _this = {};

		_this.getBuffer = function() {
			return _buffer;
		};

		_this.get = function(index) {
			var bufIndex = Math.floor(index / 8);
			return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
		};

		_this.put = function(num, length) {
			for (var i = 0; i < length; i += 1) {
				_this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
			}
		};

		_this.getLengthInBits = function() {
			return _length;
		};

		_this.putBit = function(bit) {

			var bufIndex = Math.floor(_length / 8);
			if (_buffer.length <= bufIndex) {
				_buffer.push(0);
			}

			if (bit) {
				_buffer[bufIndex] |= (0x80 >>> (_length % 8) );
			}

			_length += 1;
		};

		return _this;
	};

	//---------------------------------------------------------------------
	// qr8BitByte
	//---------------------------------------------------------------------

	var qr8BitByte = function(data) {

		var _mode = QRMode.MODE_8BIT_BYTE;
		var _data = data;
		var _bytes = qrcode.stringToBytes(data);

		var _this = {};

		_this.getMode = function() {
			return _mode;
		};

		_this.getLength = function(buffer) {
			return _bytes.length;
		};

		_this.write = function(buffer) {
			for (var i = 0; i < _bytes.length; i += 1) {
				buffer.put(_bytes[i], 8);
			}
		};

		return _this;
	};

	//=====================================================================
	// GIF Support etc.
	//

	//---------------------------------------------------------------------
	// byteArrayOutputStream
	//---------------------------------------------------------------------

	var byteArrayOutputStream = function() {

		var _bytes = new Array();

		var _this = {};

		_this.writeByte = function(b) {
			_bytes.push(b & 0xff);
		};

		_this.writeShort = function(i) {
			_this.writeByte(i);
			_this.writeByte(i >>> 8);
		};

		_this.writeBytes = function(b, off, len) {
			off = off || 0;
			len = len || b.length;
			for (var i = 0; i < len; i += 1) {
				_this.writeByte(b[i + off]);
			}
		};

		_this.writeString = function(s) {
			for (var i = 0; i < s.length; i += 1) {
				_this.writeByte(s.charCodeAt(i) );
			}
		};

		_this.toByteArray = function() {
			return _bytes;
		};

		_this.toString = function() {
			var s = '';
			s += '[';
			for (var i = 0; i < _bytes.length; i += 1) {
				if (i > 0) {
					s += ',';
				}
				s += _bytes[i];
			}
			s += ']';
			return s;
		};

		return _this;
	};

	//---------------------------------------------------------------------
	// base64EncodeOutputStream
	//---------------------------------------------------------------------

	var base64EncodeOutputStream = function() {

		var _buffer = 0;
		var _buflen = 0;
		var _length = 0;
		var _base64 = '';

		var _this = {};

		var writeEncoded = function(b) {
			_base64 += String.fromCharCode(encode(b & 0x3f) );
		};

		var encode = function(n) {
			if (n < 0) {
				// error.
			} else if (n < 26) {
				return 0x41 + n;
			} else if (n < 52) {
				return 0x61 + (n - 26);
			} else if (n < 62) {
				return 0x30 + (n - 52);
			} else if (n == 62) {
				return 0x2b;
			} else if (n == 63) {
				return 0x2f;
			}
			throw new Error('n:' + n);
		};

		_this.writeByte = function(n) {

			_buffer = (_buffer << 8) | (n & 0xff);
			_buflen += 8;
			_length += 1;

			while (_buflen >= 6) {
				writeEncoded(_buffer >>> (_buflen - 6) );
				_buflen -= 6;
			}
		};

		_this.flush = function() {

			if (_buflen > 0) {
				writeEncoded(_buffer << (6 - _buflen) );
				_buffer = 0;
				_buflen = 0;
			}

			if (_length % 3 != 0) {
				// padding
				var padlen = 3 - _length % 3;
				for (var i = 0; i < padlen; i += 1) {
					_base64 += '=';
				}
			}
		};

		_this.toString = function() {
			return _base64;
		};

		return _this;
	};

	//---------------------------------------------------------------------
	// base64DecodeInputStream
	//---------------------------------------------------------------------

	var base64DecodeInputStream = function(str) {

		var _str = str;
		var _pos = 0;
		var _buffer = 0;
		var _buflen = 0;

		var _this = {};

		_this.read = function() {

			while (_buflen < 8) {

				if (_pos >= _str.length) {
					if (_buflen == 0) {
						return -1;
					}
					throw new Error('unexpected end of file./' + _buflen);
				}

				var c = _str.charAt(_pos);
				_pos += 1;

				if (c == '=') {
					_buflen = 0;
					return -1;
				} else if (c.match(/^\s$/) ) {
					// ignore if whitespace.
					continue;
				}

				_buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
				_buflen += 6;
			}

			var n = (_buffer >>> (_buflen - 8) ) & 0xff;
			_buflen -= 8;
			return n;
		};

		var decode = function(c) {
			if (0x41 <= c && c <= 0x5a) {
				return c - 0x41;
			} else if (0x61 <= c && c <= 0x7a) {
				return c - 0x61 + 26;
			} else if (0x30 <= c && c <= 0x39) {
				return c - 0x30 + 52;
			} else if (c == 0x2b) {
				return 62;
			} else if (c == 0x2f) {
				return 63;
			} else {
				throw new Error('c:' + c);
			}
		};

		return _this;
	};

	//---------------------------------------------------------------------
	// gifImage (B/W)
	//---------------------------------------------------------------------

	var gifImage = function(width, height) {

		var _width = width;
		var _height = height;
		var _data = new Array(width * height);

		var _this = {};

		_this.setPixel = function(x, y, pixel) {
			_data[y * _width + x] = pixel;
		};

		_this.write = function(out) {

			//---------------------------------
			// GIF Signature

			out.writeString('GIF87a');

			//---------------------------------
			// Screen Descriptor

			out.writeShort(_width);
			out.writeShort(_height);

			out.writeByte(0x80); // 2bit
			out.writeByte(0);
			out.writeByte(0);

			//---------------------------------
			// Global Color Map

			// black
			out.writeByte(0x00);
			out.writeByte(0x00);
			out.writeByte(0x00);

			// white
			out.writeByte(0xff);
			out.writeByte(0xff);
			out.writeByte(0xff);

			//---------------------------------
			// Image Descriptor

			out.writeString(',');
			out.writeShort(0);
			out.writeShort(0);
			out.writeShort(_width);
			out.writeShort(_height);
			out.writeByte(0);

			//---------------------------------
			// Local Color Map

			//---------------------------------
			// Raster Data

			var lzwMinCodeSize = 2;
			var raster = getLZWRaster(lzwMinCodeSize);

			out.writeByte(lzwMinCodeSize);

			var offset = 0;

			while (raster.length - offset > 255) {
				out.writeByte(255);
				out.writeBytes(raster, offset, 255);
				offset += 255;
			}

			out.writeByte(raster.length - offset);
			out.writeBytes(raster, offset, raster.length - offset);
			out.writeByte(0x00);

			//---------------------------------
			// GIF Terminator
			out.writeString(';');
		};

		var bitOutputStream = function(out) {

			var _out = out;
			var _bitLength = 0;
			var _bitBuffer = 0;

			var _this = {};

			_this.write = function(data, length) {

				if ( (data >>> length) != 0) {
					throw new Error('length over');
				}

				while (_bitLength + length >= 8) {
					_out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
					length -= (8 - _bitLength);
					data >>>= (8 - _bitLength);
					_bitBuffer = 0;
					_bitLength = 0;
				}

				_bitBuffer = (data << _bitLength) | _bitBuffer;
				_bitLength = _bitLength + length;
			};

			_this.flush = function() {
				if (_bitLength > 0) {
					_out.writeByte(_bitBuffer);
				}
			};

			return _this;
		};

		var getLZWRaster = function(lzwMinCodeSize) {

			var clearCode = 1 << lzwMinCodeSize;
			var endCode = (1 << lzwMinCodeSize) + 1;
			var bitLength = lzwMinCodeSize + 1;

			// Setup LZWTable
			var table = lzwTable();

			for (var i = 0; i < clearCode; i += 1) {
				table.add(String.fromCharCode(i) );
			}
			table.add(String.fromCharCode(clearCode) );
			table.add(String.fromCharCode(endCode) );

			var byteOut = byteArrayOutputStream();
			var bitOut = bitOutputStream(byteOut);

			// clear code
			bitOut.write(clearCode, bitLength);

			var dataIndex = 0;

			var s = String.fromCharCode(_data[dataIndex]);
			dataIndex += 1;

			while (dataIndex < _data.length) {

				var c = String.fromCharCode(_data[dataIndex]);
				dataIndex += 1;

				if (table.contains(s + c) ) {

					s = s + c;

				} else {

					bitOut.write(table.indexOf(s), bitLength);

					if (table.size() < 0xfff) {

						if (table.size() == (1 << bitLength) ) {
							bitLength += 1;
						}

						table.add(s + c);
					}

					s = c;
				}
			}

			bitOut.write(table.indexOf(s), bitLength);

			// end code
			bitOut.write(endCode, bitLength);

			bitOut.flush();

			return byteOut.toByteArray();
		};

		var lzwTable = function() {

			var _map = {};
			var _size = 0;

			var _this = {};

			_this.add = function(key) {
				if (_this.contains(key) ) {
					throw new Error('dup key:' + key);
				}
				_map[key] = _size;
				_size += 1;
			};

			_this.size = function() {
				return _size;
			};

			_this.indexOf = function(key) {
				return _map[key];
			};

			_this.contains = function(key) {
				return typeof _map[key] != 'undefined';
			};

			return _this;
		};

		return _this;
	};

	var createImgTag = function(width, height, getPixel, alt) {

		var gif = gifImage(width, height);
		for (var y = 0; y < height; y += 1) {
			for (var x = 0; x < width; x += 1) {
				gif.setPixel(x, y, getPixel(x, y) );
			}
		}

		var b = byteArrayOutputStream();
		gif.write(b);

		var base64 = base64EncodeOutputStream();
		var bytes = b.toByteArray();
		for (var i = 0; i < bytes.length; i += 1) {
			base64.writeByte(bytes[i]);
		}
		base64.flush();

		var img = '';
		img += '<img';
		img += '\u0020src="';
		img += 'data:image/gif;base64,';
		img += base64;
		img += '"';
		img += '\u0020width="';
		img += width;
		img += '"';
		img += '\u0020height="';
		img += height;
		img += '"';
		if (alt) {
			img += '\u0020alt="';
			img += alt;
			img += '"';
		}
		img += '/>';

		return img;
	};

	//---------------------------------------------------------------------
	// returns qrcode function.

	return qrcode;
}();

; browserify_shim__define__module__export__(typeof qrcode != "undefined" ? qrcode : window.qrcode);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
(function (global){

; Spinner = global.Spinner = require("e:\\codes\\nodejs\\af\\bower_components\\ladda-bootstrap\\dist\\spin.js");
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
(function(root, factory) {
    if (typeof exports === "object") {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define([ "spin" ], factory);
    } else {
        root.Ladda = factory(root.Spinner);
    }
})(this, function(Spinner) {
    "use strict";
    var ALL_INSTANCES = [];
    function create(button) {
        if (typeof button === "undefined") {
            console.warn("Ladda button target must be defined.");
            return;
        }
        if (!button.querySelector(".ladda-label")) {
            button.innerHTML = '<span class="ladda-label">' + button.innerHTML + "</span>";
        }
        var spinner = createSpinner(button);
        var spinnerWrapper = document.createElement("span");
        spinnerWrapper.className = "ladda-spinner";
        button.appendChild(spinnerWrapper);
        var timer;
        var instance = {
            start: function() {
                button.setAttribute("disabled", "");
                button.setAttribute("data-loading", "");
                clearTimeout(timer);
                spinner.spin(spinnerWrapper);
                this.setProgress(0);
                return this;
            },
            startAfter: function(delay) {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    instance.start();
                }, delay);
                return this;
            },
            stop: function() {
                button.removeAttribute("disabled");
                button.removeAttribute("data-loading");
                clearTimeout(timer);
                timer = setTimeout(function() {
                    spinner.stop();
                }, 1e3);
                return this;
            },
            toggle: function() {
                if (this.isLoading()) {
                    this.stop();
                } else {
                    this.start();
                }
                return this;
            },
            setProgress: function(progress) {
                progress = Math.max(Math.min(progress, 1), 0);
                var progressElement = button.querySelector(".ladda-progress");
                if (progress === 0 && progressElement && progressElement.parentNode) {
                    progressElement.parentNode.removeChild(progressElement);
                } else {
                    if (!progressElement) {
                        progressElement = document.createElement("div");
                        progressElement.className = "ladda-progress";
                        button.appendChild(progressElement);
                    }
                    progressElement.style.width = (progress || 0) * button.offsetWidth + "px";
                }
            },
            enable: function() {
                this.stop();
                return this;
            },
            disable: function() {
                this.stop();
                button.setAttribute("disabled", "");
                return this;
            },
            isLoading: function() {
                return button.hasAttribute("data-loading");
            }
        };
        ALL_INSTANCES.push(instance);
        return instance;
    }
    function bind(target, options) {
        options = options || {};
        var targets = [];
        if (typeof target === "string") {
            targets = toArray(document.querySelectorAll(target));
        } else if (typeof target === "object" && typeof target.nodeName === "string") {
            targets = [ target ];
        }
        for (var i = 0, len = targets.length; i < len; i++) {
            (function() {
                var element = targets[i];
                if (typeof element.addEventListener === "function") {
                    var instance = create(element);
                    var timeout = -1;
                    element.addEventListener("click", function() {
                        instance.startAfter(1);
                        if (typeof options.timeout === "number") {
                            clearTimeout(timeout);
                            timeout = setTimeout(instance.stop, options.timeout);
                        }
                        if (typeof options.callback === "function") {
                            options.callback.apply(null, [ instance ]);
                        }
                    }, false);
                }
            })();
        }
    }
    function stopAll() {
        for (var i = 0, len = ALL_INSTANCES.length; i < len; i++) {
            ALL_INSTANCES[i].stop();
        }
    }
    function createSpinner(button) {
        var height = button.offsetHeight, spinnerColor;
        if (height > 32) {
            height *= .8;
        }
        if (button.hasAttribute("data-spinner-size")) {
            height = parseInt(button.getAttribute("data-spinner-size"), 10);
        }
        if (button.hasAttribute("data-spinner-color")) {
            spinnerColor = button.getAttribute("data-spinner-color");
        }
        var lines = 12, radius = height * .2, length = radius * .6, width = radius < 7 ? 2 : 3;
        return new Spinner({
            color: spinnerColor || "#fff",
            lines: lines,
            radius: radius,
            length: length,
            width: width,
            zIndex: "auto",
            top: "auto",
            left: "auto",
            className: ""
        });
    }
    function toArray(nodes) {
        var a = [];
        for (var i = 0; i < nodes.length; i++) {
            a.push(nodes[i]);
        }
        return a;
    }
    return {
        bind: bind,
        create: create,
        stopAll: stopAll
    };
});
; browserify_shim__define__module__export__(typeof Ladda != "undefined" ? Ladda : window.Ladda);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"e:\\codes\\nodejs\\af\\bower_components\\ladda-bootstrap\\dist\\spin.js":8}],8:[function(require,module,exports){
(function (global){
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
(function(root, factory) {
    if (typeof exports == "object") module.exports = factory(); else if (typeof define == "function" && define.amd) define(factory); else root.Spinner = factory();
})(this, function() {
    "use strict";
    var prefixes = [ "webkit", "Moz", "ms", "O" ], animations = {}, useCssAnimations;
    function createEl(tag, prop) {
        var el = document.createElement(tag || "div"), n;
        for (n in prop) el[n] = prop[n];
        return el;
    }
    function ins(parent) {
        for (var i = 1, n = arguments.length; i < n; i++) parent.appendChild(arguments[i]);
        return parent;
    }
    var sheet = function() {
        var el = createEl("style", {
            type: "text/css"
        });
        ins(document.getElementsByTagName("head")[0], el);
        return el.sheet || el.styleSheet;
    }();
    function addAnimation(alpha, trail, i, lines) {
        var name = [ "opacity", trail, ~~(alpha * 100), i, lines ].join("-"), start = .01 + i / lines * 100, z = Math.max(1 - (1 - alpha) / trail * (100 - start), alpha), prefix = useCssAnimations.substring(0, useCssAnimations.indexOf("Animation")).toLowerCase(), pre = prefix && "-" + prefix + "-" || "";
        if (!animations[name]) {
            sheet.insertRule("@" + pre + "keyframes " + name + "{" + "0%{opacity:" + z + "}" + start + "%{opacity:" + alpha + "}" + (start + .01) + "%{opacity:1}" + (start + trail) % 100 + "%{opacity:" + alpha + "}" + "100%{opacity:" + z + "}" + "}", sheet.cssRules.length);
            animations[name] = 1;
        }
        return name;
    }
    function vendor(el, prop) {
        var s = el.style, pp, i;
        if (s[prop] !== undefined) return prop;
        prop = prop.charAt(0).toUpperCase() + prop.slice(1);
        for (i = 0; i < prefixes.length; i++) {
            pp = prefixes[i] + prop;
            if (s[pp] !== undefined) return pp;
        }
    }
    function css(el, prop) {
        for (var n in prop) el.style[vendor(el, n) || n] = prop[n];
        return el;
    }
    function merge(obj) {
        for (var i = 1; i < arguments.length; i++) {
            var def = arguments[i];
            for (var n in def) if (obj[n] === undefined) obj[n] = def[n];
        }
        return obj;
    }
    function pos(el) {
        var o = {
            x: el.offsetLeft,
            y: el.offsetTop
        };
        while (el = el.offsetParent) o.x += el.offsetLeft, o.y += el.offsetTop;
        return o;
    }
    var defaults = {
        lines: 12,
        length: 7,
        width: 5,
        radius: 10,
        rotate: 0,
        corners: 1,
        color: "#000",
        direction: 1,
        speed: 1,
        trail: 100,
        opacity: 1 / 4,
        fps: 20,
        zIndex: 2e9,
        className: "spinner",
        top: "auto",
        left: "auto",
        position: "relative"
    };
    function Spinner(o) {
        if (typeof this == "undefined") return new Spinner(o);
        this.opts = merge(o || {}, Spinner.defaults, defaults);
    }
    Spinner.defaults = {};
    merge(Spinner.prototype, {
        spin: function(target) {
            this.stop();
            var self = this, o = self.opts, el = self.el = css(createEl(0, {
                className: o.className
            }), {
                position: o.position,
                width: 0,
                zIndex: o.zIndex
            }), mid = o.radius + o.length + o.width, ep, tp;
            if (target) {
                target.insertBefore(el, target.firstChild || null);
                tp = pos(target);
                ep = pos(el);
                css(el, {
                    left: (o.left == "auto" ? tp.x - ep.x + (target.offsetWidth >> 1) : parseInt(o.left, 10) + mid) + "px",
                    top: (o.top == "auto" ? tp.y - ep.y + (target.offsetHeight >> 1) : parseInt(o.top, 10) + mid) + "px"
                });
            }
            el.setAttribute("role", "progressbar");
            self.lines(el, self.opts);
            if (!useCssAnimations) {
                var i = 0, start = (o.lines - 1) * (1 - o.direction) / 2, alpha, fps = o.fps, f = fps / o.speed, ostep = (1 - o.opacity) / (f * o.trail / 100), astep = f / o.lines;
                (function anim() {
                    i++;
                    for (var j = 0; j < o.lines; j++) {
                        alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity);
                        self.opacity(el, j * o.direction + start, alpha, o);
                    }
                    self.timeout = self.el && setTimeout(anim, ~~(1e3 / fps));
                })();
            }
            return self;
        },
        stop: function() {
            var el = this.el;
            if (el) {
                clearTimeout(this.timeout);
                if (el.parentNode) el.parentNode.removeChild(el);
                this.el = undefined;
            }
            return this;
        },
        lines: function(el, o) {
            var i = 0, start = (o.lines - 1) * (1 - o.direction) / 2, seg;
            function fill(color, shadow) {
                return css(createEl(), {
                    position: "absolute",
                    width: o.length + o.width + "px",
                    height: o.width + "px",
                    background: color,
                    boxShadow: shadow,
                    transformOrigin: "left",
                    transform: "rotate(" + ~~(360 / o.lines * i + o.rotate) + "deg) translate(" + o.radius + "px" + ",0)",
                    borderRadius: (o.corners * o.width >> 1) + "px"
                });
            }
            for (;i < o.lines; i++) {
                seg = css(createEl(), {
                    position: "absolute",
                    top: 1 + ~(o.width / 2) + "px",
                    transform: o.hwaccel ? "translate3d(0,0,0)" : "",
                    opacity: o.opacity,
                    animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + " " + 1 / o.speed + "s linear infinite"
                });
                if (o.shadow) ins(seg, css(fill("#000", "0 0 4px " + "#000"), {
                    top: 2 + "px"
                }));
                ins(el, ins(seg, fill(o.color, "0 0 1px rgba(0,0,0,.1)")));
            }
            return el;
        },
        opacity: function(el, i, val) {
            if (i < el.childNodes.length) el.childNodes[i].style.opacity = val;
        }
    });
    function initVML() {
        function vml(tag, attr) {
            return createEl("<" + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr);
        }
        sheet.addRule(".spin-vml", "behavior:url(#default#VML)");
        Spinner.prototype.lines = function(el, o) {
            var r = o.length + o.width, s = 2 * r;
            function grp() {
                return css(vml("group", {
                    coordsize: s + " " + s,
                    coordorigin: -r + " " + -r
                }), {
                    width: s,
                    height: s
                });
            }
            var margin = -(o.width + o.length) * 2 + "px", g = css(grp(), {
                position: "absolute",
                top: margin,
                left: margin
            }), i;
            function seg(i, dx, filter) {
                ins(g, ins(css(grp(), {
                    rotation: 360 / o.lines * i + "deg",
                    left: ~~dx
                }), ins(css(vml("roundrect", {
                    arcsize: o.corners
                }), {
                    width: r,
                    height: o.width,
                    left: o.radius,
                    top: -o.width >> 1,
                    filter: filter
                }), vml("fill", {
                    color: o.color,
                    opacity: o.opacity
                }), vml("stroke", {
                    opacity: 0
                }))));
            }
            if (o.shadow) for (i = 1; i <= o.lines; i++) seg(i, -2, "progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");
            for (i = 1; i <= o.lines; i++) seg(i);
            return ins(el, g);
        };
        Spinner.prototype.opacity = function(el, i, val, o) {
            var c = el.firstChild;
            o = o.shadow && o.lines || 0;
            if (c && i + o < c.childNodes.length) {
                c = c.childNodes[i + o];
                c = c && c.firstChild;
                c = c && c.firstChild;
                if (c) c.opacity = val;
            }
        };
    }
    var probe = css(createEl("group"), {
        behavior: "url(#default#VML)"
    });
    if (!vendor(probe, "transform") && probe.adj) initVML(); else useCssAnimations = vendor(probe, "animation");
    return Spinner;
});
; browserify_shim__define__module__export__(typeof Spinner != "undefined" ? Spinner : window.Spinner);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxcY29kZXNcXG5vZGVqc1xcYWZcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvc2FsZS9iYXRjaC1kb3dubG9hZC5qcyIsImU6L2NvZGVzL25vZGVqcy9hZi9hcHAvY2xpZW50L2pzL3NhbGUvcXItY2FudmFzLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2FwcC9jbGllbnQvanMvc2FsZS9zZXJ2ZXIuanMiLCJlOi9jb2Rlcy9ub2RlanMvYWYvYm93ZXJfY29tcG9uZW50cy9ibHVlaW1wLWNhbnZhcy10by1ibG9iL2pzL2NhbnZhcy10by1ibG9iLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2Jvd2VyX2NvbXBvbmVudHMvanF1ZXJ5LnFyY29kZS9zcmMvanF1ZXJ5LnFyY29kZS5qcyIsImU6L2NvZGVzL25vZGVqcy9hZi9ib3dlcl9jb21wb25lbnRzL2pxdWVyeS5xcmNvZGUvc3JjL3FyY29kZS5qcyIsImU6L2NvZGVzL25vZGVqcy9hZi9ib3dlcl9jb21wb25lbnRzL2xhZGRhLWJvb3RzdHJhcC9kaXN0L2xhZGRhLmpzIiwiZTovY29kZXMvbm9kZWpzL2FmL2Jvd2VyX2NvbXBvbmVudHMvbGFkZGEtYm9vdHN0cmFwL2Rpc3Qvc3Bpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KTtcclxudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuXHJcbi8vVE9ETzogbGFkZGEgYW4gc3BpbiBoYXMgZGVwIHJlbGF0aW9uc2hpcC5cclxuXHJcbnZhciBMYWRkYSA9IHJlcXVpcmUoJ2xhZGRhJyk7XHJcblxyXG5yZXF1aXJlKCdxcmNvZGUnKTtcclxucmVxdWlyZSgnanF1ZXJ5LXFyY29kZScpO1xyXG5yZXF1aXJlKCdjYW52YXMtdG8tYmxvYicpO1xyXG5cclxudmFyIGdldFRleHRzID0gcmVxdWlyZSgnLi9zZXJ2ZXInKS5nZXRUZXh0cztcclxudmFyIHFyQ2FudmFzID0gcmVxdWlyZSgnLi9xci1jYW52YXMnKTtcclxudmFyIGRyYXcgPSBxckNhbnZhcy5kcmF3O1xyXG52YXIgY2FsY0NhbnZhc0RpbWVuc2lvbiA9IHFyQ2FudmFzLmNhbGNDYW52YXNEaW1lbnNpb247XHJcblxyXG5cclxudmFyIGRlZmF1bHRzID0ge1xyXG4gICAgc2l6ZTogMTI4LFxyXG4gICAgbWFyZ2luOiAyMCxcclxuICAgIGNvbHM6IDgsXHJcbiAgICByb3dzOiA4LFxyXG4gICAgZWNsOiBcIkhcIlxyXG59O1xyXG52YXIgb3B0aW9ucyA9IHt9O1xyXG52YXIgY2FudmFzO1xyXG4vLyBkb20gY2FjaGU6XHJcbnZhclxyXG4gICAgJGZvcm0gPSAkKCcjcXItZm9ybScpICxcclxuICAgICRidG5TdWJtaXQgPSAkZm9ybS5maW5kKCdidXR0b25bdHlwZT1zdWJtaXRdJykgLFxyXG4gICAgJGJ0bkRvd25sb2FkID0gJCgnLnFyLWRvd25sb2FkJykgLFxyXG4gICAgJHFyRWNsID0gJCgnI3FyLWVjbCcpICxcclxuXHJcbiAgICAkYW1vdW50ID0gJCgnLnFyLWFtb3VudCcpLFxyXG4gICAgJHdpZHRoID0gJCgnLnFyLXdpZHRoJyksXHJcbiAgICAkaGVpZ2h0ID0gJCgnLnFyLWhlaWdodCcpXHJcblxyXG52YXIgbGFkZGFTdWJtaXQgPSBMYWRkYS5jcmVhdGUoJGJ0blN1Ym1pdFswXSk7XHJcblxyXG52YXIgdGltZTE7XHJcblxyXG5cclxuZnVuY3Rpb24gZ2V0Q291bnQoKSB7XHJcbiAgICByZXR1cm4gb3B0aW9ucy5jb2xzICogb3B0aW9ucy5yb3dzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfY2hlY2tWYWxpZCgpIHtcclxuICAgIHZhciBhcnIgPSBnZXREcm9wZG93blZhbHVlcygkcXJFY2wpO1xyXG5cclxuICAgIHJldHVybiBfLmV2ZXJ5KCBvcHRpb25zLCBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgLy8gbGVhdmVzIHRoZSBwb3NzaWJpbGl0aWVzIHRoYXQgZWNsIGlzIGEgbnVtYmVyLCBpIHRoaW5rIG5vIG5lZWQgYmUgdG9vIHNwZWNpZmljLlxyXG4gICAgICAgIHJldHVybiBfLmlzTnVtYmVyKHZhbCkgfHwgXy5jb250YWlucyhhcnIsIHZhbClcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyBUSEUgUFJFUkVRVUlTSVRFXHJcbi8vIHBvcHVsYXRlIG9wdGlvbnMgKHdoaWNoIGlzIHBhc3NlZCB0byB0aGUgU0VSVkVSIGFuZCBEUkFXIGZ1bmN0aW9ucylcclxuZnVuY3Rpb24gZ2F0aGVySW5mbygpIHtcclxuICAgIHZhciBhcnIgPSAkZm9ybS5zZXJpYWxpemVBcnJheSgpO1xyXG4gICAgb3B0aW9ucyA9IF8uYXNzaWduKG9wdGlvbnMsIF8ucmVkdWNlKGFyciwgZnVuY3Rpb24gKHJlc3VsdCwgb2JqKSB7XHJcbiAgICAgICAgdmFyIG51bWJlciA9IF8ucGFyc2VJbnQob2JqLnZhbHVlKTtcclxuICAgICAgICByZXN1bHRbb2JqLm5hbWVdID0gXy5pc05hTihudW1iZXIpID8gb2JqLnZhbHVlIDogbnVtYmVyO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LCB7fSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdGFydERyYXcoKSB7XHJcblxyXG4gICAgJGJ0bkRvd25sb2FkLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgZ2V0VGV4dHMoZ2V0Q291bnQoKSwgZnVuY3Rpb24gKHRleHRzKSB7XHJcbiAgICAgICAgdGltZTEgPSBfLm5vdygpO1xyXG4gICAgICAgIHZhciBwYXNzID0gXy5hc3NpZ24oe30sIG9wdGlvbnMpO1xyXG4gICAgICAgIHBhc3MudGV4dHMgPSB0ZXh0cztcclxuICAgICAgICBjYW52YXMgPSBkcmF3KHBhc3MpXHJcbiAgICAgICAgICAgIC5kb25lKGVuYWJsZURvd25sb2FkKVxyXG4gICAgICAgICRmb3JtLmFmdGVyKGNhbnZhcyk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5cclxuXHJcbi8vIC0tLS0tIERPTSAtLS0tLS0tXHJcbmZ1bmN0aW9uIHBvcERlZmF1bHRzKCkge1xyXG5cclxuICAgICQoXCIjcXItZGltZW5zaW9uXCIpLnZhbChkZWZhdWx0cy5zaXplKVxyXG4gICAgJCgnI3FyLW1hcmdpbicpLnZhbChkZWZhdWx0cy5tYXJnaW4pXHJcbiAgICAkKCcjcXItY29scycpLnZhbChkZWZhdWx0cy5jb2xzKVxyXG4gICAgJCgnI3FyLXJvd3MnKS52YWwoZGVmYXVsdHMucm93cylcclxufVxyXG5mdW5jdGlvbiBmaWxsRXh0cmFJbmZvKCkge1xyXG4gICAgdmFyIGNhbnZhc0RpbWVuc2lvbiA9IGNhbGNDYW52YXNEaW1lbnNpb24ob3B0aW9ucyk7XHJcblxyXG4gICAgJGFtb3VudC50ZXh0KGdldENvdW50KCkpO1xyXG4gICAgJGhlaWdodC50ZXh0KGNhbnZhc0RpbWVuc2lvbi5oZWlnaHQpO1xyXG4gICAgJHdpZHRoLnRleHQoY2FudmFzRGltZW5zaW9uLndpZHRoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZW5hYmxlRG93bmxvYWQoY2FudmFzKSB7XHJcbiAgICBjYW52YXMuY2xhc3NOYW1lID0gJyc7XHJcbiAgICB2YXIgdGltZTIgPSBfLm5vdygpO1xyXG4gICAgY29uc29sZS5sb2coJ2ZpbiEnLCB0aW1lMiAtIHRpbWUxKTtcclxuICAgIGxhZGRhU3VibWl0LnN0b3AoKTtcclxuICAgICRidG5Eb3dubG9hZC5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKVxyXG59XHJcbi8vLS0tLSBGSU4gLS0tLS0tLVxyXG5cclxuXHJcblxyXG4vLyAtLS0gSEVMUEVSIEZVTkNUSU9OUyAtLS0tXHJcbmZ1bmN0aW9uIGdldERyb3Bkb3duVmFsdWVzKCRzZWxjdGlvbikge1xyXG4gICAgcmV0dXJuICRzZWxjdGlvbi5jaGlsZHJlbignb3B0aW9uJykubWFwKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gJCh0aGlzKS52YWwoKTtcclxuICAgIH0pO1xyXG59XHJcbmdldERyb3Bkb3duVmFsdWVzID0gXy5tZW1vaXplKGdldERyb3Bkb3duVmFsdWVzKTtcclxuLy8gLS0tLSBGSU4gLS0tLS0tLS1cclxuXHJcblxyXG4vLy0tLS0gSU5JVCAtLS0tLVxyXG5mdW5jdGlvbiBpbml0KCkge1xyXG4gICAgXy5kZWZhdWx0cyhvcHRpb25zLCBkZWZhdWx0cyk7XHJcbiAgICBwb3BEZWZhdWx0cygpO1xyXG4gICAgZmlsbEV4dHJhSW5mbygpO1xyXG59XHJcblxyXG5pbml0KCk7XHJcblxyXG5cclxuXHJcblxyXG4vLy0tLS0tIEVWRU5UIEJJTkQgLS0tLS1cclxuJGZvcm0ub24oJ2tleXVwIHN1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XHJcblxyXG4gICAgZ2F0aGVySW5mbygpO1xyXG4gICAgZmlsbEV4dHJhSW5mbygpO1xyXG5cclxuICAgIGlmKGUudHlwZT09XCJzdWJtaXRcIikge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZighX2NoZWNrVmFsaWQoKSkgcmV0dXJuIGFsZXJ0KCfml6DmlYjmlbDmja4nKTtcclxuXHJcbiAgICAgICAgbGFkZGFTdWJtaXQuc3RhcnQoKTtcclxuICAgICAgICBzdGFydERyYXcoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuJGJ0bkRvd25sb2FkLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgIC8qdGhpcy5jb3VudGVyID0gdGhpcy5jb3VudGVyIHx8IDA7XHJcbiAgICAgLy8gc3RhcnQgZnJvbSAxO1xyXG4gICAgIHZhciBuYW1lID0gKytkb3dubG9hZC5jb3VudGVyICsgJyjkuqflk4FpZDonICsgcHJvZHVjdElkICsgJyknOyovXHJcbiAgICBjYW52YXMudG9CbG9iKGZ1bmN0aW9uKGJsb2IpIHtcclxuICAgICAgICB2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICB2YXIgYSA9ICQoXCI8YT5cIilcclxuICAgICAgICAgICAgLmF0dHIoXCJocmVmXCIsIHVybClcclxuICAgICAgICAgICAgLmF0dHIoXCJkb3dubG9hZFwiLCBcImltZy5wbmdcIilcclxuICAgICAgICAgICAgLmFwcGVuZFRvKFwiYm9keVwiKTtcclxuXHJcbiAgICAgICAgYVswXS5jbGljaygpO1xyXG4gICAgICAgIGEucmVtb3ZlKCk7XHJcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuJCgnLnFyLWNsZWFyJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgJCgnY2FudmFzJykucmVtb3ZlKCk7XHJcbn0pO1xyXG5cclxuXHJcblxyXG4iLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KTtcclxuLy92YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG52YXIgcXJEZWZhdWx0cyA9IHtcclxuICAgIHRleHQ6ICd3L2UnLFxyXG4gICAgc2l6ZTogMTI4LFxyXG4gICAgLy8gZXJyb3IgY29ycmVjdGlvbiBsZXZlbDogYCdMJ2AsIGAnTSdgLCBgJ1EnYCBvciBgJ0gnYFxyXG4gICAgZWNMZXZlbDogJ1EnLFxyXG4gICAgLy9iYWNrZ3JvdW5kOiBcIiNmZmZcIixcclxuICAgIC8vIHJlbmRlciBtZXRob2Q6IGAnY2FudmFzJ2AsIGAnaW1hZ2UnYCBvciBgJ2RpdidgXHJcbiAgICByZW5kZXI6ICdjYW52YXMnLFxyXG5cclxuICAgIC8vIHZlcnNpb24gcmFuZ2Ugc29tZXdoZXJlIGluIDEgLi4gNDBcclxuICAgIG1pblZlcnNpb246IDEsIG1heFZlcnNpb246IDQwLFxyXG5cclxuXHJcbiAgICAvLyBvZmZzZXQgaW4gcGl4ZWwgaWYgZHJhd24gb250byBleGlzdGluZyBjYW52YXNcclxuICAgIGxlZnQ6IDAsIHRvcDogMCxcclxuXHJcbiAgICAvLyBjb2RlIGNvbG9yIG9yIGltYWdlIGVsZW1lbnRcclxuICAgIGZpbGw6ICcjMDAwJyxcclxuXHJcbiAgICAvLyBiYWNrZ3JvdW5kIGNvbG9yIG9yIGltYWdlIGVsZW1lbnQsIGBudWxsYCBmb3IgdHJhbnNwYXJlbnQgYmFja2dyb3VuZFxyXG4gICAgLy9iYWNrZ3JvdW5kOiBudWxsLFxyXG5cclxuICAgIC8vIGNvcm5lciByYWRpdXMgcmVsYXRpdmUgdG8gbW9kdWxlIHdpZHRoOiAwLjAgLi4gMC41XHJcbiAgICByYWRpdXM6IDAsXHJcbiAgICAvLyBxdWlldCB6b25lIGluIG1vZHVsZXNcclxuICAgIHF1aWV0OiAwLFxyXG4gICAgLy8gbW9kZXMgMDogbm9ybWFsIDE6IGxhYmVsIHN0cmlwIDI6IGxhYmVsIGJveCAzOiBpbWFnZSBzdHJpcCA0OiBpbWFnZSBib3hcclxuICAgIG1vZGU6IDAsXHJcblxyXG4gICAgbVNpemU6IDAuMSwgbVBvc1g6IDAuNSwgbVBvc1k6IDAuNSxcclxuXHJcbiAgICBsYWJlbDogJ25vIGxhYmVsJywgZm9udG5hbWU6ICdzYW5zJywgZm9udGNvbG9yOiAnIzAwMCcsXHJcblxyXG4gICAgaW1hZ2U6IG51bGxcclxufTtcclxuXHJcbnZhciBjYW52YXNEZWZhdWx0cyA9IHtcclxuICAgIG1hcmdpbjogMjAsXHJcbiAgICBjb2xzOiA4LFxyXG4gICAgcm93czogOFxyXG59O1xyXG5cclxudmFyXHJcbiAgICBxckNvbmZpZyxcclxuICAgIGNhbnZhc0NvbmZpZyxcclxuICAgIHRleHRzXHJcblxyXG5mdW5jdGlvbiBfaW5pdChvcHRzKSB7XHJcbiAgICBxckNvbmZpZyA9ICQuZXh0ZW5kKHFyRGVmYXVsdHMsIHtcclxuICAgICAgICBzaXplOiBvcHRzLnNpemUsXHJcbiAgICAgICAgZWNMZXZlbDogb3B0cy5lY2xcclxuICAgIH0pO1xyXG4gICAgY2FudmFzQ29uZmlnID0gJC5leHRlbmQoY2FudmFzRGVmYXVsdHMsIHtcclxuICAgICAgICBtYXJnaW46IG9wdHMubWFyZ2luLFxyXG4gICAgICAgIGNvbHM6IG9wdHMuY29scyxcclxuICAgICAgICByb3dzOiBvcHRzLnJvd3MsXHJcbiAgICAgICAgc2l6ZTogb3B0cy5zaXplXHJcbiAgICB9KTtcclxuICAgIHRleHRzID0gb3B0cy50ZXh0cztcclxuICAgIGlmICghJC5pc0FycmF5KHRleHRzKSkgdGhyb3cgJ0lOTkVSIEVSUk9SLiB3ZSBtdXN0IHBhc3Mgb3JpZ2luYWwgdGV4dHMoYXMgYXJyYXlzKSB0byBmb3JtIHFyLWNvZGVzJztcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZVFyQ29kZSh0ZXh0KSB7XHJcbiAgICBxckNvbmZpZy50ZXh0ID0gdGV4dDtcclxuICAgIC8vIHJldHVybnMgYSBjYW52YXNcclxuICAgIHJldHVybiBfYnVpbGRUbXBDb250YWluZXIoKVxyXG4gICAgICAgIC5xcmNvZGUocXJDb25maWcpXHJcbiAgICAgICAgLmZpbmQoJ2NhbnZhcycpWzBdO1xyXG59XHJcblxyXG52YXIgJHRtcDtcclxuZnVuY3Rpb24gX2J1aWxkVG1wQ29udGFpbmVyKCkge1xyXG4gICAgcmV0dXJuICR0bXAgPSAkdG1wIHx8ICQoJzxkaXYvPicpO1xyXG59XHJcbmZ1bmN0aW9uIF9yZW1vdmVUbXBDb250YWluZXIoKSB7XHJcbiAgICAkdG1wLnJlbW92ZSgpO1xyXG4gICAgJHRtcCA9IG51bGw7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBkcmF3UXJjb2Rlcyhjb250YWluZXJDdHgsIGksIGFwcGVuZGluZ0NhbnZhcykge1xyXG4gICAgdmFyIG1hcmdpbiA9IGNhbnZhc0NvbmZpZy5tYXJnaW4sXHJcbiAgICAgICAgc2l6ZSA9IHFyQ29uZmlnLnNpemUsXHJcbiAgICAgICAgY29scyA9IGNhbnZhc0NvbmZpZy5jb2xzLFxyXG4gICAgICAgIHJvd3MgPSBjYW52YXNDb25maWcucm93c1xyXG5cclxuICAgIHZhciBsZWZ0ID0gbWFyZ2luIC8gMiArIGkgJSBjb2xzICogKHNpemUgKyBtYXJnaW4pXHJcbiAgICAgICAgLCB0b3AgPSBtYXJnaW4gLyAyICsgTWF0aC5mbG9vcihpIC8gY29scykgKiAoc2l6ZSArIG1hcmdpbilcclxuXHJcbiAgICBjb250YWluZXJDdHguZHJhd0ltYWdlKGFwcGVuZGluZ0NhbnZhcywgbGVmdCwgdG9wKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGRyYXcob3B0cywgY2FsbGJhY2spIHtcclxuICAgIF9pbml0KG9wdHMpO1xyXG4gICAgdmFyIGNhbnZhcyA9IF9tYWtlQ2FudmFzKCk7XHJcbiAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICB2YXIgZGZkID0gbmV3ICQuRGVmZXJyZWQoKTtcclxuXHJcblxyXG4gICAgdmFyIGxhc3QgPSB0ZXh0cy5sZW5ndGggLSAxO1xyXG4gICAgJC5lYWNoKHRleHRzLCBmdW5jdGlvbiAoaSwgdGV4dCkge1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBkcmF3UXJjb2RlcyhjdHgsIGksIG1ha2VRckNvZGUodGV4dCkpO1xyXG4gICAgICAgICAgICBfcmVtb3ZlVG1wQ29udGFpbmVyKCk7XHJcbiAgICAgICAgICAgIGlmIChpID09PSBsYXN0KSB7XHJcbiAgICAgICAgICAgICAgICBkZmQucmVzb2x2ZShjYW52YXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvL0lmIHRhcmdldCBpcyBwcm92aWRlZCwgZGVmZXJyZWQucHJvbWlzZSgpIHdpbGwgYXR0YWNoIHRoZSBtZXRob2RzIG9udG8gaXQgYW5kIHRoZW4gcmV0dXJuIHRoaXMgb2JqZWN0XHJcbiAgICAvLyByYXRoZXIgdGhhbiBjcmVhdGUgYSBuZXcgb25lLiBUaGlzIGNhbiBiZSB1c2VmdWwgdG8gYXR0YWNoIHRoZSBQcm9taXNlIGJlaGF2aW9yIHRvIGFuIG9iamVjdCB0aGF0IGFscmVhZHkgZXhpc3RzLlxyXG4gICAgcmV0dXJuIGRmZC5wcm9taXNlKGNhbnZhcyk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBfbWFrZUNhbnZhcygpIHtcclxuICAgIHZhciBjYW52YXNEaW1lbnNpb24gPSBjYWxjQ2FudmFzRGltZW5zaW9uKGNhbnZhc0NvbmZpZyksXHJcbiAgICAgICAgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICBjYW52YXMuY2xhc3NOYW1lID0gJ2hpZGRlbic7XHJcbiAgICBjYW52YXMud2lkdGggPSBjYW52YXNEaW1lbnNpb24ud2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzRGltZW5zaW9uLmhlaWdodDtcclxuXHJcbiAgICByZXR1cm4gY2FudmFzO1xyXG59XHJcblxyXG4vLyB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgZXhwb3NlZCwgc28gaGFzIGFuIGBvcHRzYCBwYXJhbWV0ZXJcclxuZnVuY3Rpb24gY2FsY0NhbnZhc0RpbWVuc2lvbihvcHRzKSB7XHJcbiAgICB2YXIgdG1wRGltZW5zaW9uID0gb3B0cy5tYXJnaW4gKyBvcHRzLnNpemU7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHdpZHRoOiBvcHRzLmNvbHMgKiB0bXBEaW1lbnNpb24sXHJcbiAgICAgICAgaGVpZ2h0OiBvcHRzLnJvd3MgKiB0bXBEaW1lbnNpb25cclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZHJhdzogZHJhdyxcclxuICAgIGNhbGNDYW52YXNEaW1lbnNpb246IGNhbGNDYW52YXNEaW1lbnNpb25cclxufTtcclxuIiwidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuXHJcbnZhciBlbmNvZGVkU2xhc2ggPSBlbmNvZGVVUklDb21wb25lbnQoJy8nKVxyXG4gICwgaW5pdGlhbGl6ZWRcclxuXHJcbnZhciBwcm9kdWN0SWQgPSBfZXh0cmFjdFByb2R1Y3RJZCgpO1xyXG5cclxudmFyIGRlZmF1bHRzID0gcHJvZHVjdElkID8ge1xyXG4gIHByb2R1Y3RJZDogcHJvZHVjdElkLFxyXG4gIHVybDogJy9zYWxlcy8nICsgcHJvZHVjdElkICsgJy9kb3dubG9hZCdcclxufSA6IHt9O1xyXG5cclxudmFyIHVybFxyXG4gICwgY291bnRcclxuXHJcbmZ1bmN0aW9uIF9leHRyYWN0UHJvZHVjdElkKCkge1xyXG4gIHZhciBhcnIgPSBsb2NhdGlvbi5wYXRobmFtZS5tYXRjaCgvc2FsZXNcXC8oW15cXC9dKykvKTtcclxuICByZXR1cm4gYXJyICYmIGFyclsxXSA/IGFyclsxXSA6IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdChvcHRzKSB7XHJcbiAgXy5kZWZhdWx0cyhvcHRzID0gb3B0cyB8fCB7fSwgZGVmYXVsdHMpO1xyXG4gIHVybCA9IG9wdHMudXJsO1xyXG4gIHByb2R1Y3RJZCA9IG9wdHMucHJvZHVjdElkO1xyXG4gIGluaXRpYWxpemVkID0gdHJ1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VGV4dHMoY291bnQsIGNhbGxiYWNrKSB7XHJcbiAgaWYoIWluaXRpYWxpemVkKSBpbml0KCk7XHJcbiAgX2dldFJhd0NvZGVzKGNvdW50LCBmdW5jdGlvbihyYXdzKSB7XHJcbiAgICBjYWxsYmFjayhfLm1hcChyYXdzLCBmdW5jdGlvbiAocmF3KSB7XHJcbiAgICAgIHJldHVybiBfcmF3VG9VcmwocmF3KTtcclxuICAgIH0pKTtcclxuICB9KVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gX2dldFJhd0NvZGVzKGNvdW50LCBjYWxsYmFjaykge1xyXG5cclxuICAkLmFqYXgoe1xyXG4gICAgbWV0aG9kOiAncG9zdCcsXHJcbiAgICB1cmw6IHVybCxcclxuICAgIGRhdGE6IHtjb3VudDogY291bnR9XHJcbiAgfSkuZG9uZShmdW5jdGlvbiAoYXJyKSB7XHJcbiAgICAgIGNhbGxiYWNrKGFycik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gX3Jhd1RvVXJsKHJhdykge1xyXG4gIHJhdyA9IHJhdy5yZXBsYWNlKCcvJywgZW5jb2RlZFNsYXNoKTtcclxuICByZXR1cm4gbG9jYXRpb24uaG9zdCArICcvc2FsZXMvJyArIHByb2R1Y3RJZCArICcvJyArIHJhdztcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGdldFRleHRzOiBnZXRUZXh0cyxcclxuICBpbml0OiBpbml0XHJcbn07IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuO19fYnJvd3NlcmlmeV9zaGltX3JlcXVpcmVfXz1yZXF1aXJlOyhmdW5jdGlvbiBicm93c2VyaWZ5U2hpbShtb2R1bGUsIGV4cG9ydHMsIHJlcXVpcmUsIGRlZmluZSwgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18pIHtcbi8qXG4gKiBKYXZhU2NyaXB0IENhbnZhcyB0byBCbG9iIDIuMC41XG4gKiBodHRwczovL2dpdGh1Yi5jb20vYmx1ZWltcC9KYXZhU2NyaXB0LUNhbnZhcy10by1CbG9iXG4gKlxuICogQ29weXJpZ2h0IDIwMTIsIFNlYmFzdGlhbiBUc2NoYW5cbiAqIGh0dHBzOi8vYmx1ZWltcC5uZXRcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2U6XG4gKiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICpcbiAqIEJhc2VkIG9uIHN0YWNrb3ZlcmZsb3cgdXNlciBTdG9pdmUncyBjb2RlIHNuaXBwZXQ6XG4gKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcS80OTk4OTA4XG4gKi9cblxuLypqc2xpbnQgbm9tZW46IHRydWUsIHJlZ2V4cDogdHJ1ZSAqL1xuLypnbG9iYWwgd2luZG93LCBhdG9iLCBCbG9iLCBBcnJheUJ1ZmZlciwgVWludDhBcnJheSwgZGVmaW5lICovXG5cbihmdW5jdGlvbiAod2luZG93KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBDYW52YXNQcm90b3R5cGUgPSB3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQgJiZcbiAgICAgICAgICAgIHdpbmRvdy5IVE1MQ2FudmFzRWxlbWVudC5wcm90b3R5cGUsXG4gICAgICAgIGhhc0Jsb2JDb25zdHJ1Y3RvciA9IHdpbmRvdy5CbG9iICYmIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBCb29sZWFuKG5ldyBCbG9iKCkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSgpKSxcbiAgICAgICAgaGFzQXJyYXlCdWZmZXJWaWV3U3VwcG9ydCA9IGhhc0Jsb2JDb25zdHJ1Y3RvciAmJiB3aW5kb3cuVWludDhBcnJheSAmJlxuICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJsb2IoW25ldyBVaW50OEFycmF5KDEwMCldKS5zaXplID09PSAxMDA7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSgpKSxcbiAgICAgICAgQmxvYkJ1aWxkZXIgPSB3aW5kb3cuQmxvYkJ1aWxkZXIgfHwgd2luZG93LldlYktpdEJsb2JCdWlsZGVyIHx8XG4gICAgICAgICAgICB3aW5kb3cuTW96QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1TQmxvYkJ1aWxkZXIsXG4gICAgICAgIGRhdGFVUkx0b0Jsb2IgPSAoaGFzQmxvYkNvbnN0cnVjdG9yIHx8IEJsb2JCdWlsZGVyKSAmJiB3aW5kb3cuYXRvYiAmJlxuICAgICAgICAgICAgd2luZG93LkFycmF5QnVmZmVyICYmIHdpbmRvdy5VaW50OEFycmF5ICYmIGZ1bmN0aW9uIChkYXRhVVJJKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ5dGVTdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIGFycmF5QnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICBpbnRBcnJheSxcbiAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgbWltZVN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgYmI7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFVUkkuc3BsaXQoJywnKVswXS5pbmRleE9mKCdiYXNlNjQnKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgYmFzZTY0IHRvIHJhdyBiaW5hcnkgZGF0YSBoZWxkIGluIGEgc3RyaW5nOlxuICAgICAgICAgICAgICAgICAgICBieXRlU3RyaW5nID0gYXRvYihkYXRhVVJJLnNwbGl0KCcsJylbMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgYmFzZTY0L1VSTEVuY29kZWQgZGF0YSBjb21wb25lbnQgdG8gcmF3IGJpbmFyeSBkYXRhOlxuICAgICAgICAgICAgICAgICAgICBieXRlU3RyaW5nID0gZGVjb2RlVVJJQ29tcG9uZW50KGRhdGFVUkkuc3BsaXQoJywnKVsxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFdyaXRlIHRoZSBieXRlcyBvZiB0aGUgc3RyaW5nIHRvIGFuIEFycmF5QnVmZmVyOlxuICAgICAgICAgICAgICAgIGFycmF5QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGJ5dGVTdHJpbmcubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBpbnRBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYnl0ZVN0cmluZy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpbnRBcnJheVtpXSA9IGJ5dGVTdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gU2VwYXJhdGUgb3V0IHRoZSBtaW1lIGNvbXBvbmVudDpcbiAgICAgICAgICAgICAgICBtaW1lU3RyaW5nID0gZGF0YVVSSS5zcGxpdCgnLCcpWzBdLnNwbGl0KCc6JylbMV0uc3BsaXQoJzsnKVswXTtcbiAgICAgICAgICAgICAgICAvLyBXcml0ZSB0aGUgQXJyYXlCdWZmZXIgKG9yIEFycmF5QnVmZmVyVmlldykgdG8gYSBibG9iOlxuICAgICAgICAgICAgICAgIGlmIChoYXNCbG9iQ29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCbG9iKFxuICAgICAgICAgICAgICAgICAgICAgICAgW2hhc0FycmF5QnVmZmVyVmlld1N1cHBvcnQgPyBpbnRBcnJheSA6IGFycmF5QnVmZmVyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt0eXBlOiBtaW1lU3RyaW5nfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBiYiA9IG5ldyBCbG9iQnVpbGRlcigpO1xuICAgICAgICAgICAgICAgIGJiLmFwcGVuZChhcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJiLmdldEJsb2IobWltZVN0cmluZyk7XG4gICAgICAgICAgICB9O1xuICAgIGlmICh3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQgJiYgIUNhbnZhc1Byb3RvdHlwZS50b0Jsb2IpIHtcbiAgICAgICAgaWYgKENhbnZhc1Byb3RvdHlwZS5tb3pHZXRBc0ZpbGUpIHtcbiAgICAgICAgICAgIENhbnZhc1Byb3RvdHlwZS50b0Jsb2IgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHR5cGUsIHF1YWxpdHkpIHtcbiAgICAgICAgICAgICAgICBpZiAocXVhbGl0eSAmJiBDYW52YXNQcm90b3R5cGUudG9EYXRhVVJMICYmIGRhdGFVUkx0b0Jsb2IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YVVSTHRvQmxvYih0aGlzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMubW96R2V0QXNGaWxlKCdibG9iJywgdHlwZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoQ2FudmFzUHJvdG90eXBlLnRvRGF0YVVSTCAmJiBkYXRhVVJMdG9CbG9iKSB7XG4gICAgICAgICAgICBDYW52YXNQcm90b3R5cGUudG9CbG9iID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0eXBlLCBxdWFsaXR5KSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YVVSTHRvQmxvYih0aGlzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVVSTHRvQmxvYjtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmRhdGFVUkx0b0Jsb2IgPSBkYXRhVVJMdG9CbG9iO1xuICAgIH1cbn0odGhpcykpO1xuXG47IGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKHR5cGVvZiBkYXRhVVJMdG9CbG9iICE9IFwidW5kZWZpbmVkXCIgPyBkYXRhVVJMdG9CbG9iIDogd2luZG93LmRhdGFVUkx0b0Jsb2IpO1xuXG59KS5jYWxsKGdsb2JhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmdW5jdGlvbiBkZWZpbmVFeHBvcnQoZXgpIHsgbW9kdWxlLmV4cG9ydHMgPSBleDsgfSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuXG47IHFyY29kZSA9IGdsb2JhbC5xcmNvZGUgPSByZXF1aXJlKFwiZTpcXFxcY29kZXNcXFxcbm9kZWpzXFxcXGFmXFxcXGJvd2VyX2NvbXBvbmVudHNcXFxcanF1ZXJ5LnFyY29kZVxcXFxzcmNcXFxccXJjb2RlLmpzXCIpO1xuO19fYnJvd3NlcmlmeV9zaGltX3JlcXVpcmVfXz1yZXF1aXJlOyhmdW5jdGlvbiBicm93c2VyaWZ5U2hpbShtb2R1bGUsIGRlZmluZSwgcmVxdWlyZSkge1xuLyohIHt7cGtnLmRpc3BsYXlOYW1lfX0ge3twa2cudmVyc2lvbn19IC0gLy9sYXJzanVuZy5kZS9xcmNvZGUgLSBNSVQgTGljZW5zZSAqL1xuXG4vLyBVc2VzIFtRUiBDb2RlIEdlbmVyYXRvcl0oaHR0cDovL3d3dy5kLXByb2plY3QuY29tL3FyY29kZS9pbmRleC5odG1sKSAoTUlUKSwgYXBwZW5kZWQgdG8gdGhlIGVuZCBvZiB0aGlzIGZpbGUuXG4vLyBLdWRvcyB0byBbanF1ZXJ5LnFyY29kZS5qc10oaHR0cDovL2dpdGh1Yi5jb20vamVyb21lZXRpZW5uZS9qcXVlcnktcXJjb2RlKSAoTUlUKS5cblxuKGZ1bmN0aW9uICgkKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXG5cdFx0Ly8gV3JhcHBlciBmb3IgdGhlIG9yaWdpbmFsIFFSIGNvZGUgZ2VuZXJhdG9yLlxuXHR2YXIgUVJDb2RlID0gZnVuY3Rpb24gKHRleHQsIGxldmVsLCB2ZXJzaW9uLCBxdWlldCkge1xuXG5cdFx0XHQvLyBgcXJjb2RlYCBpcyB0aGUgc2luZ2xlIHB1YmxpYyBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZGVmaW5lZCBieSB0aGUgYFFSIENvZGUgR2VuZXJhdG9yYFxuXHRcdFx0Ly8gYXQgdGhlIGVuZCBvZiB0aGUgZmlsZS5cblx0XHRcdHZhciBxciA9IHFyY29kZSh2ZXJzaW9uLCBsZXZlbCk7XG5cdFx0XHRxci5hZGREYXRhKHRleHQpO1xuXHRcdFx0cXIubWFrZSgpO1xuXG5cdFx0XHRxdWlldCA9IHF1aWV0IHx8IDA7XG5cblx0XHRcdHZhciBxck1vZHVsZUNvdW50ID0gcXIuZ2V0TW9kdWxlQ291bnQoKSxcblx0XHRcdFx0cXVpZXRNb2R1bGVDb3VudCA9IHFyLmdldE1vZHVsZUNvdW50KCkgKyAyKnF1aWV0LFxuXHRcdFx0XHRpc0RhcmsgPSBmdW5jdGlvbiAocm93LCBjb2wpIHtcblxuXHRcdFx0XHRcdHJvdyAtPSBxdWlldDtcblx0XHRcdFx0XHRjb2wgLT0gcXVpZXQ7XG5cblx0XHRcdFx0XHRpZiAocm93IDwgMCB8fCByb3cgPj0gcXJNb2R1bGVDb3VudCB8fCBjb2wgPCAwIHx8IGNvbCA+PSBxck1vZHVsZUNvdW50KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHFyLmlzRGFyayhyb3csIGNvbCk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGFkZEJsYW5rID0gZnVuY3Rpb24gKGwsIHQsIHIsIGIpIHtcblxuXHRcdFx0XHRcdHZhciBwcmV2SXNEYXJrID0gdGhpcy5pc0RhcmssXG5cdFx0XHRcdFx0XHRtb2R1bGVTaXplID0gMSAvIHF1aWV0TW9kdWxlQ291bnQ7XG5cblx0XHRcdFx0XHR0aGlzLmlzRGFyayA9IGZ1bmN0aW9uIChyb3csIGNvbCkge1xuXG5cdFx0XHRcdFx0XHR2YXIgbWwgPSBjb2wgKiBtb2R1bGVTaXplLFxuXHRcdFx0XHRcdFx0XHRtdCA9IHJvdyAqIG1vZHVsZVNpemUsXG5cdFx0XHRcdFx0XHRcdG1yID0gbWwgKyBtb2R1bGVTaXplLFxuXHRcdFx0XHRcdFx0XHRtYiA9IG10ICsgbW9kdWxlU2l6ZTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHByZXZJc0Rhcmsocm93LCBjb2wpICYmIChsID4gbXIgfHwgbWwgPiByIHx8IHQgPiBtYiB8fCBtdCA+IGIpO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH07XG5cblx0XHRcdHRoaXMudGV4dCA9IHRleHQ7XG5cdFx0XHR0aGlzLmxldmVsID0gbGV2ZWw7XG5cdFx0XHR0aGlzLnZlcnNpb24gPSB2ZXJzaW9uO1xuXHRcdFx0dGhpcy5tb2R1bGVDb3VudCA9IHF1aWV0TW9kdWxlQ291bnQ7XG5cdFx0XHR0aGlzLmlzRGFyayA9IGlzRGFyaztcblx0XHRcdHRoaXMuYWRkQmxhbmsgPSBhZGRCbGFuaztcblx0XHR9LFxuXG5cdFx0Ly8gQ2hlY2sgaWYgY2FudmFzIGlzIGF2YWlsYWJsZSBpbiB0aGUgYnJvd3NlciAoYXMgTW9kZXJuaXpyIGRvZXMpXG5cdFx0Y2FudmFzQXZhaWxhYmxlID0gKGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0dmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdHJldHVybiAhIShlbGVtLmdldENvbnRleHQgJiYgZWxlbS5nZXRDb250ZXh0KCcyZCcpKTtcblx0XHR9KCkpLFxuXG5cdFx0YXJjVG9BdmFpbGFibGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwod2luZG93Lm9wZXJhKSAhPT0gJ1tvYmplY3QgT3BlcmFdJyxcblxuXHRcdC8vIFJldHVybnMgYSBtaW5pbWFsIFFSIGNvZGUgZm9yIHRoZSBnaXZlbiB0ZXh0IHN0YXJ0aW5nIHdpdGggdmVyc2lvbiBgbWluVmVyc2lvbmAuXG5cdFx0Ly8gUmV0dXJucyBgbnVsbGAgaWYgYHRleHRgIGlzIHRvbyBsb25nIHRvIGJlIGVuY29kZWQgaW4gYG1heFZlcnNpb25gLlxuXHRcdGNyZWF0ZVFSQ29kZSA9IGZ1bmN0aW9uICh0ZXh0LCBsZXZlbCwgbWluVmVyc2lvbiwgbWF4VmVyc2lvbiwgcXVpZXQpIHtcblxuXHRcdFx0bWluVmVyc2lvbiA9IE1hdGgubWF4KDEsIG1pblZlcnNpb24gfHwgMSk7XG5cdFx0XHRtYXhWZXJzaW9uID0gTWF0aC5taW4oNDAsIG1heFZlcnNpb24gfHwgNDApO1xuXHRcdFx0Zm9yICh2YXIgdmVyc2lvbiA9IG1pblZlcnNpb247IHZlcnNpb24gPD0gbWF4VmVyc2lvbjsgdmVyc2lvbiArPSAxKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBRUkNvZGUodGV4dCwgbGV2ZWwsIHZlcnNpb24sIHF1aWV0KTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7fVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRkcmF3QmFja2dyb3VuZExhYmVsID0gZnVuY3Rpb24gKHFyLCBjb250ZXh0LCBzZXR0aW5ncykge1xuXG5cdFx0XHR2YXIgc2l6ZSA9IHNldHRpbmdzLnNpemUsXG5cdFx0XHRcdGZvbnQgPSBcImJvbGQgXCIgKyAoc2V0dGluZ3MubVNpemUgKiBzaXplKSArIFwicHggXCIgKyBzZXR0aW5ncy5mb250bmFtZSxcblx0XHRcdFx0Y3R4ID0gJCgnPGNhbnZhcy8+JylbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXG5cdFx0XHRjdHguZm9udCA9IGZvbnQ7XG5cblx0XHRcdHZhciB3ID0gY3R4Lm1lYXN1cmVUZXh0KHNldHRpbmdzLmxhYmVsKS53aWR0aCxcblx0XHRcdFx0c2ggPSBzZXR0aW5ncy5tU2l6ZSxcblx0XHRcdFx0c3cgPSB3IC8gc2l6ZSxcblx0XHRcdFx0c2wgPSAoMSAtIHN3KSAqIHNldHRpbmdzLm1Qb3NYLFxuXHRcdFx0XHRzdCA9ICgxIC0gc2gpICogc2V0dGluZ3MubVBvc1ksXG5cdFx0XHRcdHNyID0gc2wgKyBzdyxcblx0XHRcdFx0c2IgPSBzdCArIHNoLFxuXHRcdFx0XHRwYWQgPSAwLjAxO1xuXG5cdFx0XHRpZiAoc2V0dGluZ3MubW9kZSA9PT0gMSkge1xuXHRcdFx0XHQvLyBTdHJpcFxuXHRcdFx0XHRxci5hZGRCbGFuaygwLCBzdCAtIHBhZCwgc2l6ZSwgc2IgKyBwYWQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gQm94XG5cdFx0XHRcdHFyLmFkZEJsYW5rKHNsIC0gcGFkLCBzdCAtIHBhZCwgc3IgKyBwYWQsIHNiICsgcGFkKTtcblx0XHRcdH1cblxuXHRcdFx0Y29udGV4dC5maWxsU3R5bGUgPSBzZXR0aW5ncy5mb250Y29sb3I7XG5cdFx0XHRjb250ZXh0LmZvbnQgPSBmb250O1xuXHRcdFx0Y29udGV4dC5maWxsVGV4dChzZXR0aW5ncy5sYWJlbCwgc2wqc2l6ZSwgc3Qqc2l6ZSArIDAuNzUgKiBzZXR0aW5ncy5tU2l6ZSAqIHNpemUpO1xuXHRcdH0sXG5cblx0XHRkcmF3QmFja2dyb3VuZEltYWdlID0gZnVuY3Rpb24gKHFyLCBjb250ZXh0LCBzZXR0aW5ncykge1xuXG5cdFx0XHR2YXIgc2l6ZSA9IHNldHRpbmdzLnNpemUsXG5cdFx0XHRcdHcgPSBzZXR0aW5ncy5pbWFnZS5uYXR1cmFsV2lkdGggfHwgMSxcblx0XHRcdFx0aCA9IHNldHRpbmdzLmltYWdlLm5hdHVyYWxIZWlnaHQgfHwgMSxcblx0XHRcdFx0c2ggPSBzZXR0aW5ncy5tU2l6ZSxcblx0XHRcdFx0c3cgPSBzaCAqIHcgLyBoLFxuXHRcdFx0XHRzbCA9ICgxIC0gc3cpICogc2V0dGluZ3MubVBvc1gsXG5cdFx0XHRcdHN0ID0gKDEgLSBzaCkgKiBzZXR0aW5ncy5tUG9zWSxcblx0XHRcdFx0c3IgPSBzbCArIHN3LFxuXHRcdFx0XHRzYiA9IHN0ICsgc2gsXG5cdFx0XHRcdHBhZCA9IDAuMDE7XG5cblx0XHRcdGlmIChzZXR0aW5ncy5tb2RlID09PSAzKSB7XG5cdFx0XHRcdC8vIFN0cmlwXG5cdFx0XHRcdHFyLmFkZEJsYW5rKDAsIHN0IC0gcGFkLCBzaXplLCBzYiArIHBhZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBCb3hcblx0XHRcdFx0cXIuYWRkQmxhbmsoc2wgLSBwYWQsIHN0IC0gcGFkLCBzciArIHBhZCwgc2IgKyBwYWQpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb250ZXh0LmRyYXdJbWFnZShzZXR0aW5ncy5pbWFnZSwgc2wqc2l6ZSwgc3Qqc2l6ZSwgc3cqc2l6ZSwgc2gqc2l6ZSk7XG5cdFx0fSxcblxuXHRcdGRyYXdCYWNrZ3JvdW5kID0gZnVuY3Rpb24gKHFyLCBjb250ZXh0LCBzZXR0aW5ncykge1xuXG5cdFx0XHRpZiAoJChzZXR0aW5ncy5iYWNrZ3JvdW5kKS5pcygnaW1nJykpIHtcblx0XHRcdFx0Y29udGV4dC5kcmF3SW1hZ2Uoc2V0dGluZ3MuYmFja2dyb3VuZCwgMCwgMCwgc2V0dGluZ3Muc2l6ZSwgc2V0dGluZ3Muc2l6ZSk7XG5cdFx0XHR9IGVsc2UgaWYgKHNldHRpbmdzLmJhY2tncm91bmQpIHtcblx0XHRcdFx0Y29udGV4dC5maWxsU3R5bGUgPSBzZXR0aW5ncy5iYWNrZ3JvdW5kO1xuXHRcdFx0XHRjb250ZXh0LmZpbGxSZWN0KHNldHRpbmdzLmxlZnQsIHNldHRpbmdzLnRvcCwgc2V0dGluZ3Muc2l6ZSwgc2V0dGluZ3Muc2l6ZSk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBtb2RlID0gc2V0dGluZ3MubW9kZTtcblx0XHRcdGlmIChtb2RlID09PSAxIHx8IG1vZGUgPT09IDIpIHtcblx0XHRcdFx0ZHJhd0JhY2tncm91bmRMYWJlbChxciwgY29udGV4dCwgc2V0dGluZ3MpO1xuXHRcdFx0fSBlbHNlIGlmIChtb2RlID09PSAzIHx8IG1vZGUgPT09IDQpIHtcblx0XHRcdFx0ZHJhd0JhY2tncm91bmRJbWFnZShxciwgY29udGV4dCwgc2V0dGluZ3MpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRkcmF3TW9kdWxlRGVmYXVsdCA9IGZ1bmN0aW9uIChxciwgY29udGV4dCwgc2V0dGluZ3MsIGxlZnQsIHRvcCwgd2lkdGgsIHJvdywgY29sKSB7XG5cblx0XHRcdGlmIChxci5pc0Rhcmsocm93LCBjb2wpKSB7XG5cdFx0XHRcdGNvbnRleHQucmVjdChsZWZ0LCB0b3AsIHdpZHRoLCB3aWR0aCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdGRyYXdNb2R1bGVSb3VuZGVkRGFyayA9IGZ1bmN0aW9uIChjdHgsIGwsIHQsIHIsIGIsIHJhZCwgbncsIG5lLCBzZSwgc3cpIHtcblxuXHRcdFx0aWYgKG53KSB7XG5cdFx0XHRcdGN0eC5tb3ZlVG8obCArIHJhZCwgdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjdHgubW92ZVRvKGwsIHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobmUpIHtcblx0XHRcdFx0Y3R4LmxpbmVUbyhyIC0gcmFkLCB0KTtcblx0XHRcdFx0Y3R4LmFyY1RvKHIsIHQsIHIsIGIsIHJhZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjdHgubGluZVRvKHIsIHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2UpIHtcblx0XHRcdFx0Y3R4LmxpbmVUbyhyLCBiIC0gcmFkKTtcblx0XHRcdFx0Y3R4LmFyY1RvKHIsIGIsIGwsIGIsIHJhZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjdHgubGluZVRvKHIsIGIpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3cpIHtcblx0XHRcdFx0Y3R4LmxpbmVUbyhsICsgcmFkLCBiKTtcblx0XHRcdFx0Y3R4LmFyY1RvKGwsIGIsIGwsIHQsIHJhZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjdHgubGluZVRvKGwsIGIpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobncpIHtcblx0XHRcdFx0Y3R4LmxpbmVUbyhsLCB0ICsgcmFkKTtcblx0XHRcdFx0Y3R4LmFyY1RvKGwsIHQsIHIsIHQsIHJhZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjdHgubGluZVRvKGwsIHQpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRkcmF3TW9kdWxlUm91bmRlbmRMaWdodCA9IGZ1bmN0aW9uIChjdHgsIGwsIHQsIHIsIGIsIHJhZCwgbncsIG5lLCBzZSwgc3cpIHtcblxuXHRcdFx0aWYgKG53KSB7XG5cdFx0XHRcdGN0eC5tb3ZlVG8obCArIHJhZCwgdCk7XG5cdFx0XHRcdGN0eC5saW5lVG8obCwgdCk7XG5cdFx0XHRcdGN0eC5saW5lVG8obCwgdCArIHJhZCk7XG5cdFx0XHRcdGN0eC5hcmNUbyhsLCB0LCBsICsgcmFkLCB0LCByYWQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobmUpIHtcblx0XHRcdFx0Y3R4Lm1vdmVUbyhyIC0gcmFkLCB0KTtcblx0XHRcdFx0Y3R4LmxpbmVUbyhyLCB0KTtcblx0XHRcdFx0Y3R4LmxpbmVUbyhyLCB0ICsgcmFkKTtcblx0XHRcdFx0Y3R4LmFyY1RvKHIsIHQsIHIgLSByYWQsIHQsIHJhZCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzZSkge1xuXHRcdFx0XHRjdHgubW92ZVRvKHIgLSByYWQsIGIpO1xuXHRcdFx0XHRjdHgubGluZVRvKHIsIGIpO1xuXHRcdFx0XHRjdHgubGluZVRvKHIsIGIgLSByYWQpO1xuXHRcdFx0XHRjdHguYXJjVG8ociwgYiwgciAtIHJhZCwgYiwgcmFkKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN3KSB7XG5cdFx0XHRcdGN0eC5tb3ZlVG8obCArIHJhZCwgYik7XG5cdFx0XHRcdGN0eC5saW5lVG8obCwgYik7XG5cdFx0XHRcdGN0eC5saW5lVG8obCwgYiAtIHJhZCk7XG5cdFx0XHRcdGN0eC5hcmNUbyhsLCBiLCBsICsgcmFkLCBiLCByYWQpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRkcmF3TW9kdWxlUm91bmRlZCA9IGZ1bmN0aW9uIChxciwgY29udGV4dCwgc2V0dGluZ3MsIGxlZnQsIHRvcCwgd2lkdGgsIHJvdywgY29sKSB7XG5cblx0XHRcdHZhciBpc0RhcmsgPSBxci5pc0RhcmssXG5cdFx0XHRcdHJpZ2h0ID0gbGVmdCArIHdpZHRoLFxuXHRcdFx0XHRib3R0b20gPSB0b3AgKyB3aWR0aCxcblx0XHRcdFx0cmFkaXVzID0gc2V0dGluZ3MucmFkaXVzICogd2lkdGgsXG5cdFx0XHRcdHJvd1QgPSByb3cgLSAxLFxuXHRcdFx0XHRyb3dCID0gcm93ICsgMSxcblx0XHRcdFx0Y29sTCA9IGNvbCAtIDEsXG5cdFx0XHRcdGNvbFIgPSBjb2wgKyAxLFxuXHRcdFx0XHRjZW50ZXIgPSBpc0Rhcmsocm93LCBjb2wpLFxuXHRcdFx0XHRub3J0aHdlc3QgPSBpc0Rhcmsocm93VCwgY29sTCksXG5cdFx0XHRcdG5vcnRoID0gaXNEYXJrKHJvd1QsIGNvbCksXG5cdFx0XHRcdG5vcnRoZWFzdCA9IGlzRGFyayhyb3dULCBjb2xSKSxcblx0XHRcdFx0ZWFzdCA9IGlzRGFyayhyb3csIGNvbFIpLFxuXHRcdFx0XHRzb3V0aGVhc3QgPSBpc0Rhcmsocm93QiwgY29sUiksXG5cdFx0XHRcdHNvdXRoID0gaXNEYXJrKHJvd0IsIGNvbCksXG5cdFx0XHRcdHNvdXRod2VzdCA9IGlzRGFyayhyb3dCLCBjb2xMKSxcblx0XHRcdFx0d2VzdCA9IGlzRGFyayhyb3csIGNvbEwpO1xuXG5cdFx0XHRpZiAoY2VudGVyKSB7XG5cdFx0XHRcdGRyYXdNb2R1bGVSb3VuZGVkRGFyayhjb250ZXh0LCBsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20sIHJhZGl1cywgIW5vcnRoICYmICF3ZXN0LCAhbm9ydGggJiYgIWVhc3QsICFzb3V0aCAmJiAhZWFzdCwgIXNvdXRoICYmICF3ZXN0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRyYXdNb2R1bGVSb3VuZGVuZExpZ2h0KGNvbnRleHQsIGxlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbSwgcmFkaXVzLCBub3J0aCAmJiB3ZXN0ICYmIG5vcnRod2VzdCwgbm9ydGggJiYgZWFzdCAmJiBub3J0aGVhc3QsIHNvdXRoICYmIGVhc3QgJiYgc291dGhlYXN0LCBzb3V0aCAmJiB3ZXN0ICYmIHNvdXRod2VzdCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdGRyYXdNb2R1bGVzID0gZnVuY3Rpb24gKHFyLCBjb250ZXh0LCBzZXR0aW5ncykge1xuXG5cdFx0XHR2YXIgbW9kdWxlQ291bnQgPSBxci5tb2R1bGVDb3VudCxcblx0XHRcdFx0bW9kdWxlU2l6ZSA9IHNldHRpbmdzLnNpemUgLyBtb2R1bGVDb3VudCxcblx0XHRcdFx0Zm4gPSBkcmF3TW9kdWxlRGVmYXVsdCxcblx0XHRcdFx0cm93LCBjb2w7XG5cblx0XHRcdGlmIChhcmNUb0F2YWlsYWJsZSAmJiBzZXR0aW5ncy5yYWRpdXMgPiAwICYmIHNldHRpbmdzLnJhZGl1cyA8PSAwLjUpIHtcblx0XHRcdFx0Zm4gPSBkcmF3TW9kdWxlUm91bmRlZDtcblx0XHRcdH1cblxuXHRcdFx0Y29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdGZvciAocm93ID0gMDsgcm93IDwgbW9kdWxlQ291bnQ7IHJvdyArPSAxKSB7XG5cdFx0XHRcdGZvciAoY29sID0gMDsgY29sIDwgbW9kdWxlQ291bnQ7IGNvbCArPSAxKSB7XG5cblx0XHRcdFx0XHR2YXIgbCA9IHNldHRpbmdzLmxlZnQgKyBjb2wgKiBtb2R1bGVTaXplLFxuXHRcdFx0XHRcdFx0dCA9IHNldHRpbmdzLnRvcCArIHJvdyAqIG1vZHVsZVNpemUsXG5cdFx0XHRcdFx0XHR3ID0gbW9kdWxlU2l6ZTtcblxuXHRcdFx0XHRcdGZuKHFyLCBjb250ZXh0LCBzZXR0aW5ncywgbCwgdCwgdywgcm93LCBjb2wpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoJChzZXR0aW5ncy5maWxsKS5pcygnaW1nJykpIHtcblx0XHRcdFx0Y29udGV4dC5zdHJva2VTdHlsZSA9ICdyZ2JhKDAsMCwwLDAuNSknO1xuXHRcdFx0XHRjb250ZXh0LmxpbmVXaWR0aCA9IDI7XG5cdFx0XHRcdGNvbnRleHQuc3Ryb2tlKCk7XG5cdFx0XHRcdHZhciBwcmV2ID0gY29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XG5cdFx0XHRcdGNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJkZXN0aW5hdGlvbi1vdXRcIjtcblx0XHRcdFx0Y29udGV4dC5maWxsKCk7XG5cdFx0XHRcdGNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gcHJldjtcblxuXHRcdFx0XHRjb250ZXh0LmNsaXAoKTtcblx0XHRcdFx0Y29udGV4dC5kcmF3SW1hZ2Uoc2V0dGluZ3MuZmlsbCwgMCwgMCwgc2V0dGluZ3Muc2l6ZSwgc2V0dGluZ3Muc2l6ZSk7XG5cdFx0XHRcdGNvbnRleHQucmVzdG9yZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29udGV4dC5maWxsU3R5bGUgPSBzZXR0aW5ncy5maWxsO1xuXHRcdFx0XHRjb250ZXh0LmZpbGwoKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Ly8gRHJhd3MgUVIgY29kZSB0byB0aGUgZ2l2ZW4gYGNhbnZhc2AgYW5kIHJldHVybnMgaXQuXG5cdFx0ZHJhd09uQ2FudmFzID0gZnVuY3Rpb24gKGNhbnZhcywgc2V0dGluZ3MpIHtcblxuXHRcdFx0dmFyIHFyID0gY3JlYXRlUVJDb2RlKHNldHRpbmdzLnRleHQsIHNldHRpbmdzLmVjTGV2ZWwsIHNldHRpbmdzLm1pblZlcnNpb24sIHNldHRpbmdzLm1heFZlcnNpb24sIHNldHRpbmdzLnF1aWV0KTtcblx0XHRcdGlmICghcXIpIHtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdHZhciAkY2FudmFzID0gJChjYW52YXMpLmRhdGEoJ3FyY29kZScsIHFyKSxcblx0XHRcdFx0Y29udGV4dCA9ICRjYW52YXNbMF0uZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdFx0ZHJhd0JhY2tncm91bmQocXIsIGNvbnRleHQsIHNldHRpbmdzKTtcblx0XHRcdGRyYXdNb2R1bGVzKHFyLCBjb250ZXh0LCBzZXR0aW5ncyk7XG5cblx0XHRcdHJldHVybiAkY2FudmFzO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIGEgYGNhbnZhc2AgZWxlbWVudCByZXByZXNlbnRpbmcgdGhlIFFSIGNvZGUgZm9yIHRoZSBnaXZlbiBzZXR0aW5ncy5cblx0XHRjcmVhdGVDYW52YXMgPSBmdW5jdGlvbiAoc2V0dGluZ3MpIHtcblxuXHRcdFx0dmFyICRjYW52YXMgPSAkKCc8Y2FudmFzLz4nKS5hdHRyKCd3aWR0aCcsIHNldHRpbmdzLnNpemUpLmF0dHIoJ2hlaWdodCcsIHNldHRpbmdzLnNpemUpO1xuXHRcdFx0cmV0dXJuIGRyYXdPbkNhbnZhcygkY2FudmFzLCBzZXR0aW5ncyk7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybnMgYW4gYGltYWdlYCBlbGVtZW50IHJlcHJlc2VudGluZyB0aGUgUVIgY29kZSBmb3IgdGhlIGdpdmVuIHNldHRpbmdzLlxuXHRcdGNyZWF0ZUltYWdlID0gZnVuY3Rpb24gKHNldHRpbmdzKSB7XG5cblx0XHRcdHJldHVybiAkKCc8aW1nLz4nKS5hdHRyKCdzcmMnLCBjcmVhdGVDYW52YXMoc2V0dGluZ3MpWzBdLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJykpO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm5zIGEgYGRpdmAgZWxlbWVudCByZXByZXNlbnRpbmcgdGhlIFFSIGNvZGUgZm9yIHRoZSBnaXZlbiBzZXR0aW5ncy5cblx0XHRjcmVhdGVEaXYgPSBmdW5jdGlvbiAoc2V0dGluZ3MpIHtcblxuXHRcdFx0dmFyIHFyID0gY3JlYXRlUVJDb2RlKHNldHRpbmdzLnRleHQsIHNldHRpbmdzLmVjTGV2ZWwsIHNldHRpbmdzLm1pblZlcnNpb24sIHNldHRpbmdzLm1heFZlcnNpb24sIHNldHRpbmdzLnF1aWV0KTtcblx0XHRcdGlmICghcXIpIHtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdFx0Ly8gc29tZSBzaG9ydGN1dHMgdG8gaW1wcm92ZSBjb21wcmVzc2lvblxuXHRcdFx0dmFyIHNldHRpbmdzX3NpemUgPSBzZXR0aW5ncy5zaXplLFxuXHRcdFx0XHRzZXR0aW5nc19iZ0NvbG9yID0gc2V0dGluZ3MuYmFja2dyb3VuZCxcblx0XHRcdFx0bWF0aF9mbG9vciA9IE1hdGguZmxvb3IsXG5cblx0XHRcdFx0bW9kdWxlQ291bnQgPSBxci5tb2R1bGVDb3VudCxcblx0XHRcdFx0bW9kdWxlU2l6ZSA9IG1hdGhfZmxvb3Ioc2V0dGluZ3Nfc2l6ZSAvIG1vZHVsZUNvdW50KSxcblx0XHRcdFx0b2Zmc2V0ID0gbWF0aF9mbG9vcigwLjUgKiAoc2V0dGluZ3Nfc2l6ZSAtIG1vZHVsZVNpemUgKiBtb2R1bGVDb3VudCkpLFxuXG5cdFx0XHRcdHJvdywgY29sLFxuXG5cdFx0XHRcdGNvbnRhaW5lckNTUyA9IHtcblx0XHRcdFx0XHRwb3NpdGlvbjogJ3JlbGF0aXZlJyxcblx0XHRcdFx0XHRsZWZ0OiAwLFxuXHRcdFx0XHRcdHRvcDogMCxcblx0XHRcdFx0XHRwYWRkaW5nOiAwLFxuXHRcdFx0XHRcdG1hcmdpbjogMCxcblx0XHRcdFx0XHR3aWR0aDogc2V0dGluZ3Nfc2l6ZSxcblx0XHRcdFx0XHRoZWlnaHQ6IHNldHRpbmdzX3NpemVcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGFya0NTUyA9IHtcblx0XHRcdFx0XHRwb3NpdGlvbjogJ2Fic29sdXRlJyxcblx0XHRcdFx0XHRwYWRkaW5nOiAwLFxuXHRcdFx0XHRcdG1hcmdpbjogMCxcblx0XHRcdFx0XHR3aWR0aDogbW9kdWxlU2l6ZSxcblx0XHRcdFx0XHRoZWlnaHQ6IG1vZHVsZVNpemUsXG5cdFx0XHRcdFx0J2JhY2tncm91bmQtY29sb3InOiBzZXR0aW5ncy5maWxsXG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0JGRpdiA9ICQoJzxkaXYvPicpLmRhdGEoJ3FyY29kZScsIHFyKS5jc3MoY29udGFpbmVyQ1NTKTtcblxuXHRcdFx0aWYgKHNldHRpbmdzX2JnQ29sb3IpIHtcblx0XHRcdFx0JGRpdi5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBzZXR0aW5nc19iZ0NvbG9yKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChyb3cgPSAwOyByb3cgPCBtb2R1bGVDb3VudDsgcm93ICs9IDEpIHtcblx0XHRcdFx0Zm9yIChjb2wgPSAwOyBjb2wgPCBtb2R1bGVDb3VudDsgY29sICs9IDEpIHtcblx0XHRcdFx0XHRpZiAocXIuaXNEYXJrKHJvdywgY29sKSkge1xuXHRcdFx0XHRcdFx0JCgnPGRpdi8+Jylcblx0XHRcdFx0XHRcdFx0LmNzcyhkYXJrQ1NTKVxuXHRcdFx0XHRcdFx0XHQuY3NzKHtcblx0XHRcdFx0XHRcdFx0XHRsZWZ0OiBvZmZzZXQgKyBjb2wgKiBtb2R1bGVTaXplLFxuXHRcdFx0XHRcdFx0XHRcdHRvcDogb2Zmc2V0ICsgcm93ICogbW9kdWxlU2l6ZVxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQuYXBwZW5kVG8oJGRpdik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAkZGl2O1xuXHRcdH0sXG5cblx0XHRjcmVhdGVIVE1MID0gZnVuY3Rpb24gKHNldHRpbmdzKSB7XG5cblx0XHRcdGlmIChjYW52YXNBdmFpbGFibGUgJiYgc2V0dGluZ3MucmVuZGVyID09PSAnY2FudmFzJykge1xuXHRcdFx0XHRyZXR1cm4gY3JlYXRlQ2FudmFzKHNldHRpbmdzKTtcblx0XHRcdH0gZWxzZSBpZiAoY2FudmFzQXZhaWxhYmxlICYmIHNldHRpbmdzLnJlbmRlciA9PT0gJ2ltYWdlJykge1xuXHRcdFx0XHRyZXR1cm4gY3JlYXRlSW1hZ2Uoc2V0dGluZ3MpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gY3JlYXRlRGl2KHNldHRpbmdzKTtcblx0XHR9LFxuXG5cdFx0Ly8gUGx1Z2luXG5cdFx0Ly8gPT09PT09XG5cblx0XHQvLyBEZWZhdWx0IHNldHRpbmdzXG5cdFx0Ly8gLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGRlZmF1bHRzID0ge1xuXG5cdFx0XHQvLyByZW5kZXIgbWV0aG9kOiBgJ2NhbnZhcydgLCBgJ2ltYWdlJ2Agb3IgYCdkaXYnYFxuXHRcdFx0cmVuZGVyOiAnY2FudmFzJyxcblxuXHRcdFx0Ly8gdmVyc2lvbiByYW5nZSBzb21ld2hlcmUgaW4gMSAuLiA0MFxuXHRcdFx0bWluVmVyc2lvbjogMSxcblx0XHRcdG1heFZlcnNpb246IDQwLFxuXG5cdFx0XHQvLyBlcnJvciBjb3JyZWN0aW9uIGxldmVsOiBgJ0wnYCwgYCdNJ2AsIGAnUSdgIG9yIGAnSCdgXG5cdFx0XHRlY0xldmVsOiAnTCcsXG5cblx0XHRcdC8vIG9mZnNldCBpbiBwaXhlbCBpZiBkcmF3biBvbnRvIGV4aXN0aW5nIGNhbnZhc1xuXHRcdFx0bGVmdDogMCxcblx0XHRcdHRvcDogMCxcblxuXHRcdFx0Ly8gc2l6ZSBpbiBwaXhlbFxuXHRcdFx0c2l6ZTogMjAwLFxuXG5cdFx0XHQvLyBjb2RlIGNvbG9yIG9yIGltYWdlIGVsZW1lbnRcblx0XHRcdGZpbGw6ICcjMDAwJyxcblxuXHRcdFx0Ly8gYmFja2dyb3VuZCBjb2xvciBvciBpbWFnZSBlbGVtZW50LCBgbnVsbGAgZm9yIHRyYW5zcGFyZW50IGJhY2tncm91bmRcblx0XHRcdGJhY2tncm91bmQ6IG51bGwsXG5cblx0XHRcdC8vIGNvbnRlbnRcblx0XHRcdHRleHQ6ICdubyB0ZXh0JyxcblxuXHRcdFx0Ly8gY29ybmVyIHJhZGl1cyByZWxhdGl2ZSB0byBtb2R1bGUgd2lkdGg6IDAuMCAuLiAwLjVcblx0XHRcdHJhZGl1czogMCxcblxuXHRcdFx0Ly8gcXVpZXQgem9uZSBpbiBtb2R1bGVzXG5cdFx0XHRxdWlldDogMCxcblxuXHRcdFx0Ly8gbW9kZXNcblx0XHRcdC8vIDA6IG5vcm1hbFxuXHRcdFx0Ly8gMTogbGFiZWwgc3RyaXBcblx0XHRcdC8vIDI6IGxhYmVsIGJveFxuXHRcdFx0Ly8gMzogaW1hZ2Ugc3RyaXBcblx0XHRcdC8vIDQ6IGltYWdlIGJveFxuXHRcdFx0bW9kZTogMCxcblxuXHRcdFx0bVNpemU6IDAuMSxcblx0XHRcdG1Qb3NYOiAwLjUsXG5cdFx0XHRtUG9zWTogMC41LFxuXG5cdFx0XHRsYWJlbDogJ25vIGxhYmVsJyxcblx0XHRcdGZvbnRuYW1lOiAnc2FucycsXG5cdFx0XHRmb250Y29sb3I6ICcjMDAwJyxcblxuXHRcdFx0aW1hZ2U6IG51bGxcblx0XHR9O1xuXG5cdC8vIFJlZ2lzdGVyIHRoZSBwbHVnaW5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQkLmZuLnFyY29kZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHRcdHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cblx0XHRyZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0aWYgKHRoaXMubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2NhbnZhcycpIHtcblx0XHRcdFx0ZHJhd09uQ2FudmFzKHRoaXMsIHNldHRpbmdzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCQodGhpcykuYXBwZW5kKGNyZWF0ZUhUTUwoc2V0dGluZ3MpKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblxuXHQvLyBqUXVlcnkucXJjb2RlIHBsdWcgaW4gY29kZSBlbmRzIGhlcmVcblxuXHQvLyBRUiBDb2RlIEdlbmVyYXRvclxuXHQvLyA9PT09PT09PT09PT09PT09PVxuXHQvLyBAaW5jbHVkZSBcInFyY29kZS5qc1wiXG5cbn0oalF1ZXJ5KSk7XG5cbn0pLmNhbGwoZ2xvYmFsLCBtb2R1bGUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG47X19icm93c2VyaWZ5X3NoaW1fcmVxdWlyZV9fPXJlcXVpcmU7KGZ1bmN0aW9uIGJyb3dzZXJpZnlTaGltKG1vZHVsZSwgZXhwb3J0cywgcmVxdWlyZSwgZGVmaW5lLCBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXykge1xuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy9cclxuLy8gUVIgQ29kZSBHZW5lcmF0b3IgZm9yIEphdmFTY3JpcHRcclxuLy9cclxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IEthenVoaWtvIEFyYXNlXHJcbi8vXHJcbi8vIFVSTDogaHR0cDovL3d3dy5kLXByb2plY3QuY29tL1xyXG4vL1xyXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2U6XHJcbi8vXHRodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxyXG4vL1xyXG4vLyBUaGUgd29yZCAnUVIgQ29kZScgaXMgcmVnaXN0ZXJlZCB0cmFkZW1hcmsgb2ZcclxuLy8gREVOU08gV0FWRSBJTkNPUlBPUkFURURcclxuLy9cdGh0dHA6Ly93d3cuZGVuc28td2F2ZS5jb20vcXJjb2RlL2ZhcXBhdGVudC1lLmh0bWxcclxuLy9cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnZhciBxcmNvZGUgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBxcmNvZGVcclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHQvKipcclxuXHQgKiBxcmNvZGVcclxuXHQgKiBAcGFyYW0gdHlwZU51bWJlciAxIHRvIDEwXHJcblx0ICogQHBhcmFtIGVycm9yQ29ycmVjdExldmVsICdMJywnTScsJ1EnLCdIJ1xyXG5cdCAqL1xyXG5cdHZhciBxcmNvZGUgPSBmdW5jdGlvbih0eXBlTnVtYmVyLCBlcnJvckNvcnJlY3RMZXZlbCkge1xyXG5cclxuXHRcdHZhciBQQUQwID0gMHhFQztcclxuXHRcdHZhciBQQUQxID0gMHgxMTtcclxuXHJcblx0XHR2YXIgX3R5cGVOdW1iZXIgPSB0eXBlTnVtYmVyO1xyXG5cdFx0dmFyIF9lcnJvckNvcnJlY3RMZXZlbCA9IFFSRXJyb3JDb3JyZWN0TGV2ZWxbZXJyb3JDb3JyZWN0TGV2ZWxdO1xyXG5cdFx0dmFyIF9tb2R1bGVzID0gbnVsbDtcclxuXHRcdHZhciBfbW9kdWxlQ291bnQgPSAwO1xyXG5cdFx0dmFyIF9kYXRhQ2FjaGUgPSBudWxsO1xyXG5cdFx0dmFyIF9kYXRhTGlzdCA9IG5ldyBBcnJheSgpO1xyXG5cclxuXHRcdHZhciBfdGhpcyA9IHt9O1xyXG5cclxuXHRcdHZhciBtYWtlSW1wbCA9IGZ1bmN0aW9uKHRlc3QsIG1hc2tQYXR0ZXJuKSB7XHJcblxyXG5cdFx0XHRfbW9kdWxlQ291bnQgPSBfdHlwZU51bWJlciAqIDQgKyAxNztcclxuXHRcdFx0X21vZHVsZXMgPSBmdW5jdGlvbihtb2R1bGVDb3VudCkge1xyXG5cdFx0XHRcdHZhciBtb2R1bGVzID0gbmV3IEFycmF5KG1vZHVsZUNvdW50KTtcclxuXHRcdFx0XHRmb3IgKHZhciByb3cgPSAwOyByb3cgPCBtb2R1bGVDb3VudDsgcm93ICs9IDEpIHtcclxuXHRcdFx0XHRcdG1vZHVsZXNbcm93XSA9IG5ldyBBcnJheShtb2R1bGVDb3VudCk7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBjb2wgPSAwOyBjb2wgPCBtb2R1bGVDb3VudDsgY29sICs9IDEpIHtcclxuXHRcdFx0XHRcdFx0bW9kdWxlc1tyb3ddW2NvbF0gPSBudWxsO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gbW9kdWxlcztcclxuXHRcdFx0fShfbW9kdWxlQ291bnQpO1xyXG5cclxuXHRcdFx0c2V0dXBQb3NpdGlvblByb2JlUGF0dGVybigwLCAwKTtcclxuXHRcdFx0c2V0dXBQb3NpdGlvblByb2JlUGF0dGVybihfbW9kdWxlQ291bnQgLSA3LCAwKTtcclxuXHRcdFx0c2V0dXBQb3NpdGlvblByb2JlUGF0dGVybigwLCBfbW9kdWxlQ291bnQgLSA3KTtcclxuXHRcdFx0c2V0dXBQb3NpdGlvbkFkanVzdFBhdHRlcm4oKTtcclxuXHRcdFx0c2V0dXBUaW1pbmdQYXR0ZXJuKCk7XHJcblx0XHRcdHNldHVwVHlwZUluZm8odGVzdCwgbWFza1BhdHRlcm4pO1xyXG5cclxuXHRcdFx0aWYgKF90eXBlTnVtYmVyID49IDcpIHtcclxuXHRcdFx0XHRzZXR1cFR5cGVOdW1iZXIodGVzdCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChfZGF0YUNhY2hlID09IG51bGwpIHtcclxuXHRcdFx0XHRfZGF0YUNhY2hlID0gY3JlYXRlRGF0YShfdHlwZU51bWJlciwgX2Vycm9yQ29ycmVjdExldmVsLCBfZGF0YUxpc3QpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRtYXBEYXRhKF9kYXRhQ2FjaGUsIG1hc2tQYXR0ZXJuKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIHNldHVwUG9zaXRpb25Qcm9iZVBhdHRlcm4gPSBmdW5jdGlvbihyb3csIGNvbCkge1xyXG5cclxuXHRcdFx0Zm9yICh2YXIgciA9IC0xOyByIDw9IDc7IHIgKz0gMSkge1xyXG5cclxuXHRcdFx0XHRpZiAocm93ICsgciA8PSAtMSB8fCBfbW9kdWxlQ291bnQgPD0gcm93ICsgcikgY29udGludWU7XHJcblxyXG5cdFx0XHRcdGZvciAodmFyIGMgPSAtMTsgYyA8PSA3OyBjICs9IDEpIHtcclxuXHJcblx0XHRcdFx0XHRpZiAoY29sICsgYyA8PSAtMSB8fCBfbW9kdWxlQ291bnQgPD0gY29sICsgYykgY29udGludWU7XHJcblxyXG5cdFx0XHRcdFx0aWYgKCAoMCA8PSByICYmIHIgPD0gNiAmJiAoYyA9PSAwIHx8IGMgPT0gNikgKVxyXG5cdFx0XHRcdFx0XHRcdHx8ICgwIDw9IGMgJiYgYyA8PSA2ICYmIChyID09IDAgfHwgciA9PSA2KSApXHJcblx0XHRcdFx0XHRcdFx0fHwgKDIgPD0gciAmJiByIDw9IDQgJiYgMiA8PSBjICYmIGMgPD0gNCkgKSB7XHJcblx0XHRcdFx0XHRcdF9tb2R1bGVzW3JvdyArIHJdW2NvbCArIGNdID0gdHJ1ZTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdF9tb2R1bGVzW3JvdyArIHJdW2NvbCArIGNdID0gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciBnZXRCZXN0TWFza1BhdHRlcm4gPSBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdHZhciBtaW5Mb3N0UG9pbnQgPSAwO1xyXG5cdFx0XHR2YXIgcGF0dGVybiA9IDA7XHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDg7IGkgKz0gMSkge1xyXG5cclxuXHRcdFx0XHRtYWtlSW1wbCh0cnVlLCBpKTtcclxuXHJcblx0XHRcdFx0dmFyIGxvc3RQb2ludCA9IFFSVXRpbC5nZXRMb3N0UG9pbnQoX3RoaXMpO1xyXG5cclxuXHRcdFx0XHRpZiAoaSA9PSAwIHx8IG1pbkxvc3RQb2ludCA+IGxvc3RQb2ludCkge1xyXG5cdFx0XHRcdFx0bWluTG9zdFBvaW50ID0gbG9zdFBvaW50O1xyXG5cdFx0XHRcdFx0cGF0dGVybiA9IGk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gcGF0dGVybjtcclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIHNldHVwVGltaW5nUGF0dGVybiA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0Zm9yICh2YXIgciA9IDg7IHIgPCBfbW9kdWxlQ291bnQgLSA4OyByICs9IDEpIHtcclxuXHRcdFx0XHRpZiAoX21vZHVsZXNbcl1bNl0gIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdF9tb2R1bGVzW3JdWzZdID0gKHIgJSAyID09IDApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3IgKHZhciBjID0gODsgYyA8IF9tb2R1bGVDb3VudCAtIDg7IGMgKz0gMSkge1xyXG5cdFx0XHRcdGlmIChfbW9kdWxlc1s2XVtjXSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0X21vZHVsZXNbNl1bY10gPSAoYyAlIDIgPT0gMCk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIHNldHVwUG9zaXRpb25BZGp1c3RQYXR0ZXJuID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHR2YXIgcG9zID0gUVJVdGlsLmdldFBhdHRlcm5Qb3NpdGlvbihfdHlwZU51bWJlcik7XHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHBvcy5sZW5ndGg7IGkgKz0gMSkge1xyXG5cclxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHBvcy5sZW5ndGg7IGogKz0gMSkge1xyXG5cclxuXHRcdFx0XHRcdHZhciByb3cgPSBwb3NbaV07XHJcblx0XHRcdFx0XHR2YXIgY29sID0gcG9zW2pdO1xyXG5cclxuXHRcdFx0XHRcdGlmIChfbW9kdWxlc1tyb3ddW2NvbF0gIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRmb3IgKHZhciByID0gLTI7IHIgPD0gMjsgciArPSAxKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBjID0gLTI7IGMgPD0gMjsgYyArPSAxKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmIChyID09IC0yIHx8IHIgPT0gMiB8fCBjID09IC0yIHx8IGMgPT0gMlxyXG5cdFx0XHRcdFx0XHRcdFx0XHR8fCAociA9PSAwICYmIGMgPT0gMCkgKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRfbW9kdWxlc1tyb3cgKyByXVtjb2wgKyBjXSA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdF9tb2R1bGVzW3JvdyArIHJdW2NvbCArIGNdID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciBzZXR1cFR5cGVOdW1iZXIgPSBmdW5jdGlvbih0ZXN0KSB7XHJcblxyXG5cdFx0XHR2YXIgYml0cyA9IFFSVXRpbC5nZXRCQ0hUeXBlTnVtYmVyKF90eXBlTnVtYmVyKTtcclxuXHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTg7IGkgKz0gMSkge1xyXG5cdFx0XHRcdHZhciBtb2QgPSAoIXRlc3QgJiYgKCAoYml0cyA+PiBpKSAmIDEpID09IDEpO1xyXG5cdFx0XHRcdF9tb2R1bGVzW01hdGguZmxvb3IoaSAvIDMpXVtpICUgMyArIF9tb2R1bGVDb3VudCAtIDggLSAzXSA9IG1vZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxODsgaSArPSAxKSB7XHJcblx0XHRcdFx0dmFyIG1vZCA9ICghdGVzdCAmJiAoIChiaXRzID4+IGkpICYgMSkgPT0gMSk7XHJcblx0XHRcdFx0X21vZHVsZXNbaSAlIDMgKyBfbW9kdWxlQ291bnQgLSA4IC0gM11bTWF0aC5mbG9vcihpIC8gMyldID0gbW9kO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciBzZXR1cFR5cGVJbmZvID0gZnVuY3Rpb24odGVzdCwgbWFza1BhdHRlcm4pIHtcclxuXHJcblx0XHRcdHZhciBkYXRhID0gKF9lcnJvckNvcnJlY3RMZXZlbCA8PCAzKSB8IG1hc2tQYXR0ZXJuO1xyXG5cdFx0XHR2YXIgYml0cyA9IFFSVXRpbC5nZXRCQ0hUeXBlSW5mbyhkYXRhKTtcclxuXHJcblx0XHRcdC8vIHZlcnRpY2FsXHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTU7IGkgKz0gMSkge1xyXG5cclxuXHRcdFx0XHR2YXIgbW9kID0gKCF0ZXN0ICYmICggKGJpdHMgPj4gaSkgJiAxKSA9PSAxKTtcclxuXHJcblx0XHRcdFx0aWYgKGkgPCA2KSB7XHJcblx0XHRcdFx0XHRfbW9kdWxlc1tpXVs4XSA9IG1vZDtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGkgPCA4KSB7XHJcblx0XHRcdFx0XHRfbW9kdWxlc1tpICsgMV1bOF0gPSBtb2Q7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdF9tb2R1bGVzW19tb2R1bGVDb3VudCAtIDE1ICsgaV1bOF0gPSBtb2Q7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBob3Jpem9udGFsXHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTU7IGkgKz0gMSkge1xyXG5cclxuXHRcdFx0XHR2YXIgbW9kID0gKCF0ZXN0ICYmICggKGJpdHMgPj4gaSkgJiAxKSA9PSAxKTtcclxuXHJcblx0XHRcdFx0aWYgKGkgPCA4KSB7XHJcblx0XHRcdFx0XHRfbW9kdWxlc1s4XVtfbW9kdWxlQ291bnQgLSBpIC0gMV0gPSBtb2Q7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChpIDwgOSkge1xyXG5cdFx0XHRcdFx0X21vZHVsZXNbOF1bMTUgLSBpIC0gMSArIDFdID0gbW9kO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRfbW9kdWxlc1s4XVsxNSAtIGkgLSAxXSA9IG1vZDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGZpeGVkIG1vZHVsZVxyXG5cdFx0XHRfbW9kdWxlc1tfbW9kdWxlQ291bnQgLSA4XVs4XSA9ICghdGVzdCk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciBtYXBEYXRhID0gZnVuY3Rpb24oZGF0YSwgbWFza1BhdHRlcm4pIHtcclxuXHJcblx0XHRcdHZhciBpbmMgPSAtMTtcclxuXHRcdFx0dmFyIHJvdyA9IF9tb2R1bGVDb3VudCAtIDE7XHJcblx0XHRcdHZhciBiaXRJbmRleCA9IDc7XHJcblx0XHRcdHZhciBieXRlSW5kZXggPSAwO1xyXG5cdFx0XHR2YXIgbWFza0Z1bmMgPSBRUlV0aWwuZ2V0TWFza0Z1bmN0aW9uKG1hc2tQYXR0ZXJuKTtcclxuXHJcblx0XHRcdGZvciAodmFyIGNvbCA9IF9tb2R1bGVDb3VudCAtIDE7IGNvbCA+IDA7IGNvbCAtPSAyKSB7XHJcblxyXG5cdFx0XHRcdGlmIChjb2wgPT0gNikgY29sIC09IDE7XHJcblxyXG5cdFx0XHRcdHdoaWxlICh0cnVlKSB7XHJcblxyXG5cdFx0XHRcdFx0Zm9yICh2YXIgYyA9IDA7IGMgPCAyOyBjICs9IDEpIHtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChfbW9kdWxlc1tyb3ddW2NvbCAtIGNdID09IG51bGwpIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIGRhcmsgPSBmYWxzZTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKGJ5dGVJbmRleCA8IGRhdGEubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRkYXJrID0gKCAoIChkYXRhW2J5dGVJbmRleF0gPj4+IGJpdEluZGV4KSAmIDEpID09IDEpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIG1hc2sgPSBtYXNrRnVuYyhyb3csIGNvbCAtIGMpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiAobWFzaykge1xyXG5cdFx0XHRcdFx0XHRcdFx0ZGFyayA9ICFkYXJrO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0X21vZHVsZXNbcm93XVtjb2wgLSBjXSA9IGRhcms7XHJcblx0XHRcdFx0XHRcdFx0Yml0SW5kZXggLT0gMTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKGJpdEluZGV4ID09IC0xKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRieXRlSW5kZXggKz0gMTtcclxuXHRcdFx0XHRcdFx0XHRcdGJpdEluZGV4ID0gNztcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRyb3cgKz0gaW5jO1xyXG5cclxuXHRcdFx0XHRcdGlmIChyb3cgPCAwIHx8IF9tb2R1bGVDb3VudCA8PSByb3cpIHtcclxuXHRcdFx0XHRcdFx0cm93IC09IGluYztcclxuXHRcdFx0XHRcdFx0aW5jID0gLWluYztcclxuXHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciBjcmVhdGVCeXRlcyA9IGZ1bmN0aW9uKGJ1ZmZlciwgcnNCbG9ja3MpIHtcclxuXHJcblx0XHRcdHZhciBvZmZzZXQgPSAwO1xyXG5cclxuXHRcdFx0dmFyIG1heERjQ291bnQgPSAwO1xyXG5cdFx0XHR2YXIgbWF4RWNDb3VudCA9IDA7XHJcblxyXG5cdFx0XHR2YXIgZGNkYXRhID0gbmV3IEFycmF5KHJzQmxvY2tzLmxlbmd0aCk7XHJcblx0XHRcdHZhciBlY2RhdGEgPSBuZXcgQXJyYXkocnNCbG9ja3MubGVuZ3RoKTtcclxuXHJcblx0XHRcdGZvciAodmFyIHIgPSAwOyByIDwgcnNCbG9ja3MubGVuZ3RoOyByICs9IDEpIHtcclxuXHJcblx0XHRcdFx0dmFyIGRjQ291bnQgPSByc0Jsb2Nrc1tyXS5kYXRhQ291bnQ7XHJcblx0XHRcdFx0dmFyIGVjQ291bnQgPSByc0Jsb2Nrc1tyXS50b3RhbENvdW50IC0gZGNDb3VudDtcclxuXHJcblx0XHRcdFx0bWF4RGNDb3VudCA9IE1hdGgubWF4KG1heERjQ291bnQsIGRjQ291bnQpO1xyXG5cdFx0XHRcdG1heEVjQ291bnQgPSBNYXRoLm1heChtYXhFY0NvdW50LCBlY0NvdW50KTtcclxuXHJcblx0XHRcdFx0ZGNkYXRhW3JdID0gbmV3IEFycmF5KGRjQ291bnQpO1xyXG5cclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGRjZGF0YVtyXS5sZW5ndGg7IGkgKz0gMSkge1xyXG5cdFx0XHRcdFx0ZGNkYXRhW3JdW2ldID0gMHhmZiAmIGJ1ZmZlci5nZXRCdWZmZXIoKVtpICsgb2Zmc2V0XTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0b2Zmc2V0ICs9IGRjQ291bnQ7XHJcblxyXG5cdFx0XHRcdHZhciByc1BvbHkgPSBRUlV0aWwuZ2V0RXJyb3JDb3JyZWN0UG9seW5vbWlhbChlY0NvdW50KTtcclxuXHRcdFx0XHR2YXIgcmF3UG9seSA9IHFyUG9seW5vbWlhbChkY2RhdGFbcl0sIHJzUG9seS5nZXRMZW5ndGgoKSAtIDEpO1xyXG5cclxuXHRcdFx0XHR2YXIgbW9kUG9seSA9IHJhd1BvbHkubW9kKHJzUG9seSk7XHJcblx0XHRcdFx0ZWNkYXRhW3JdID0gbmV3IEFycmF5KHJzUG9seS5nZXRMZW5ndGgoKSAtIDEpO1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZWNkYXRhW3JdLmxlbmd0aDsgaSArPSAxKSB7XHJcblx0XHRcdFx0XHR2YXIgbW9kSW5kZXggPSBpICsgbW9kUG9seS5nZXRMZW5ndGgoKSAtIGVjZGF0YVtyXS5sZW5ndGg7XHJcblx0XHRcdFx0XHRlY2RhdGFbcl1baV0gPSAobW9kSW5kZXggPj0gMCk/IG1vZFBvbHkuZ2V0KG1vZEluZGV4KSA6IDA7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgdG90YWxDb2RlQ291bnQgPSAwO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJzQmxvY2tzLmxlbmd0aDsgaSArPSAxKSB7XHJcblx0XHRcdFx0dG90YWxDb2RlQ291bnQgKz0gcnNCbG9ja3NbaV0udG90YWxDb3VudDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGRhdGEgPSBuZXcgQXJyYXkodG90YWxDb2RlQ291bnQpO1xyXG5cdFx0XHR2YXIgaW5kZXggPSAwO1xyXG5cclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBtYXhEY0NvdW50OyBpICs9IDEpIHtcclxuXHRcdFx0XHRmb3IgKHZhciByID0gMDsgciA8IHJzQmxvY2tzLmxlbmd0aDsgciArPSAxKSB7XHJcblx0XHRcdFx0XHRpZiAoaSA8IGRjZGF0YVtyXS5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdFx0ZGF0YVtpbmRleF0gPSBkY2RhdGFbcl1baV07XHJcblx0XHRcdFx0XHRcdGluZGV4ICs9IDE7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG1heEVjQ291bnQ7IGkgKz0gMSkge1xyXG5cdFx0XHRcdGZvciAodmFyIHIgPSAwOyByIDwgcnNCbG9ja3MubGVuZ3RoOyByICs9IDEpIHtcclxuXHRcdFx0XHRcdGlmIChpIDwgZWNkYXRhW3JdLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0XHRkYXRhW2luZGV4XSA9IGVjZGF0YVtyXVtpXTtcclxuXHRcdFx0XHRcdFx0aW5kZXggKz0gMTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBkYXRhO1xyXG5cdFx0fTtcclxuXHJcblx0XHR2YXIgY3JlYXRlRGF0YSA9IGZ1bmN0aW9uKHR5cGVOdW1iZXIsIGVycm9yQ29ycmVjdExldmVsLCBkYXRhTGlzdCkge1xyXG5cclxuXHRcdFx0dmFyIHJzQmxvY2tzID0gUVJSU0Jsb2NrLmdldFJTQmxvY2tzKHR5cGVOdW1iZXIsIGVycm9yQ29ycmVjdExldmVsKTtcclxuXHJcblx0XHRcdHZhciBidWZmZXIgPSBxckJpdEJ1ZmZlcigpO1xyXG5cclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xyXG5cdFx0XHRcdHZhciBkYXRhID0gZGF0YUxpc3RbaV07XHJcblx0XHRcdFx0YnVmZmVyLnB1dChkYXRhLmdldE1vZGUoKSwgNCk7XHJcblx0XHRcdFx0YnVmZmVyLnB1dChkYXRhLmdldExlbmd0aCgpLCBRUlV0aWwuZ2V0TGVuZ3RoSW5CaXRzKGRhdGEuZ2V0TW9kZSgpLCB0eXBlTnVtYmVyKSApO1xyXG5cdFx0XHRcdGRhdGEud3JpdGUoYnVmZmVyKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gY2FsYyBudW0gbWF4IGRhdGEuXHJcblx0XHRcdHZhciB0b3RhbERhdGFDb3VudCA9IDA7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcnNCbG9ja3MubGVuZ3RoOyBpICs9IDEpIHtcclxuXHRcdFx0XHR0b3RhbERhdGFDb3VudCArPSByc0Jsb2Nrc1tpXS5kYXRhQ291bnQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChidWZmZXIuZ2V0TGVuZ3RoSW5CaXRzKCkgPiB0b3RhbERhdGFDb3VudCAqIDgpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ2NvZGUgbGVuZ3RoIG92ZXJmbG93LiAoJ1xyXG5cdFx0XHRcdFx0KyBidWZmZXIuZ2V0TGVuZ3RoSW5CaXRzKClcclxuXHRcdFx0XHRcdCsgJz4nXHJcblx0XHRcdFx0XHQrIHRvdGFsRGF0YUNvdW50ICogOFxyXG5cdFx0XHRcdFx0KyAnKScpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBlbmQgY29kZVxyXG5cdFx0XHRpZiAoYnVmZmVyLmdldExlbmd0aEluQml0cygpICsgNCA8PSB0b3RhbERhdGFDb3VudCAqIDgpIHtcclxuXHRcdFx0XHRidWZmZXIucHV0KDAsIDQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBwYWRkaW5nXHJcblx0XHRcdHdoaWxlIChidWZmZXIuZ2V0TGVuZ3RoSW5CaXRzKCkgJSA4ICE9IDApIHtcclxuXHRcdFx0XHRidWZmZXIucHV0Qml0KGZhbHNlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gcGFkZGluZ1xyXG5cdFx0XHR3aGlsZSAodHJ1ZSkge1xyXG5cclxuXHRcdFx0XHRpZiAoYnVmZmVyLmdldExlbmd0aEluQml0cygpID49IHRvdGFsRGF0YUNvdW50ICogOCkge1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGJ1ZmZlci5wdXQoUEFEMCwgOCk7XHJcblxyXG5cdFx0XHRcdGlmIChidWZmZXIuZ2V0TGVuZ3RoSW5CaXRzKCkgPj0gdG90YWxEYXRhQ291bnQgKiA4KSB7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0YnVmZmVyLnB1dChQQUQxLCA4KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIGNyZWF0ZUJ5dGVzKGJ1ZmZlciwgcnNCbG9ja3MpO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5hZGREYXRhID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHR2YXIgbmV3RGF0YSA9IHFyOEJpdEJ5dGUoZGF0YSk7XHJcblx0XHRcdF9kYXRhTGlzdC5wdXNoKG5ld0RhdGEpO1xyXG5cdFx0XHRfZGF0YUNhY2hlID0gbnVsbDtcclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMuaXNEYXJrID0gZnVuY3Rpb24ocm93LCBjb2wpIHtcclxuXHRcdFx0aWYgKHJvdyA8IDAgfHwgX21vZHVsZUNvdW50IDw9IHJvdyB8fCBjb2wgPCAwIHx8IF9tb2R1bGVDb3VudCA8PSBjb2wpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3Iocm93ICsgJywnICsgY29sKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gX21vZHVsZXNbcm93XVtjb2xdO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5nZXRNb2R1bGVDb3VudCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gX21vZHVsZUNvdW50O1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5tYWtlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdG1ha2VJbXBsKGZhbHNlLCBnZXRCZXN0TWFza1BhdHRlcm4oKSApO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5jcmVhdGVUYWJsZVRhZyA9IGZ1bmN0aW9uKGNlbGxTaXplLCBtYXJnaW4pIHtcclxuXHJcblx0XHRcdGNlbGxTaXplID0gY2VsbFNpemUgfHwgMjtcclxuXHRcdFx0bWFyZ2luID0gKHR5cGVvZiBtYXJnaW4gPT0gJ3VuZGVmaW5lZCcpPyBjZWxsU2l6ZSAqIDQgOiBtYXJnaW47XHJcblxyXG5cdFx0XHR2YXIgcXJIdG1sID0gJyc7XHJcblxyXG5cdFx0XHRxckh0bWwgKz0gJzx0YWJsZSBzdHlsZT1cIic7XHJcblx0XHRcdHFySHRtbCArPSAnIGJvcmRlci13aWR0aDogMHB4OyBib3JkZXItc3R5bGU6IG5vbmU7JztcclxuXHRcdFx0cXJIdG1sICs9ICcgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsnO1xyXG5cdFx0XHRxckh0bWwgKz0gJyBwYWRkaW5nOiAwcHg7IG1hcmdpbjogJyArIG1hcmdpbiArICdweDsnO1xyXG5cdFx0XHRxckh0bWwgKz0gJ1wiPic7XHJcblx0XHRcdHFySHRtbCArPSAnPHRib2R5Pic7XHJcblxyXG5cdFx0XHRmb3IgKHZhciByID0gMDsgciA8IF90aGlzLmdldE1vZHVsZUNvdW50KCk7IHIgKz0gMSkge1xyXG5cclxuXHRcdFx0XHRxckh0bWwgKz0gJzx0cj4nO1xyXG5cclxuXHRcdFx0XHRmb3IgKHZhciBjID0gMDsgYyA8IF90aGlzLmdldE1vZHVsZUNvdW50KCk7IGMgKz0gMSkge1xyXG5cdFx0XHRcdFx0cXJIdG1sICs9ICc8dGQgc3R5bGU9XCInO1xyXG5cdFx0XHRcdFx0cXJIdG1sICs9ICcgYm9yZGVyLXdpZHRoOiAwcHg7IGJvcmRlci1zdHlsZTogbm9uZTsnO1xyXG5cdFx0XHRcdFx0cXJIdG1sICs9ICcgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsnO1xyXG5cdFx0XHRcdFx0cXJIdG1sICs9ICcgcGFkZGluZzogMHB4OyBtYXJnaW46IDBweDsnO1xyXG5cdFx0XHRcdFx0cXJIdG1sICs9ICcgd2lkdGg6ICcgKyBjZWxsU2l6ZSArICdweDsnO1xyXG5cdFx0XHRcdFx0cXJIdG1sICs9ICcgaGVpZ2h0OiAnICsgY2VsbFNpemUgKyAncHg7JztcclxuXHRcdFx0XHRcdHFySHRtbCArPSAnIGJhY2tncm91bmQtY29sb3I6ICc7XHJcblx0XHRcdFx0XHRxckh0bWwgKz0gX3RoaXMuaXNEYXJrKHIsIGMpPyAnIzAwMDAwMCcgOiAnI2ZmZmZmZic7XHJcblx0XHRcdFx0XHRxckh0bWwgKz0gJzsnO1xyXG5cdFx0XHRcdFx0cXJIdG1sICs9ICdcIi8+JztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHFySHRtbCArPSAnPC90cj4nO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRxckh0bWwgKz0gJzwvdGJvZHk+JztcclxuXHRcdFx0cXJIdG1sICs9ICc8L3RhYmxlPic7XHJcblxyXG5cdFx0XHRyZXR1cm4gcXJIdG1sO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5jcmVhdGVJbWdUYWcgPSBmdW5jdGlvbihjZWxsU2l6ZSwgbWFyZ2luKSB7XHJcblxyXG5cdFx0XHRjZWxsU2l6ZSA9IGNlbGxTaXplIHx8IDI7XHJcblx0XHRcdG1hcmdpbiA9ICh0eXBlb2YgbWFyZ2luID09ICd1bmRlZmluZWQnKT8gY2VsbFNpemUgKiA0IDogbWFyZ2luO1xyXG5cclxuXHRcdFx0dmFyIHNpemUgPSBfdGhpcy5nZXRNb2R1bGVDb3VudCgpICogY2VsbFNpemUgKyBtYXJnaW4gKiAyO1xyXG5cdFx0XHR2YXIgbWluID0gbWFyZ2luO1xyXG5cdFx0XHR2YXIgbWF4ID0gc2l6ZSAtIG1hcmdpbjtcclxuXHJcblx0XHRcdHJldHVybiBjcmVhdGVJbWdUYWcoc2l6ZSwgc2l6ZSwgZnVuY3Rpb24oeCwgeSkge1xyXG5cdFx0XHRcdGlmIChtaW4gPD0geCAmJiB4IDwgbWF4ICYmIG1pbiA8PSB5ICYmIHkgPCBtYXgpIHtcclxuXHRcdFx0XHRcdHZhciBjID0gTWF0aC5mbG9vciggKHggLSBtaW4pIC8gY2VsbFNpemUpO1xyXG5cdFx0XHRcdFx0dmFyIHIgPSBNYXRoLmZsb29yKCAoeSAtIG1pbikgLyBjZWxsU2l6ZSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gX3RoaXMuaXNEYXJrKHIsIGMpPyAwIDogMTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIDE7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9ICk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBfdGhpcztcclxuXHR9O1xyXG5cclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdC8vIHFyY29kZS5zdHJpbmdUb0J5dGVzXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0cXJjb2RlLnN0cmluZ1RvQnl0ZXMgPSBmdW5jdGlvbihzKSB7XHJcblx0XHR2YXIgYnl0ZXMgPSBuZXcgQXJyYXkoKTtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkgKz0gMSkge1xyXG5cdFx0XHR2YXIgYyA9IHMuY2hhckNvZGVBdChpKTtcclxuXHRcdFx0Ynl0ZXMucHVzaChjICYgMHhmZik7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gYnl0ZXM7XHJcblx0fTtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBxcmNvZGUuY3JlYXRlU3RyaW5nVG9CeXRlc1xyXG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdC8qKlxyXG5cdCAqIEBwYXJhbSB1bmljb2RlRGF0YSBiYXNlNjQgc3RyaW5nIG9mIGJ5dGUgYXJyYXkuXHJcblx0ICogWzE2Yml0IFVuaWNvZGVdLFsxNmJpdCBCeXRlc10sIC4uLlxyXG5cdCAqIEBwYXJhbSBudW1DaGFyc1xyXG5cdCAqL1xyXG5cdHFyY29kZS5jcmVhdGVTdHJpbmdUb0J5dGVzID0gZnVuY3Rpb24odW5pY29kZURhdGEsIG51bUNoYXJzKSB7XHJcblxyXG5cdFx0Ly8gY3JlYXRlIGNvbnZlcnNpb24gbWFwLlxyXG5cclxuXHRcdHZhciB1bmljb2RlTWFwID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHR2YXIgYmluID0gYmFzZTY0RGVjb2RlSW5wdXRTdHJlYW0odW5pY29kZURhdGEpO1xyXG5cdFx0XHR2YXIgcmVhZCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHZhciBiID0gYmluLnJlYWQoKTtcclxuXHRcdFx0XHRpZiAoYiA9PSAtMSkgdGhyb3cgbmV3IEVycm9yKCk7XHJcblx0XHRcdFx0cmV0dXJuIGI7XHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0XHR2YXIgdW5pY29kZU1hcCA9IHt9O1xyXG5cdFx0XHR3aGlsZSAodHJ1ZSkge1xyXG5cdFx0XHRcdHZhciBiMCA9IGJpbi5yZWFkKCk7XHJcblx0XHRcdFx0aWYgKGIwID09IC0xKSBicmVhaztcclxuXHRcdFx0XHR2YXIgYjEgPSByZWFkKCk7XHJcblx0XHRcdFx0dmFyIGIyID0gcmVhZCgpO1xyXG5cdFx0XHRcdHZhciBiMyA9IHJlYWQoKTtcclxuXHRcdFx0XHR2YXIgayA9IFN0cmluZy5mcm9tQ2hhckNvZGUoIChiMCA8PCA4KSB8IGIxKTtcclxuXHRcdFx0XHR2YXIgdiA9IChiMiA8PCA4KSB8IGIzO1xyXG5cdFx0XHRcdHVuaWNvZGVNYXBba10gPSB2O1xyXG5cdFx0XHRcdGNvdW50ICs9IDE7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGNvdW50ICE9IG51bUNoYXJzKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGNvdW50ICsgJyAhPSAnICsgbnVtQ2hhcnMpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdW5pY29kZU1hcDtcclxuXHRcdH0oKTtcclxuXHJcblx0XHR2YXIgdW5rbm93bkNoYXIgPSAnPycuY2hhckNvZGVBdCgwKTtcclxuXHJcblx0XHRyZXR1cm4gZnVuY3Rpb24ocykge1xyXG5cdFx0XHR2YXIgYnl0ZXMgPSBuZXcgQXJyYXkoKTtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSArPSAxKSB7XHJcblx0XHRcdFx0dmFyIGMgPSBzLmNoYXJDb2RlQXQoaSk7XHJcblx0XHRcdFx0aWYgKGMgPCAxMjgpIHtcclxuXHRcdFx0XHRcdGJ5dGVzLnB1c2goYyk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHZhciBiID0gdW5pY29kZU1hcFtzLmNoYXJBdChpKV07XHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIGIgPT0gJ251bWJlcicpIHtcclxuXHRcdFx0XHRcdFx0aWYgKCAoYiAmIDB4ZmYpID09IGIpIHtcclxuXHRcdFx0XHRcdFx0XHQvLyAxYnl0ZVxyXG5cdFx0XHRcdFx0XHRcdGJ5dGVzLnB1c2goYik7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0Ly8gMmJ5dGVzXHJcblx0XHRcdFx0XHRcdFx0Ynl0ZXMucHVzaChiID4+PiA4KTtcclxuXHRcdFx0XHRcdFx0XHRieXRlcy5wdXNoKGIgJiAweGZmKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0Ynl0ZXMucHVzaCh1bmtub3duQ2hhcik7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBieXRlcztcclxuXHRcdH07XHJcblx0fTtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBRUk1vZGVcclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR2YXIgUVJNb2RlID0ge1xyXG5cdFx0TU9ERV9OVU1CRVIgOlx0XHQxIDw8IDAsXHJcblx0XHRNT0RFX0FMUEhBX05VTSA6IFx0MSA8PCAxLFxyXG5cdFx0TU9ERV84QklUX0JZVEUgOiBcdDEgPDwgMixcclxuXHRcdE1PREVfS0FOSkkgOlx0XHQxIDw8IDNcclxuXHR9O1xyXG5cclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdC8vIFFSRXJyb3JDb3JyZWN0TGV2ZWxcclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR2YXIgUVJFcnJvckNvcnJlY3RMZXZlbCA9IHtcclxuXHRcdEwgOiAxLFxyXG5cdFx0TSA6IDAsXHJcblx0XHRRIDogMyxcclxuXHRcdEggOiAyXHJcblx0fTtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBRUk1hc2tQYXR0ZXJuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0dmFyIFFSTWFza1BhdHRlcm4gPSB7XHJcblx0XHRQQVRURVJOMDAwIDogMCxcclxuXHRcdFBBVFRFUk4wMDEgOiAxLFxyXG5cdFx0UEFUVEVSTjAxMCA6IDIsXHJcblx0XHRQQVRURVJOMDExIDogMyxcclxuXHRcdFBBVFRFUk4xMDAgOiA0LFxyXG5cdFx0UEFUVEVSTjEwMSA6IDUsXHJcblx0XHRQQVRURVJOMTEwIDogNixcclxuXHRcdFBBVFRFUk4xMTEgOiA3XHJcblx0fTtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBRUlV0aWxcclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR2YXIgUVJVdGlsID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0dmFyIFBBVFRFUk5fUE9TSVRJT05fVEFCTEUgPSBbXHJcblx0XHRcdFtdLFxyXG5cdFx0XHRbNiwgMThdLFxyXG5cdFx0XHRbNiwgMjJdLFxyXG5cdFx0XHRbNiwgMjZdLFxyXG5cdFx0XHRbNiwgMzBdLFxyXG5cdFx0XHRbNiwgMzRdLFxyXG5cdFx0XHRbNiwgMjIsIDM4XSxcclxuXHRcdFx0WzYsIDI0LCA0Ml0sXHJcblx0XHRcdFs2LCAyNiwgNDZdLFxyXG5cdFx0XHRbNiwgMjgsIDUwXSxcclxuXHRcdFx0WzYsIDMwLCA1NF0sXHJcblx0XHRcdFs2LCAzMiwgNThdLFxyXG5cdFx0XHRbNiwgMzQsIDYyXSxcclxuXHRcdFx0WzYsIDI2LCA0NiwgNjZdLFxyXG5cdFx0XHRbNiwgMjYsIDQ4LCA3MF0sXHJcblx0XHRcdFs2LCAyNiwgNTAsIDc0XSxcclxuXHRcdFx0WzYsIDMwLCA1NCwgNzhdLFxyXG5cdFx0XHRbNiwgMzAsIDU2LCA4Ml0sXHJcblx0XHRcdFs2LCAzMCwgNTgsIDg2XSxcclxuXHRcdFx0WzYsIDM0LCA2MiwgOTBdLFxyXG5cdFx0XHRbNiwgMjgsIDUwLCA3MiwgOTRdLFxyXG5cdFx0XHRbNiwgMjYsIDUwLCA3NCwgOThdLFxyXG5cdFx0XHRbNiwgMzAsIDU0LCA3OCwgMTAyXSxcclxuXHRcdFx0WzYsIDI4LCA1NCwgODAsIDEwNl0sXHJcblx0XHRcdFs2LCAzMiwgNTgsIDg0LCAxMTBdLFxyXG5cdFx0XHRbNiwgMzAsIDU4LCA4NiwgMTE0XSxcclxuXHRcdFx0WzYsIDM0LCA2MiwgOTAsIDExOF0sXHJcblx0XHRcdFs2LCAyNiwgNTAsIDc0LCA5OCwgMTIyXSxcclxuXHRcdFx0WzYsIDMwLCA1NCwgNzgsIDEwMiwgMTI2XSxcclxuXHRcdFx0WzYsIDI2LCA1MiwgNzgsIDEwNCwgMTMwXSxcclxuXHRcdFx0WzYsIDMwLCA1NiwgODIsIDEwOCwgMTM0XSxcclxuXHRcdFx0WzYsIDM0LCA2MCwgODYsIDExMiwgMTM4XSxcclxuXHRcdFx0WzYsIDMwLCA1OCwgODYsIDExNCwgMTQyXSxcclxuXHRcdFx0WzYsIDM0LCA2MiwgOTAsIDExOCwgMTQ2XSxcclxuXHRcdFx0WzYsIDMwLCA1NCwgNzgsIDEwMiwgMTI2LCAxNTBdLFxyXG5cdFx0XHRbNiwgMjQsIDUwLCA3NiwgMTAyLCAxMjgsIDE1NF0sXHJcblx0XHRcdFs2LCAyOCwgNTQsIDgwLCAxMDYsIDEzMiwgMTU4XSxcclxuXHRcdFx0WzYsIDMyLCA1OCwgODQsIDExMCwgMTM2LCAxNjJdLFxyXG5cdFx0XHRbNiwgMjYsIDU0LCA4MiwgMTEwLCAxMzgsIDE2Nl0sXHJcblx0XHRcdFs2LCAzMCwgNTgsIDg2LCAxMTQsIDE0MiwgMTcwXVxyXG5cdFx0XTtcclxuXHRcdHZhciBHMTUgPSAoMSA8PCAxMCkgfCAoMSA8PCA4KSB8ICgxIDw8IDUpIHwgKDEgPDwgNCkgfCAoMSA8PCAyKSB8ICgxIDw8IDEpIHwgKDEgPDwgMCk7XHJcblx0XHR2YXIgRzE4ID0gKDEgPDwgMTIpIHwgKDEgPDwgMTEpIHwgKDEgPDwgMTApIHwgKDEgPDwgOSkgfCAoMSA8PCA4KSB8ICgxIDw8IDUpIHwgKDEgPDwgMikgfCAoMSA8PCAwKTtcclxuXHRcdHZhciBHMTVfTUFTSyA9ICgxIDw8IDE0KSB8ICgxIDw8IDEyKSB8ICgxIDw8IDEwKSB8ICgxIDw8IDQpIHwgKDEgPDwgMSk7XHJcblxyXG5cdFx0dmFyIF90aGlzID0ge307XHJcblxyXG5cdFx0dmFyIGdldEJDSERpZ2l0ID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHR2YXIgZGlnaXQgPSAwO1xyXG5cdFx0XHR3aGlsZSAoZGF0YSAhPSAwKSB7XHJcblx0XHRcdFx0ZGlnaXQgKz0gMTtcclxuXHRcdFx0XHRkYXRhID4+Pj0gMTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGlnaXQ7XHJcblx0XHR9O1xyXG5cclxuXHRcdF90aGlzLmdldEJDSFR5cGVJbmZvID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHR2YXIgZCA9IGRhdGEgPDwgMTA7XHJcblx0XHRcdHdoaWxlIChnZXRCQ0hEaWdpdChkKSAtIGdldEJDSERpZ2l0KEcxNSkgPj0gMCkge1xyXG5cdFx0XHRcdGQgXj0gKEcxNSA8PCAoZ2V0QkNIRGlnaXQoZCkgLSBnZXRCQ0hEaWdpdChHMTUpICkgKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gKCAoZGF0YSA8PCAxMCkgfCBkKSBeIEcxNV9NQVNLO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5nZXRCQ0hUeXBlTnVtYmVyID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHR2YXIgZCA9IGRhdGEgPDwgMTI7XHJcblx0XHRcdHdoaWxlIChnZXRCQ0hEaWdpdChkKSAtIGdldEJDSERpZ2l0KEcxOCkgPj0gMCkge1xyXG5cdFx0XHRcdGQgXj0gKEcxOCA8PCAoZ2V0QkNIRGlnaXQoZCkgLSBnZXRCQ0hEaWdpdChHMTgpICkgKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gKGRhdGEgPDwgMTIpIHwgZDtcclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMuZ2V0UGF0dGVyblBvc2l0aW9uID0gZnVuY3Rpb24odHlwZU51bWJlcikge1xyXG5cdFx0XHRyZXR1cm4gUEFUVEVSTl9QT1NJVElPTl9UQUJMRVt0eXBlTnVtYmVyIC0gMV07XHJcblx0XHR9O1xyXG5cclxuXHRcdF90aGlzLmdldE1hc2tGdW5jdGlvbiA9IGZ1bmN0aW9uKG1hc2tQYXR0ZXJuKSB7XHJcblxyXG5cdFx0XHRzd2l0Y2ggKG1hc2tQYXR0ZXJuKSB7XHJcblxyXG5cdFx0XHRjYXNlIFFSTWFza1BhdHRlcm4uUEFUVEVSTjAwMCA6XHJcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKGksIGopIHsgcmV0dXJuIChpICsgaikgJSAyID09IDA7IH07XHJcblx0XHRcdGNhc2UgUVJNYXNrUGF0dGVybi5QQVRURVJOMDAxIDpcclxuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oaSwgaikgeyByZXR1cm4gaSAlIDIgPT0gMDsgfTtcclxuXHRcdFx0Y2FzZSBRUk1hc2tQYXR0ZXJuLlBBVFRFUk4wMTAgOlxyXG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbihpLCBqKSB7IHJldHVybiBqICUgMyA9PSAwOyB9O1xyXG5cdFx0XHRjYXNlIFFSTWFza1BhdHRlcm4uUEFUVEVSTjAxMSA6XHJcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKGksIGopIHsgcmV0dXJuIChpICsgaikgJSAzID09IDA7IH07XHJcblx0XHRcdGNhc2UgUVJNYXNrUGF0dGVybi5QQVRURVJOMTAwIDpcclxuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oaSwgaikgeyByZXR1cm4gKE1hdGguZmxvb3IoaSAvIDIpICsgTWF0aC5mbG9vcihqIC8gMykgKSAlIDIgPT0gMDsgfTtcclxuXHRcdFx0Y2FzZSBRUk1hc2tQYXR0ZXJuLlBBVFRFUk4xMDEgOlxyXG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbihpLCBqKSB7IHJldHVybiAoaSAqIGopICUgMiArIChpICogaikgJSAzID09IDA7IH07XHJcblx0XHRcdGNhc2UgUVJNYXNrUGF0dGVybi5QQVRURVJOMTEwIDpcclxuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oaSwgaikgeyByZXR1cm4gKCAoaSAqIGopICUgMiArIChpICogaikgJSAzKSAlIDIgPT0gMDsgfTtcclxuXHRcdFx0Y2FzZSBRUk1hc2tQYXR0ZXJuLlBBVFRFUk4xMTEgOlxyXG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbihpLCBqKSB7IHJldHVybiAoIChpICogaikgJSAzICsgKGkgKyBqKSAlIDIpICUgMiA9PSAwOyB9O1xyXG5cclxuXHRcdFx0ZGVmYXVsdCA6XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdiYWQgbWFza1BhdHRlcm46JyArIG1hc2tQYXR0ZXJuKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5nZXRFcnJvckNvcnJlY3RQb2x5bm9taWFsID0gZnVuY3Rpb24oZXJyb3JDb3JyZWN0TGVuZ3RoKSB7XHJcblx0XHRcdHZhciBhID0gcXJQb2x5bm9taWFsKFsxXSwgMCk7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXJyb3JDb3JyZWN0TGVuZ3RoOyBpICs9IDEpIHtcclxuXHRcdFx0XHRhID0gYS5tdWx0aXBseShxclBvbHlub21pYWwoWzEsIFFSTWF0aC5nZXhwKGkpXSwgMCkgKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gYTtcclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMuZ2V0TGVuZ3RoSW5CaXRzID0gZnVuY3Rpb24obW9kZSwgdHlwZSkge1xyXG5cclxuXHRcdFx0aWYgKDEgPD0gdHlwZSAmJiB0eXBlIDwgMTApIHtcclxuXHJcblx0XHRcdFx0Ly8gMSAtIDlcclxuXHJcblx0XHRcdFx0c3dpdGNoKG1vZGUpIHtcclxuXHRcdFx0XHRjYXNlIFFSTW9kZS5NT0RFX05VTUJFUiBcdDogcmV0dXJuIDEwO1xyXG5cdFx0XHRcdGNhc2UgUVJNb2RlLk1PREVfQUxQSEFfTlVNIFx0OiByZXR1cm4gOTtcclxuXHRcdFx0XHRjYXNlIFFSTW9kZS5NT0RFXzhCSVRfQllURVx0OiByZXR1cm4gODtcclxuXHRcdFx0XHRjYXNlIFFSTW9kZS5NT0RFX0tBTkpJXHRcdDogcmV0dXJuIDg7XHJcblx0XHRcdFx0ZGVmYXVsdCA6XHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ21vZGU6JyArIG1vZGUpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA8IDI3KSB7XHJcblxyXG5cdFx0XHRcdC8vIDEwIC0gMjZcclxuXHJcblx0XHRcdFx0c3dpdGNoKG1vZGUpIHtcclxuXHRcdFx0XHRjYXNlIFFSTW9kZS5NT0RFX05VTUJFUiBcdDogcmV0dXJuIDEyO1xyXG5cdFx0XHRcdGNhc2UgUVJNb2RlLk1PREVfQUxQSEFfTlVNIFx0OiByZXR1cm4gMTE7XHJcblx0XHRcdFx0Y2FzZSBRUk1vZGUuTU9ERV84QklUX0JZVEVcdDogcmV0dXJuIDE2O1xyXG5cdFx0XHRcdGNhc2UgUVJNb2RlLk1PREVfS0FOSklcdFx0OiByZXR1cm4gMTA7XHJcblx0XHRcdFx0ZGVmYXVsdCA6XHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ21vZGU6JyArIG1vZGUpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA8IDQxKSB7XHJcblxyXG5cdFx0XHRcdC8vIDI3IC0gNDBcclxuXHJcblx0XHRcdFx0c3dpdGNoKG1vZGUpIHtcclxuXHRcdFx0XHRjYXNlIFFSTW9kZS5NT0RFX05VTUJFUiBcdDogcmV0dXJuIDE0O1xyXG5cdFx0XHRcdGNhc2UgUVJNb2RlLk1PREVfQUxQSEFfTlVNXHQ6IHJldHVybiAxMztcclxuXHRcdFx0XHRjYXNlIFFSTW9kZS5NT0RFXzhCSVRfQllURVx0OiByZXR1cm4gMTY7XHJcblx0XHRcdFx0Y2FzZSBRUk1vZGUuTU9ERV9LQU5KSVx0XHQ6IHJldHVybiAxMjtcclxuXHRcdFx0XHRkZWZhdWx0IDpcclxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignbW9kZTonICsgbW9kZSk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ3R5cGU6JyArIHR5cGUpO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdF90aGlzLmdldExvc3RQb2ludCA9IGZ1bmN0aW9uKHFyY29kZSkge1xyXG5cclxuXHRcdFx0dmFyIG1vZHVsZUNvdW50ID0gcXJjb2RlLmdldE1vZHVsZUNvdW50KCk7XHJcblxyXG5cdFx0XHR2YXIgbG9zdFBvaW50ID0gMDtcclxuXHJcblx0XHRcdC8vIExFVkVMMVxyXG5cclxuXHRcdFx0Zm9yICh2YXIgcm93ID0gMDsgcm93IDwgbW9kdWxlQ291bnQ7IHJvdyArPSAxKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgY29sID0gMDsgY29sIDwgbW9kdWxlQ291bnQ7IGNvbCArPSAxKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIHNhbWVDb3VudCA9IDA7XHJcblx0XHRcdFx0XHR2YXIgZGFyayA9IHFyY29kZS5pc0Rhcmsocm93LCBjb2wpO1xyXG5cclxuXHRcdFx0XHRcdGZvciAodmFyIHIgPSAtMTsgciA8PSAxOyByICs9IDEpIHtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChyb3cgKyByIDwgMCB8fCBtb2R1bGVDb3VudCA8PSByb3cgKyByKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGZvciAodmFyIGMgPSAtMTsgYyA8PSAxOyBjICs9IDEpIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKGNvbCArIGMgPCAwIHx8IG1vZHVsZUNvdW50IDw9IGNvbCArIGMpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHIgPT0gMCAmJiBjID09IDApIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKGRhcmsgPT0gcXJjb2RlLmlzRGFyayhyb3cgKyByLCBjb2wgKyBjKSApIHtcclxuXHRcdFx0XHRcdFx0XHRcdHNhbWVDb3VudCArPSAxO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGlmIChzYW1lQ291bnQgPiA1KSB7XHJcblx0XHRcdFx0XHRcdGxvc3RQb2ludCArPSAoMyArIHNhbWVDb3VudCAtIDUpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdC8vIExFVkVMMlxyXG5cclxuXHRcdFx0Zm9yICh2YXIgcm93ID0gMDsgcm93IDwgbW9kdWxlQ291bnQgLSAxOyByb3cgKz0gMSkge1xyXG5cdFx0XHRcdGZvciAodmFyIGNvbCA9IDA7IGNvbCA8IG1vZHVsZUNvdW50IC0gMTsgY29sICs9IDEpIHtcclxuXHRcdFx0XHRcdHZhciBjb3VudCA9IDA7XHJcblx0XHRcdFx0XHRpZiAocXJjb2RlLmlzRGFyayhyb3csIGNvbCkgKSBjb3VudCArPSAxO1xyXG5cdFx0XHRcdFx0aWYgKHFyY29kZS5pc0Rhcmsocm93ICsgMSwgY29sKSApIGNvdW50ICs9IDE7XHJcblx0XHRcdFx0XHRpZiAocXJjb2RlLmlzRGFyayhyb3csIGNvbCArIDEpICkgY291bnQgKz0gMTtcclxuXHRcdFx0XHRcdGlmIChxcmNvZGUuaXNEYXJrKHJvdyArIDEsIGNvbCArIDEpICkgY291bnQgKz0gMTtcclxuXHRcdFx0XHRcdGlmIChjb3VudCA9PSAwIHx8IGNvdW50ID09IDQpIHtcclxuXHRcdFx0XHRcdFx0bG9zdFBvaW50ICs9IDM7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBMRVZFTDNcclxuXHJcblx0XHRcdGZvciAodmFyIHJvdyA9IDA7IHJvdyA8IG1vZHVsZUNvdW50OyByb3cgKz0gMSkge1xyXG5cdFx0XHRcdGZvciAodmFyIGNvbCA9IDA7IGNvbCA8IG1vZHVsZUNvdW50IC0gNjsgY29sICs9IDEpIHtcclxuXHRcdFx0XHRcdGlmIChxcmNvZGUuaXNEYXJrKHJvdywgY29sKVxyXG5cdFx0XHRcdFx0XHRcdCYmICFxcmNvZGUuaXNEYXJrKHJvdywgY29sICsgMSlcclxuXHRcdFx0XHRcdFx0XHQmJiAgcXJjb2RlLmlzRGFyayhyb3csIGNvbCArIDIpXHJcblx0XHRcdFx0XHRcdFx0JiYgIHFyY29kZS5pc0Rhcmsocm93LCBjb2wgKyAzKVxyXG5cdFx0XHRcdFx0XHRcdCYmICBxcmNvZGUuaXNEYXJrKHJvdywgY29sICsgNClcclxuXHRcdFx0XHRcdFx0XHQmJiAhcXJjb2RlLmlzRGFyayhyb3csIGNvbCArIDUpXHJcblx0XHRcdFx0XHRcdFx0JiYgIHFyY29kZS5pc0Rhcmsocm93LCBjb2wgKyA2KSApIHtcclxuXHRcdFx0XHRcdFx0bG9zdFBvaW50ICs9IDQwO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9yICh2YXIgY29sID0gMDsgY29sIDwgbW9kdWxlQ291bnQ7IGNvbCArPSAxKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgcm93ID0gMDsgcm93IDwgbW9kdWxlQ291bnQgLSA2OyByb3cgKz0gMSkge1xyXG5cdFx0XHRcdFx0aWYgKHFyY29kZS5pc0Rhcmsocm93LCBjb2wpXHJcblx0XHRcdFx0XHRcdFx0JiYgIXFyY29kZS5pc0Rhcmsocm93ICsgMSwgY29sKVxyXG5cdFx0XHRcdFx0XHRcdCYmICBxcmNvZGUuaXNEYXJrKHJvdyArIDIsIGNvbClcclxuXHRcdFx0XHRcdFx0XHQmJiAgcXJjb2RlLmlzRGFyayhyb3cgKyAzLCBjb2wpXHJcblx0XHRcdFx0XHRcdFx0JiYgIHFyY29kZS5pc0Rhcmsocm93ICsgNCwgY29sKVxyXG5cdFx0XHRcdFx0XHRcdCYmICFxcmNvZGUuaXNEYXJrKHJvdyArIDUsIGNvbClcclxuXHRcdFx0XHRcdFx0XHQmJiAgcXJjb2RlLmlzRGFyayhyb3cgKyA2LCBjb2wpICkge1xyXG5cdFx0XHRcdFx0XHRsb3N0UG9pbnQgKz0gNDA7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBMRVZFTDRcclxuXHJcblx0XHRcdHZhciBkYXJrQ291bnQgPSAwO1xyXG5cclxuXHRcdFx0Zm9yICh2YXIgY29sID0gMDsgY29sIDwgbW9kdWxlQ291bnQ7IGNvbCArPSAxKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgcm93ID0gMDsgcm93IDwgbW9kdWxlQ291bnQ7IHJvdyArPSAxKSB7XHJcblx0XHRcdFx0XHRpZiAocXJjb2RlLmlzRGFyayhyb3csIGNvbCkgKSB7XHJcblx0XHRcdFx0XHRcdGRhcmtDb3VudCArPSAxO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIHJhdGlvID0gTWF0aC5hYnMoMTAwICogZGFya0NvdW50IC8gbW9kdWxlQ291bnQgLyBtb2R1bGVDb3VudCAtIDUwKSAvIDU7XHJcblx0XHRcdGxvc3RQb2ludCArPSByYXRpbyAqIDEwO1xyXG5cclxuXHRcdFx0cmV0dXJuIGxvc3RQb2ludDtcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIF90aGlzO1xyXG5cdH0oKTtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBRUk1hdGhcclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR2YXIgUVJNYXRoID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0dmFyIEVYUF9UQUJMRSA9IG5ldyBBcnJheSgyNTYpO1xyXG5cdFx0dmFyIExPR19UQUJMRSA9IG5ldyBBcnJheSgyNTYpO1xyXG5cclxuXHRcdC8vIGluaXRpYWxpemUgdGFibGVzXHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDg7IGkgKz0gMSkge1xyXG5cdFx0XHRFWFBfVEFCTEVbaV0gPSAxIDw8IGk7XHJcblx0XHR9XHJcblx0XHRmb3IgKHZhciBpID0gODsgaSA8IDI1NjsgaSArPSAxKSB7XHJcblx0XHRcdEVYUF9UQUJMRVtpXSA9IEVYUF9UQUJMRVtpIC0gNF1cclxuXHRcdFx0XHReIEVYUF9UQUJMRVtpIC0gNV1cclxuXHRcdFx0XHReIEVYUF9UQUJMRVtpIC0gNl1cclxuXHRcdFx0XHReIEVYUF9UQUJMRVtpIC0gOF07XHJcblx0XHR9XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDI1NTsgaSArPSAxKSB7XHJcblx0XHRcdExPR19UQUJMRVtFWFBfVEFCTEVbaV0gXSA9IGk7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIF90aGlzID0ge307XHJcblxyXG5cdFx0X3RoaXMuZ2xvZyA9IGZ1bmN0aW9uKG4pIHtcclxuXHJcblx0XHRcdGlmIChuIDwgMSkge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignZ2xvZygnICsgbiArICcpJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBMT0dfVEFCTEVbbl07XHJcblx0XHR9O1xyXG5cclxuXHRcdF90aGlzLmdleHAgPSBmdW5jdGlvbihuKSB7XHJcblxyXG5cdFx0XHR3aGlsZSAobiA8IDApIHtcclxuXHRcdFx0XHRuICs9IDI1NTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0d2hpbGUgKG4gPj0gMjU2KSB7XHJcblx0XHRcdFx0biAtPSAyNTU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBFWFBfVEFCTEVbbl07XHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBfdGhpcztcclxuXHR9KCk7XHJcblxyXG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0Ly8gcXJQb2x5bm9taWFsXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0ZnVuY3Rpb24gcXJQb2x5bm9taWFsKG51bSwgc2hpZnQpIHtcclxuXHJcblx0XHRpZiAodHlwZW9mIG51bS5sZW5ndGggPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKG51bS5sZW5ndGggKyAnLycgKyBzaGlmdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIF9udW0gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIG9mZnNldCA9IDA7XHJcblx0XHRcdHdoaWxlIChvZmZzZXQgPCBudW0ubGVuZ3RoICYmIG51bVtvZmZzZXRdID09IDApIHtcclxuXHRcdFx0XHRvZmZzZXQgKz0gMTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgX251bSA9IG5ldyBBcnJheShudW0ubGVuZ3RoIC0gb2Zmc2V0ICsgc2hpZnQpO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG51bS5sZW5ndGggLSBvZmZzZXQ7IGkgKz0gMSkge1xyXG5cdFx0XHRcdF9udW1baV0gPSBudW1baSArIG9mZnNldF07XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIF9udW07XHJcblx0XHR9KCk7XHJcblxyXG5cdFx0dmFyIF90aGlzID0ge307XHJcblxyXG5cdFx0X3RoaXMuZ2V0ID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuXHRcdFx0cmV0dXJuIF9udW1baW5kZXhdO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIF9udW0ubGVuZ3RoO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5tdWx0aXBseSA9IGZ1bmN0aW9uKGUpIHtcclxuXHJcblx0XHRcdHZhciBudW0gPSBuZXcgQXJyYXkoX3RoaXMuZ2V0TGVuZ3RoKCkgKyBlLmdldExlbmd0aCgpIC0gMSk7XHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IF90aGlzLmdldExlbmd0aCgpOyBpICs9IDEpIHtcclxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGUuZ2V0TGVuZ3RoKCk7IGogKz0gMSkge1xyXG5cdFx0XHRcdFx0bnVtW2kgKyBqXSBePSBRUk1hdGguZ2V4cChRUk1hdGguZ2xvZyhfdGhpcy5nZXQoaSkgKSArIFFSTWF0aC5nbG9nKGUuZ2V0KGopICkgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBxclBvbHlub21pYWwobnVtLCAwKTtcclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMubW9kID0gZnVuY3Rpb24oZSkge1xyXG5cclxuXHRcdFx0aWYgKF90aGlzLmdldExlbmd0aCgpIC0gZS5nZXRMZW5ndGgoKSA8IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gX3RoaXM7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciByYXRpbyA9IFFSTWF0aC5nbG9nKF90aGlzLmdldCgwKSApIC0gUVJNYXRoLmdsb2coZS5nZXQoMCkgKTtcclxuXHJcblx0XHRcdHZhciBudW0gPSBuZXcgQXJyYXkoX3RoaXMuZ2V0TGVuZ3RoKCkgKTtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfdGhpcy5nZXRMZW5ndGgoKTsgaSArPSAxKSB7XHJcblx0XHRcdFx0bnVtW2ldID0gX3RoaXMuZ2V0KGkpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGUuZ2V0TGVuZ3RoKCk7IGkgKz0gMSkge1xyXG5cdFx0XHRcdG51bVtpXSBePSBRUk1hdGguZ2V4cChRUk1hdGguZ2xvZyhlLmdldChpKSApICsgcmF0aW8pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyByZWN1cnNpdmUgY2FsbFxyXG5cdFx0XHRyZXR1cm4gcXJQb2x5bm9taWFsKG51bSwgMCkubW9kKGUpO1xyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gX3RoaXM7XHJcblx0fTtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBRUlJTQmxvY2tcclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR2YXIgUVJSU0Jsb2NrID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0dmFyIFJTX0JMT0NLX1RBQkxFID0gW1xyXG5cclxuXHRcdFx0Ly8gTFxyXG5cdFx0XHQvLyBNXHJcblx0XHRcdC8vIFFcclxuXHRcdFx0Ly8gSFxyXG5cclxuXHRcdFx0Ly8gMVxyXG5cdFx0XHRbMSwgMjYsIDE5XSxcclxuXHRcdFx0WzEsIDI2LCAxNl0sXHJcblx0XHRcdFsxLCAyNiwgMTNdLFxyXG5cdFx0XHRbMSwgMjYsIDldLFxyXG5cclxuXHRcdFx0Ly8gMlxyXG5cdFx0XHRbMSwgNDQsIDM0XSxcclxuXHRcdFx0WzEsIDQ0LCAyOF0sXHJcblx0XHRcdFsxLCA0NCwgMjJdLFxyXG5cdFx0XHRbMSwgNDQsIDE2XSxcclxuXHJcblx0XHRcdC8vIDNcclxuXHRcdFx0WzEsIDcwLCA1NV0sXHJcblx0XHRcdFsxLCA3MCwgNDRdLFxyXG5cdFx0XHRbMiwgMzUsIDE3XSxcclxuXHRcdFx0WzIsIDM1LCAxM10sXHJcblxyXG5cdFx0XHQvLyA0XHJcblx0XHRcdFsxLCAxMDAsIDgwXSxcclxuXHRcdFx0WzIsIDUwLCAzMl0sXHJcblx0XHRcdFsyLCA1MCwgMjRdLFxyXG5cdFx0XHRbNCwgMjUsIDldLFxyXG5cclxuXHRcdFx0Ly8gNVxyXG5cdFx0XHRbMSwgMTM0LCAxMDhdLFxyXG5cdFx0XHRbMiwgNjcsIDQzXSxcclxuXHRcdFx0WzIsIDMzLCAxNSwgMiwgMzQsIDE2XSxcclxuXHRcdFx0WzIsIDMzLCAxMSwgMiwgMzQsIDEyXSxcclxuXHJcblx0XHRcdC8vIDZcclxuXHRcdFx0WzIsIDg2LCA2OF0sXHJcblx0XHRcdFs0LCA0MywgMjddLFxyXG5cdFx0XHRbNCwgNDMsIDE5XSxcclxuXHRcdFx0WzQsIDQzLCAxNV0sXHJcblxyXG5cdFx0XHQvLyA3XHJcblx0XHRcdFsyLCA5OCwgNzhdLFxyXG5cdFx0XHRbNCwgNDksIDMxXSxcclxuXHRcdFx0WzIsIDMyLCAxNCwgNCwgMzMsIDE1XSxcclxuXHRcdFx0WzQsIDM5LCAxMywgMSwgNDAsIDE0XSxcclxuXHJcblx0XHRcdC8vIDhcclxuXHRcdFx0WzIsIDEyMSwgOTddLFxyXG5cdFx0XHRbMiwgNjAsIDM4LCAyLCA2MSwgMzldLFxyXG5cdFx0XHRbNCwgNDAsIDE4LCAyLCA0MSwgMTldLFxyXG5cdFx0XHRbNCwgNDAsIDE0LCAyLCA0MSwgMTVdLFxyXG5cclxuXHRcdFx0Ly8gOVxyXG5cdFx0XHRbMiwgMTQ2LCAxMTZdLFxyXG5cdFx0XHRbMywgNTgsIDM2LCAyLCA1OSwgMzddLFxyXG5cdFx0XHRbNCwgMzYsIDE2LCA0LCAzNywgMTddLFxyXG5cdFx0XHRbNCwgMzYsIDEyLCA0LCAzNywgMTNdLFxyXG5cclxuXHRcdFx0Ly8gMTBcclxuXHRcdFx0WzIsIDg2LCA2OCwgMiwgODcsIDY5XSxcclxuXHRcdFx0WzQsIDY5LCA0MywgMSwgNzAsIDQ0XSxcclxuXHRcdFx0WzYsIDQzLCAxOSwgMiwgNDQsIDIwXSxcclxuXHRcdFx0WzYsIDQzLCAxNSwgMiwgNDQsIDE2XSxcclxuXHJcblx0XHRcdC8vIDExXHJcblx0XHRcdFs0LCAxMDEsIDgxXSxcclxuXHRcdFx0WzEsIDgwLCA1MCwgNCwgODEsIDUxXSxcclxuXHRcdFx0WzQsIDUwLCAyMiwgNCwgNTEsIDIzXSxcclxuXHRcdFx0WzMsIDM2LCAxMiwgOCwgMzcsIDEzXSxcclxuXHJcblx0XHRcdC8vIDEyXHJcblx0XHRcdFsyLCAxMTYsIDkyLCAyLCAxMTcsIDkzXSxcclxuXHRcdFx0WzYsIDU4LCAzNiwgMiwgNTksIDM3XSxcclxuXHRcdFx0WzQsIDQ2LCAyMCwgNiwgNDcsIDIxXSxcclxuXHRcdFx0WzcsIDQyLCAxNCwgNCwgNDMsIDE1XSxcclxuXHJcblx0XHRcdC8vIDEzXHJcblx0XHRcdFs0LCAxMzMsIDEwN10sXHJcblx0XHRcdFs4LCA1OSwgMzcsIDEsIDYwLCAzOF0sXHJcblx0XHRcdFs4LCA0NCwgMjAsIDQsIDQ1LCAyMV0sXHJcblx0XHRcdFsxMiwgMzMsIDExLCA0LCAzNCwgMTJdLFxyXG5cclxuXHRcdFx0Ly8gMTRcclxuXHRcdFx0WzMsIDE0NSwgMTE1LCAxLCAxNDYsIDExNl0sXHJcblx0XHRcdFs0LCA2NCwgNDAsIDUsIDY1LCA0MV0sXHJcblx0XHRcdFsxMSwgMzYsIDE2LCA1LCAzNywgMTddLFxyXG5cdFx0XHRbMTEsIDM2LCAxMiwgNSwgMzcsIDEzXSxcclxuXHJcblx0XHRcdC8vIDE1XHJcblx0XHRcdFs1LCAxMDksIDg3LCAxLCAxMTAsIDg4XSxcclxuXHRcdFx0WzUsIDY1LCA0MSwgNSwgNjYsIDQyXSxcclxuXHRcdFx0WzUsIDU0LCAyNCwgNywgNTUsIDI1XSxcclxuXHRcdFx0WzExLCAzNiwgMTJdLFxyXG5cclxuXHRcdFx0Ly8gMTZcclxuXHRcdFx0WzUsIDEyMiwgOTgsIDEsIDEyMywgOTldLFxyXG5cdFx0XHRbNywgNzMsIDQ1LCAzLCA3NCwgNDZdLFxyXG5cdFx0XHRbMTUsIDQzLCAxOSwgMiwgNDQsIDIwXSxcclxuXHRcdFx0WzMsIDQ1LCAxNSwgMTMsIDQ2LCAxNl0sXHJcblxyXG5cdFx0XHQvLyAxN1xyXG5cdFx0XHRbMSwgMTM1LCAxMDcsIDUsIDEzNiwgMTA4XSxcclxuXHRcdFx0WzEwLCA3NCwgNDYsIDEsIDc1LCA0N10sXHJcblx0XHRcdFsxLCA1MCwgMjIsIDE1LCA1MSwgMjNdLFxyXG5cdFx0XHRbMiwgNDIsIDE0LCAxNywgNDMsIDE1XSxcclxuXHJcblx0XHRcdC8vIDE4XHJcblx0XHRcdFs1LCAxNTAsIDEyMCwgMSwgMTUxLCAxMjFdLFxyXG5cdFx0XHRbOSwgNjksIDQzLCA0LCA3MCwgNDRdLFxyXG5cdFx0XHRbMTcsIDUwLCAyMiwgMSwgNTEsIDIzXSxcclxuXHRcdFx0WzIsIDQyLCAxNCwgMTksIDQzLCAxNV0sXHJcblxyXG5cdFx0XHQvLyAxOVxyXG5cdFx0XHRbMywgMTQxLCAxMTMsIDQsIDE0MiwgMTE0XSxcclxuXHRcdFx0WzMsIDcwLCA0NCwgMTEsIDcxLCA0NV0sXHJcblx0XHRcdFsxNywgNDcsIDIxLCA0LCA0OCwgMjJdLFxyXG5cdFx0XHRbOSwgMzksIDEzLCAxNiwgNDAsIDE0XSxcclxuXHJcblx0XHRcdC8vIDIwXHJcblx0XHRcdFszLCAxMzUsIDEwNywgNSwgMTM2LCAxMDhdLFxyXG5cdFx0XHRbMywgNjcsIDQxLCAxMywgNjgsIDQyXSxcclxuXHRcdFx0WzE1LCA1NCwgMjQsIDUsIDU1LCAyNV0sXHJcblx0XHRcdFsxNSwgNDMsIDE1LCAxMCwgNDQsIDE2XSxcclxuXHJcblx0XHRcdC8vIDIxXHJcblx0XHRcdFs0LCAxNDQsIDExNiwgNCwgMTQ1LCAxMTddLFxyXG5cdFx0XHRbMTcsIDY4LCA0Ml0sXHJcblx0XHRcdFsxNywgNTAsIDIyLCA2LCA1MSwgMjNdLFxyXG5cdFx0XHRbMTksIDQ2LCAxNiwgNiwgNDcsIDE3XSxcclxuXHJcblx0XHRcdC8vIDIyXHJcblx0XHRcdFsyLCAxMzksIDExMSwgNywgMTQwLCAxMTJdLFxyXG5cdFx0XHRbMTcsIDc0LCA0Nl0sXHJcblx0XHRcdFs3LCA1NCwgMjQsIDE2LCA1NSwgMjVdLFxyXG5cdFx0XHRbMzQsIDM3LCAxM10sXHJcblxyXG5cdFx0XHQvLyAyM1xyXG5cdFx0XHRbNCwgMTUxLCAxMjEsIDUsIDE1MiwgMTIyXSxcclxuXHRcdFx0WzQsIDc1LCA0NywgMTQsIDc2LCA0OF0sXHJcblx0XHRcdFsxMSwgNTQsIDI0LCAxNCwgNTUsIDI1XSxcclxuXHRcdFx0WzE2LCA0NSwgMTUsIDE0LCA0NiwgMTZdLFxyXG5cclxuXHRcdFx0Ly8gMjRcclxuXHRcdFx0WzYsIDE0NywgMTE3LCA0LCAxNDgsIDExOF0sXHJcblx0XHRcdFs2LCA3MywgNDUsIDE0LCA3NCwgNDZdLFxyXG5cdFx0XHRbMTEsIDU0LCAyNCwgMTYsIDU1LCAyNV0sXHJcblx0XHRcdFszMCwgNDYsIDE2LCAyLCA0NywgMTddLFxyXG5cclxuXHRcdFx0Ly8gMjVcclxuXHRcdFx0WzgsIDEzMiwgMTA2LCA0LCAxMzMsIDEwN10sXHJcblx0XHRcdFs4LCA3NSwgNDcsIDEzLCA3NiwgNDhdLFxyXG5cdFx0XHRbNywgNTQsIDI0LCAyMiwgNTUsIDI1XSxcclxuXHRcdFx0WzIyLCA0NSwgMTUsIDEzLCA0NiwgMTZdLFxyXG5cclxuXHRcdFx0Ly8gMjZcclxuXHRcdFx0WzEwLCAxNDIsIDExNCwgMiwgMTQzLCAxMTVdLFxyXG5cdFx0XHRbMTksIDc0LCA0NiwgNCwgNzUsIDQ3XSxcclxuXHRcdFx0WzI4LCA1MCwgMjIsIDYsIDUxLCAyM10sXHJcblx0XHRcdFszMywgNDYsIDE2LCA0LCA0NywgMTddLFxyXG5cclxuXHRcdFx0Ly8gMjdcclxuXHRcdFx0WzgsIDE1MiwgMTIyLCA0LCAxNTMsIDEyM10sXHJcblx0XHRcdFsyMiwgNzMsIDQ1LCAzLCA3NCwgNDZdLFxyXG5cdFx0XHRbOCwgNTMsIDIzLCAyNiwgNTQsIDI0XSxcclxuXHRcdFx0WzEyLCA0NSwgMTUsIDI4LCA0NiwgMTZdLFxyXG5cclxuXHRcdFx0Ly8gMjhcclxuXHRcdFx0WzMsIDE0NywgMTE3LCAxMCwgMTQ4LCAxMThdLFxyXG5cdFx0XHRbMywgNzMsIDQ1LCAyMywgNzQsIDQ2XSxcclxuXHRcdFx0WzQsIDU0LCAyNCwgMzEsIDU1LCAyNV0sXHJcblx0XHRcdFsxMSwgNDUsIDE1LCAzMSwgNDYsIDE2XSxcclxuXHJcblx0XHRcdC8vIDI5XHJcblx0XHRcdFs3LCAxNDYsIDExNiwgNywgMTQ3LCAxMTddLFxyXG5cdFx0XHRbMjEsIDczLCA0NSwgNywgNzQsIDQ2XSxcclxuXHRcdFx0WzEsIDUzLCAyMywgMzcsIDU0LCAyNF0sXHJcblx0XHRcdFsxOSwgNDUsIDE1LCAyNiwgNDYsIDE2XSxcclxuXHJcblx0XHRcdC8vIDMwXHJcblx0XHRcdFs1LCAxNDUsIDExNSwgMTAsIDE0NiwgMTE2XSxcclxuXHRcdFx0WzE5LCA3NSwgNDcsIDEwLCA3NiwgNDhdLFxyXG5cdFx0XHRbMTUsIDU0LCAyNCwgMjUsIDU1LCAyNV0sXHJcblx0XHRcdFsyMywgNDUsIDE1LCAyNSwgNDYsIDE2XSxcclxuXHJcblx0XHRcdC8vIDMxXHJcblx0XHRcdFsxMywgMTQ1LCAxMTUsIDMsIDE0NiwgMTE2XSxcclxuXHRcdFx0WzIsIDc0LCA0NiwgMjksIDc1LCA0N10sXHJcblx0XHRcdFs0MiwgNTQsIDI0LCAxLCA1NSwgMjVdLFxyXG5cdFx0XHRbMjMsIDQ1LCAxNSwgMjgsIDQ2LCAxNl0sXHJcblxyXG5cdFx0XHQvLyAzMlxyXG5cdFx0XHRbMTcsIDE0NSwgMTE1XSxcclxuXHRcdFx0WzEwLCA3NCwgNDYsIDIzLCA3NSwgNDddLFxyXG5cdFx0XHRbMTAsIDU0LCAyNCwgMzUsIDU1LCAyNV0sXHJcblx0XHRcdFsxOSwgNDUsIDE1LCAzNSwgNDYsIDE2XSxcclxuXHJcblx0XHRcdC8vIDMzXHJcblx0XHRcdFsxNywgMTQ1LCAxMTUsIDEsIDE0NiwgMTE2XSxcclxuXHRcdFx0WzE0LCA3NCwgNDYsIDIxLCA3NSwgNDddLFxyXG5cdFx0XHRbMjksIDU0LCAyNCwgMTksIDU1LCAyNV0sXHJcblx0XHRcdFsxMSwgNDUsIDE1LCA0NiwgNDYsIDE2XSxcclxuXHJcblx0XHRcdC8vIDM0XHJcblx0XHRcdFsxMywgMTQ1LCAxMTUsIDYsIDE0NiwgMTE2XSxcclxuXHRcdFx0WzE0LCA3NCwgNDYsIDIzLCA3NSwgNDddLFxyXG5cdFx0XHRbNDQsIDU0LCAyNCwgNywgNTUsIDI1XSxcclxuXHRcdFx0WzU5LCA0NiwgMTYsIDEsIDQ3LCAxN10sXHJcblxyXG5cdFx0XHQvLyAzNVxyXG5cdFx0XHRbMTIsIDE1MSwgMTIxLCA3LCAxNTIsIDEyMl0sXHJcblx0XHRcdFsxMiwgNzUsIDQ3LCAyNiwgNzYsIDQ4XSxcclxuXHRcdFx0WzM5LCA1NCwgMjQsIDE0LCA1NSwgMjVdLFxyXG5cdFx0XHRbMjIsIDQ1LCAxNSwgNDEsIDQ2LCAxNl0sXHJcblxyXG5cdFx0XHQvLyAzNlxyXG5cdFx0XHRbNiwgMTUxLCAxMjEsIDE0LCAxNTIsIDEyMl0sXHJcblx0XHRcdFs2LCA3NSwgNDcsIDM0LCA3NiwgNDhdLFxyXG5cdFx0XHRbNDYsIDU0LCAyNCwgMTAsIDU1LCAyNV0sXHJcblx0XHRcdFsyLCA0NSwgMTUsIDY0LCA0NiwgMTZdLFxyXG5cclxuXHRcdFx0Ly8gMzdcclxuXHRcdFx0WzE3LCAxNTIsIDEyMiwgNCwgMTUzLCAxMjNdLFxyXG5cdFx0XHRbMjksIDc0LCA0NiwgMTQsIDc1LCA0N10sXHJcblx0XHRcdFs0OSwgNTQsIDI0LCAxMCwgNTUsIDI1XSxcclxuXHRcdFx0WzI0LCA0NSwgMTUsIDQ2LCA0NiwgMTZdLFxyXG5cclxuXHRcdFx0Ly8gMzhcclxuXHRcdFx0WzQsIDE1MiwgMTIyLCAxOCwgMTUzLCAxMjNdLFxyXG5cdFx0XHRbMTMsIDc0LCA0NiwgMzIsIDc1LCA0N10sXHJcblx0XHRcdFs0OCwgNTQsIDI0LCAxNCwgNTUsIDI1XSxcclxuXHRcdFx0WzQyLCA0NSwgMTUsIDMyLCA0NiwgMTZdLFxyXG5cclxuXHRcdFx0Ly8gMzlcclxuXHRcdFx0WzIwLCAxNDcsIDExNywgNCwgMTQ4LCAxMThdLFxyXG5cdFx0XHRbNDAsIDc1LCA0NywgNywgNzYsIDQ4XSxcclxuXHRcdFx0WzQzLCA1NCwgMjQsIDIyLCA1NSwgMjVdLFxyXG5cdFx0XHRbMTAsIDQ1LCAxNSwgNjcsIDQ2LCAxNl0sXHJcblxyXG5cdFx0XHQvLyA0MFxyXG5cdFx0XHRbMTksIDE0OCwgMTE4LCA2LCAxNDksIDExOV0sXHJcblx0XHRcdFsxOCwgNzUsIDQ3LCAzMSwgNzYsIDQ4XSxcclxuXHRcdFx0WzM0LCA1NCwgMjQsIDM0LCA1NSwgMjVdLFxyXG5cdFx0XHRbMjAsIDQ1LCAxNSwgNjEsIDQ2LCAxNl1cclxuXHRcdF07XHJcblxyXG5cdFx0dmFyIHFyUlNCbG9jayA9IGZ1bmN0aW9uKHRvdGFsQ291bnQsIGRhdGFDb3VudCkge1xyXG5cdFx0XHR2YXIgX3RoaXMgPSB7fTtcclxuXHRcdFx0X3RoaXMudG90YWxDb3VudCA9IHRvdGFsQ291bnQ7XHJcblx0XHRcdF90aGlzLmRhdGFDb3VudCA9IGRhdGFDb3VudDtcclxuXHRcdFx0cmV0dXJuIF90aGlzO1xyXG5cdFx0fTtcclxuXHJcblx0XHR2YXIgX3RoaXMgPSB7fTtcclxuXHJcblx0XHR2YXIgZ2V0UnNCbG9ja1RhYmxlID0gZnVuY3Rpb24odHlwZU51bWJlciwgZXJyb3JDb3JyZWN0TGV2ZWwpIHtcclxuXHJcblx0XHRcdHN3aXRjaChlcnJvckNvcnJlY3RMZXZlbCkge1xyXG5cdFx0XHRjYXNlIFFSRXJyb3JDb3JyZWN0TGV2ZWwuTCA6XHJcblx0XHRcdFx0cmV0dXJuIFJTX0JMT0NLX1RBQkxFWyh0eXBlTnVtYmVyIC0gMSkgKiA0ICsgMF07XHJcblx0XHRcdGNhc2UgUVJFcnJvckNvcnJlY3RMZXZlbC5NIDpcclxuXHRcdFx0XHRyZXR1cm4gUlNfQkxPQ0tfVEFCTEVbKHR5cGVOdW1iZXIgLSAxKSAqIDQgKyAxXTtcclxuXHRcdFx0Y2FzZSBRUkVycm9yQ29ycmVjdExldmVsLlEgOlxyXG5cdFx0XHRcdHJldHVybiBSU19CTE9DS19UQUJMRVsodHlwZU51bWJlciAtIDEpICogNCArIDJdO1xyXG5cdFx0XHRjYXNlIFFSRXJyb3JDb3JyZWN0TGV2ZWwuSCA6XHJcblx0XHRcdFx0cmV0dXJuIFJTX0JMT0NLX1RBQkxFWyh0eXBlTnVtYmVyIC0gMSkgKiA0ICsgM107XHJcblx0XHRcdGRlZmF1bHQgOlxyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMuZ2V0UlNCbG9ja3MgPSBmdW5jdGlvbih0eXBlTnVtYmVyLCBlcnJvckNvcnJlY3RMZXZlbCkge1xyXG5cclxuXHRcdFx0dmFyIHJzQmxvY2sgPSBnZXRSc0Jsb2NrVGFibGUodHlwZU51bWJlciwgZXJyb3JDb3JyZWN0TGV2ZWwpO1xyXG5cclxuXHRcdFx0aWYgKHR5cGVvZiByc0Jsb2NrID09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdiYWQgcnMgYmxvY2sgQCB0eXBlTnVtYmVyOicgKyB0eXBlTnVtYmVyICtcclxuXHRcdFx0XHRcdFx0Jy9lcnJvckNvcnJlY3RMZXZlbDonICsgZXJyb3JDb3JyZWN0TGV2ZWwpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgbGVuZ3RoID0gcnNCbG9jay5sZW5ndGggLyAzO1xyXG5cclxuXHRcdFx0dmFyIGxpc3QgPSBuZXcgQXJyYXkoKTtcclxuXHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcclxuXHJcblx0XHRcdFx0dmFyIGNvdW50ID0gcnNCbG9ja1tpICogMyArIDBdO1xyXG5cdFx0XHRcdHZhciB0b3RhbENvdW50ID0gcnNCbG9ja1tpICogMyArIDFdO1xyXG5cdFx0XHRcdHZhciBkYXRhQ291bnQgPSByc0Jsb2NrW2kgKiAzICsgMl07XHJcblxyXG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgY291bnQ7IGogKz0gMSkge1xyXG5cdFx0XHRcdFx0bGlzdC5wdXNoKHFyUlNCbG9jayh0b3RhbENvdW50LCBkYXRhQ291bnQpICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gbGlzdDtcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIF90aGlzO1xyXG5cdH0oKTtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBxckJpdEJ1ZmZlclxyXG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdHZhciBxckJpdEJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdHZhciBfYnVmZmVyID0gbmV3IEFycmF5KCk7XHJcblx0XHR2YXIgX2xlbmd0aCA9IDA7XHJcblxyXG5cdFx0dmFyIF90aGlzID0ge307XHJcblxyXG5cdFx0X3RoaXMuZ2V0QnVmZmVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBfYnVmZmVyO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5nZXQgPSBmdW5jdGlvbihpbmRleCkge1xyXG5cdFx0XHR2YXIgYnVmSW5kZXggPSBNYXRoLmZsb29yKGluZGV4IC8gOCk7XHJcblx0XHRcdHJldHVybiAoIChfYnVmZmVyW2J1ZkluZGV4XSA+Pj4gKDcgLSBpbmRleCAlIDgpICkgJiAxKSA9PSAxO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5wdXQgPSBmdW5jdGlvbihudW0sIGxlbmd0aCkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XHJcblx0XHRcdFx0X3RoaXMucHV0Qml0KCAoIChudW0gPj4+IChsZW5ndGggLSBpIC0gMSkgKSAmIDEpID09IDEpO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdF90aGlzLmdldExlbmd0aEluQml0cyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gX2xlbmd0aDtcclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMucHV0Qml0ID0gZnVuY3Rpb24oYml0KSB7XHJcblxyXG5cdFx0XHR2YXIgYnVmSW5kZXggPSBNYXRoLmZsb29yKF9sZW5ndGggLyA4KTtcclxuXHRcdFx0aWYgKF9idWZmZXIubGVuZ3RoIDw9IGJ1ZkluZGV4KSB7XHJcblx0XHRcdFx0X2J1ZmZlci5wdXNoKDApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoYml0KSB7XHJcblx0XHRcdFx0X2J1ZmZlcltidWZJbmRleF0gfD0gKDB4ODAgPj4+IChfbGVuZ3RoICUgOCkgKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0X2xlbmd0aCArPSAxO1xyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gX3RoaXM7XHJcblx0fTtcclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBxcjhCaXRCeXRlXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0dmFyIHFyOEJpdEJ5dGUgPSBmdW5jdGlvbihkYXRhKSB7XHJcblxyXG5cdFx0dmFyIF9tb2RlID0gUVJNb2RlLk1PREVfOEJJVF9CWVRFO1xyXG5cdFx0dmFyIF9kYXRhID0gZGF0YTtcclxuXHRcdHZhciBfYnl0ZXMgPSBxcmNvZGUuc3RyaW5nVG9CeXRlcyhkYXRhKTtcclxuXHJcblx0XHR2YXIgX3RoaXMgPSB7fTtcclxuXHJcblx0XHRfdGhpcy5nZXRNb2RlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBfbW9kZTtcclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oYnVmZmVyKSB7XHJcblx0XHRcdHJldHVybiBfYnl0ZXMubGVuZ3RoO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlcikge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IF9ieXRlcy5sZW5ndGg7IGkgKz0gMSkge1xyXG5cdFx0XHRcdGJ1ZmZlci5wdXQoX2J5dGVzW2ldLCA4KTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gX3RoaXM7XHJcblx0fTtcclxuXHJcblx0Ly89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHQvLyBHSUYgU3VwcG9ydCBldGMuXHJcblx0Ly9cclxuXHJcblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvLyBieXRlQXJyYXlPdXRwdXRTdHJlYW1cclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR2YXIgYnl0ZUFycmF5T3V0cHV0U3RyZWFtID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0dmFyIF9ieXRlcyA9IG5ldyBBcnJheSgpO1xyXG5cclxuXHRcdHZhciBfdGhpcyA9IHt9O1xyXG5cclxuXHRcdF90aGlzLndyaXRlQnl0ZSA9IGZ1bmN0aW9uKGIpIHtcclxuXHRcdFx0X2J5dGVzLnB1c2goYiAmIDB4ZmYpO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy53cml0ZVNob3J0ID0gZnVuY3Rpb24oaSkge1xyXG5cdFx0XHRfdGhpcy53cml0ZUJ5dGUoaSk7XHJcblx0XHRcdF90aGlzLndyaXRlQnl0ZShpID4+PiA4KTtcclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMud3JpdGVCeXRlcyA9IGZ1bmN0aW9uKGIsIG9mZiwgbGVuKSB7XHJcblx0XHRcdG9mZiA9IG9mZiB8fCAwO1xyXG5cdFx0XHRsZW4gPSBsZW4gfHwgYi5sZW5ndGg7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcclxuXHRcdFx0XHRfdGhpcy53cml0ZUJ5dGUoYltpICsgb2ZmXSk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0X3RoaXMud3JpdGVTdHJpbmcgPSBmdW5jdGlvbihzKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkgKz0gMSkge1xyXG5cdFx0XHRcdF90aGlzLndyaXRlQnl0ZShzLmNoYXJDb2RlQXQoaSkgKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy50b0J5dGVBcnJheSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gX2J5dGVzO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgcyA9ICcnO1xyXG5cdFx0XHRzICs9ICdbJztcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBfYnl0ZXMubGVuZ3RoOyBpICs9IDEpIHtcclxuXHRcdFx0XHRpZiAoaSA+IDApIHtcclxuXHRcdFx0XHRcdHMgKz0gJywnO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRzICs9IF9ieXRlc1tpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHRzICs9ICddJztcclxuXHRcdFx0cmV0dXJuIHM7XHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBfdGhpcztcclxuXHR9O1xyXG5cclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdC8vIGJhc2U2NEVuY29kZU91dHB1dFN0cmVhbVxyXG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdHZhciBiYXNlNjRFbmNvZGVPdXRwdXRTdHJlYW0gPSBmdW5jdGlvbigpIHtcclxuXHJcblx0XHR2YXIgX2J1ZmZlciA9IDA7XHJcblx0XHR2YXIgX2J1ZmxlbiA9IDA7XHJcblx0XHR2YXIgX2xlbmd0aCA9IDA7XHJcblx0XHR2YXIgX2Jhc2U2NCA9ICcnO1xyXG5cclxuXHRcdHZhciBfdGhpcyA9IHt9O1xyXG5cclxuXHRcdHZhciB3cml0ZUVuY29kZWQgPSBmdW5jdGlvbihiKSB7XHJcblx0XHRcdF9iYXNlNjQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShlbmNvZGUoYiAmIDB4M2YpICk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciBlbmNvZGUgPSBmdW5jdGlvbihuKSB7XHJcblx0XHRcdGlmIChuIDwgMCkge1xyXG5cdFx0XHRcdC8vIGVycm9yLlxyXG5cdFx0XHR9IGVsc2UgaWYgKG4gPCAyNikge1xyXG5cdFx0XHRcdHJldHVybiAweDQxICsgbjtcclxuXHRcdFx0fSBlbHNlIGlmIChuIDwgNTIpIHtcclxuXHRcdFx0XHRyZXR1cm4gMHg2MSArIChuIC0gMjYpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKG4gPCA2Mikge1xyXG5cdFx0XHRcdHJldHVybiAweDMwICsgKG4gLSA1Mik7XHJcblx0XHRcdH0gZWxzZSBpZiAobiA9PSA2Mikge1xyXG5cdFx0XHRcdHJldHVybiAweDJiO1xyXG5cdFx0XHR9IGVsc2UgaWYgKG4gPT0gNjMpIHtcclxuXHRcdFx0XHRyZXR1cm4gMHgyZjtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ246JyArIG4pO1xyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy53cml0ZUJ5dGUgPSBmdW5jdGlvbihuKSB7XHJcblxyXG5cdFx0XHRfYnVmZmVyID0gKF9idWZmZXIgPDwgOCkgfCAobiAmIDB4ZmYpO1xyXG5cdFx0XHRfYnVmbGVuICs9IDg7XHJcblx0XHRcdF9sZW5ndGggKz0gMTtcclxuXHJcblx0XHRcdHdoaWxlIChfYnVmbGVuID49IDYpIHtcclxuXHRcdFx0XHR3cml0ZUVuY29kZWQoX2J1ZmZlciA+Pj4gKF9idWZsZW4gLSA2KSApO1xyXG5cdFx0XHRcdF9idWZsZW4gLT0gNjtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy5mbHVzaCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0aWYgKF9idWZsZW4gPiAwKSB7XHJcblx0XHRcdFx0d3JpdGVFbmNvZGVkKF9idWZmZXIgPDwgKDYgLSBfYnVmbGVuKSApO1xyXG5cdFx0XHRcdF9idWZmZXIgPSAwO1xyXG5cdFx0XHRcdF9idWZsZW4gPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoX2xlbmd0aCAlIDMgIT0gMCkge1xyXG5cdFx0XHRcdC8vIHBhZGRpbmdcclxuXHRcdFx0XHR2YXIgcGFkbGVuID0gMyAtIF9sZW5ndGggJSAzO1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcGFkbGVuOyBpICs9IDEpIHtcclxuXHRcdFx0XHRcdF9iYXNlNjQgKz0gJz0nO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRfdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gX2Jhc2U2NDtcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIF90aGlzO1xyXG5cdH07XHJcblxyXG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0Ly8gYmFzZTY0RGVjb2RlSW5wdXRTdHJlYW1cclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR2YXIgYmFzZTY0RGVjb2RlSW5wdXRTdHJlYW0gPSBmdW5jdGlvbihzdHIpIHtcclxuXHJcblx0XHR2YXIgX3N0ciA9IHN0cjtcclxuXHRcdHZhciBfcG9zID0gMDtcclxuXHRcdHZhciBfYnVmZmVyID0gMDtcclxuXHRcdHZhciBfYnVmbGVuID0gMDtcclxuXHJcblx0XHR2YXIgX3RoaXMgPSB7fTtcclxuXHJcblx0XHRfdGhpcy5yZWFkID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHR3aGlsZSAoX2J1ZmxlbiA8IDgpIHtcclxuXHJcblx0XHRcdFx0aWYgKF9wb3MgPj0gX3N0ci5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdGlmIChfYnVmbGVuID09IDApIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCd1bmV4cGVjdGVkIGVuZCBvZiBmaWxlLi8nICsgX2J1Zmxlbik7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR2YXIgYyA9IF9zdHIuY2hhckF0KF9wb3MpO1xyXG5cdFx0XHRcdF9wb3MgKz0gMTtcclxuXHJcblx0XHRcdFx0aWYgKGMgPT0gJz0nKSB7XHJcblx0XHRcdFx0XHRfYnVmbGVuID0gMDtcclxuXHRcdFx0XHRcdHJldHVybiAtMTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGMubWF0Y2goL15cXHMkLykgKSB7XHJcblx0XHRcdFx0XHQvLyBpZ25vcmUgaWYgd2hpdGVzcGFjZS5cclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0X2J1ZmZlciA9IChfYnVmZmVyIDw8IDYpIHwgZGVjb2RlKGMuY2hhckNvZGVBdCgwKSApO1xyXG5cdFx0XHRcdF9idWZsZW4gKz0gNjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIG4gPSAoX2J1ZmZlciA+Pj4gKF9idWZsZW4gLSA4KSApICYgMHhmZjtcclxuXHRcdFx0X2J1ZmxlbiAtPSA4O1xyXG5cdFx0XHRyZXR1cm4gbjtcclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIGRlY29kZSA9IGZ1bmN0aW9uKGMpIHtcclxuXHRcdFx0aWYgKDB4NDEgPD0gYyAmJiBjIDw9IDB4NWEpIHtcclxuXHRcdFx0XHRyZXR1cm4gYyAtIDB4NDE7XHJcblx0XHRcdH0gZWxzZSBpZiAoMHg2MSA8PSBjICYmIGMgPD0gMHg3YSkge1xyXG5cdFx0XHRcdHJldHVybiBjIC0gMHg2MSArIDI2O1xyXG5cdFx0XHR9IGVsc2UgaWYgKDB4MzAgPD0gYyAmJiBjIDw9IDB4MzkpIHtcclxuXHRcdFx0XHRyZXR1cm4gYyAtIDB4MzAgKyA1MjtcclxuXHRcdFx0fSBlbHNlIGlmIChjID09IDB4MmIpIHtcclxuXHRcdFx0XHRyZXR1cm4gNjI7XHJcblx0XHRcdH0gZWxzZSBpZiAoYyA9PSAweDJmKSB7XHJcblx0XHRcdFx0cmV0dXJuIDYzO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignYzonICsgYyk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIF90aGlzO1xyXG5cdH07XHJcblxyXG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0Ly8gZ2lmSW1hZ2UgKEIvVylcclxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR2YXIgZ2lmSW1hZ2UgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XHJcblxyXG5cdFx0dmFyIF93aWR0aCA9IHdpZHRoO1xyXG5cdFx0dmFyIF9oZWlnaHQgPSBoZWlnaHQ7XHJcblx0XHR2YXIgX2RhdGEgPSBuZXcgQXJyYXkod2lkdGggKiBoZWlnaHQpO1xyXG5cclxuXHRcdHZhciBfdGhpcyA9IHt9O1xyXG5cclxuXHRcdF90aGlzLnNldFBpeGVsID0gZnVuY3Rpb24oeCwgeSwgcGl4ZWwpIHtcclxuXHRcdFx0X2RhdGFbeSAqIF93aWR0aCArIHhdID0gcGl4ZWw7XHJcblx0XHR9O1xyXG5cclxuXHRcdF90aGlzLndyaXRlID0gZnVuY3Rpb24ob3V0KSB7XHJcblxyXG5cdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdFx0XHQvLyBHSUYgU2lnbmF0dXJlXHJcblxyXG5cdFx0XHRvdXQud3JpdGVTdHJpbmcoJ0dJRjg3YScpO1xyXG5cclxuXHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdFx0Ly8gU2NyZWVuIERlc2NyaXB0b3JcclxuXHJcblx0XHRcdG91dC53cml0ZVNob3J0KF93aWR0aCk7XHJcblx0XHRcdG91dC53cml0ZVNob3J0KF9oZWlnaHQpO1xyXG5cclxuXHRcdFx0b3V0LndyaXRlQnl0ZSgweDgwKTsgLy8gMmJpdFxyXG5cdFx0XHRvdXQud3JpdGVCeXRlKDApO1xyXG5cdFx0XHRvdXQud3JpdGVCeXRlKDApO1xyXG5cclxuXHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdFx0Ly8gR2xvYmFsIENvbG9yIE1hcFxyXG5cclxuXHRcdFx0Ly8gYmxhY2tcclxuXHRcdFx0b3V0LndyaXRlQnl0ZSgweDAwKTtcclxuXHRcdFx0b3V0LndyaXRlQnl0ZSgweDAwKTtcclxuXHRcdFx0b3V0LndyaXRlQnl0ZSgweDAwKTtcclxuXHJcblx0XHRcdC8vIHdoaXRlXHJcblx0XHRcdG91dC53cml0ZUJ5dGUoMHhmZik7XHJcblx0XHRcdG91dC53cml0ZUJ5dGUoMHhmZik7XHJcblx0XHRcdG91dC53cml0ZUJ5dGUoMHhmZik7XHJcblxyXG5cdFx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdFx0XHQvLyBJbWFnZSBEZXNjcmlwdG9yXHJcblxyXG5cdFx0XHRvdXQud3JpdGVTdHJpbmcoJywnKTtcclxuXHRcdFx0b3V0LndyaXRlU2hvcnQoMCk7XHJcblx0XHRcdG91dC53cml0ZVNob3J0KDApO1xyXG5cdFx0XHRvdXQud3JpdGVTaG9ydChfd2lkdGgpO1xyXG5cdFx0XHRvdXQud3JpdGVTaG9ydChfaGVpZ2h0KTtcclxuXHRcdFx0b3V0LndyaXRlQnl0ZSgwKTtcclxuXHJcblx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0XHRcdC8vIExvY2FsIENvbG9yIE1hcFxyXG5cclxuXHRcdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdFx0Ly8gUmFzdGVyIERhdGFcclxuXHJcblx0XHRcdHZhciBsendNaW5Db2RlU2l6ZSA9IDI7XHJcblx0XHRcdHZhciByYXN0ZXIgPSBnZXRMWldSYXN0ZXIobHp3TWluQ29kZVNpemUpO1xyXG5cclxuXHRcdFx0b3V0LndyaXRlQnl0ZShsendNaW5Db2RlU2l6ZSk7XHJcblxyXG5cdFx0XHR2YXIgb2Zmc2V0ID0gMDtcclxuXHJcblx0XHRcdHdoaWxlIChyYXN0ZXIubGVuZ3RoIC0gb2Zmc2V0ID4gMjU1KSB7XHJcblx0XHRcdFx0b3V0LndyaXRlQnl0ZSgyNTUpO1xyXG5cdFx0XHRcdG91dC53cml0ZUJ5dGVzKHJhc3Rlciwgb2Zmc2V0LCAyNTUpO1xyXG5cdFx0XHRcdG9mZnNldCArPSAyNTU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG91dC53cml0ZUJ5dGUocmFzdGVyLmxlbmd0aCAtIG9mZnNldCk7XHJcblx0XHRcdG91dC53cml0ZUJ5dGVzKHJhc3Rlciwgb2Zmc2V0LCByYXN0ZXIubGVuZ3RoIC0gb2Zmc2V0KTtcclxuXHRcdFx0b3V0LndyaXRlQnl0ZSgweDAwKTtcclxuXHJcblx0XHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0XHRcdC8vIEdJRiBUZXJtaW5hdG9yXHJcblx0XHRcdG91dC53cml0ZVN0cmluZygnOycpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR2YXIgYml0T3V0cHV0U3RyZWFtID0gZnVuY3Rpb24ob3V0KSB7XHJcblxyXG5cdFx0XHR2YXIgX291dCA9IG91dDtcclxuXHRcdFx0dmFyIF9iaXRMZW5ndGggPSAwO1xyXG5cdFx0XHR2YXIgX2JpdEJ1ZmZlciA9IDA7XHJcblxyXG5cdFx0XHR2YXIgX3RoaXMgPSB7fTtcclxuXHJcblx0XHRcdF90aGlzLndyaXRlID0gZnVuY3Rpb24oZGF0YSwgbGVuZ3RoKSB7XHJcblxyXG5cdFx0XHRcdGlmICggKGRhdGEgPj4+IGxlbmd0aCkgIT0gMCkge1xyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdsZW5ndGggb3ZlcicpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0d2hpbGUgKF9iaXRMZW5ndGggKyBsZW5ndGggPj0gOCkge1xyXG5cdFx0XHRcdFx0X291dC53cml0ZUJ5dGUoMHhmZiAmICggKGRhdGEgPDwgX2JpdExlbmd0aCkgfCBfYml0QnVmZmVyKSApO1xyXG5cdFx0XHRcdFx0bGVuZ3RoIC09ICg4IC0gX2JpdExlbmd0aCk7XHJcblx0XHRcdFx0XHRkYXRhID4+Pj0gKDggLSBfYml0TGVuZ3RoKTtcclxuXHRcdFx0XHRcdF9iaXRCdWZmZXIgPSAwO1xyXG5cdFx0XHRcdFx0X2JpdExlbmd0aCA9IDA7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRfYml0QnVmZmVyID0gKGRhdGEgPDwgX2JpdExlbmd0aCkgfCBfYml0QnVmZmVyO1xyXG5cdFx0XHRcdF9iaXRMZW5ndGggPSBfYml0TGVuZ3RoICsgbGVuZ3RoO1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0X3RoaXMuZmx1c2ggPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoX2JpdExlbmd0aCA+IDApIHtcclxuXHRcdFx0XHRcdF9vdXQud3JpdGVCeXRlKF9iaXRCdWZmZXIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHJldHVybiBfdGhpcztcclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIGdldExaV1Jhc3RlciA9IGZ1bmN0aW9uKGx6d01pbkNvZGVTaXplKSB7XHJcblxyXG5cdFx0XHR2YXIgY2xlYXJDb2RlID0gMSA8PCBsendNaW5Db2RlU2l6ZTtcclxuXHRcdFx0dmFyIGVuZENvZGUgPSAoMSA8PCBsendNaW5Db2RlU2l6ZSkgKyAxO1xyXG5cdFx0XHR2YXIgYml0TGVuZ3RoID0gbHp3TWluQ29kZVNpemUgKyAxO1xyXG5cclxuXHRcdFx0Ly8gU2V0dXAgTFpXVGFibGVcclxuXHRcdFx0dmFyIHRhYmxlID0gbHp3VGFibGUoKTtcclxuXHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2xlYXJDb2RlOyBpICs9IDEpIHtcclxuXHRcdFx0XHR0YWJsZS5hZGQoU3RyaW5nLmZyb21DaGFyQ29kZShpKSApO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRhYmxlLmFkZChTdHJpbmcuZnJvbUNoYXJDb2RlKGNsZWFyQ29kZSkgKTtcclxuXHRcdFx0dGFibGUuYWRkKFN0cmluZy5mcm9tQ2hhckNvZGUoZW5kQ29kZSkgKTtcclxuXHJcblx0XHRcdHZhciBieXRlT3V0ID0gYnl0ZUFycmF5T3V0cHV0U3RyZWFtKCk7XHJcblx0XHRcdHZhciBiaXRPdXQgPSBiaXRPdXRwdXRTdHJlYW0oYnl0ZU91dCk7XHJcblxyXG5cdFx0XHQvLyBjbGVhciBjb2RlXHJcblx0XHRcdGJpdE91dC53cml0ZShjbGVhckNvZGUsIGJpdExlbmd0aCk7XHJcblxyXG5cdFx0XHR2YXIgZGF0YUluZGV4ID0gMDtcclxuXHJcblx0XHRcdHZhciBzID0gU3RyaW5nLmZyb21DaGFyQ29kZShfZGF0YVtkYXRhSW5kZXhdKTtcclxuXHRcdFx0ZGF0YUluZGV4ICs9IDE7XHJcblxyXG5cdFx0XHR3aGlsZSAoZGF0YUluZGV4IDwgX2RhdGEubGVuZ3RoKSB7XHJcblxyXG5cdFx0XHRcdHZhciBjID0gU3RyaW5nLmZyb21DaGFyQ29kZShfZGF0YVtkYXRhSW5kZXhdKTtcclxuXHRcdFx0XHRkYXRhSW5kZXggKz0gMTtcclxuXHJcblx0XHRcdFx0aWYgKHRhYmxlLmNvbnRhaW5zKHMgKyBjKSApIHtcclxuXHJcblx0XHRcdFx0XHRzID0gcyArIGM7XHJcblxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdFx0Yml0T3V0LndyaXRlKHRhYmxlLmluZGV4T2YocyksIGJpdExlbmd0aCk7XHJcblxyXG5cdFx0XHRcdFx0aWYgKHRhYmxlLnNpemUoKSA8IDB4ZmZmKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodGFibGUuc2l6ZSgpID09ICgxIDw8IGJpdExlbmd0aCkgKSB7XHJcblx0XHRcdFx0XHRcdFx0Yml0TGVuZ3RoICs9IDE7XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdHRhYmxlLmFkZChzICsgYyk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0cyA9IGM7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRiaXRPdXQud3JpdGUodGFibGUuaW5kZXhPZihzKSwgYml0TGVuZ3RoKTtcclxuXHJcblx0XHRcdC8vIGVuZCBjb2RlXHJcblx0XHRcdGJpdE91dC53cml0ZShlbmRDb2RlLCBiaXRMZW5ndGgpO1xyXG5cclxuXHRcdFx0Yml0T3V0LmZsdXNoKCk7XHJcblxyXG5cdFx0XHRyZXR1cm4gYnl0ZU91dC50b0J5dGVBcnJheSgpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR2YXIgbHp3VGFibGUgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdHZhciBfbWFwID0ge307XHJcblx0XHRcdHZhciBfc2l6ZSA9IDA7XHJcblxyXG5cdFx0XHR2YXIgX3RoaXMgPSB7fTtcclxuXHJcblx0XHRcdF90aGlzLmFkZCA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdFx0XHRcdGlmIChfdGhpcy5jb250YWlucyhrZXkpICkge1xyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdkdXAga2V5OicgKyBrZXkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRfbWFwW2tleV0gPSBfc2l6ZTtcclxuXHRcdFx0XHRfc2l6ZSArPSAxO1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0X3RoaXMuc2l6ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBfc2l6ZTtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdF90aGlzLmluZGV4T2YgPSBmdW5jdGlvbihrZXkpIHtcclxuXHRcdFx0XHRyZXR1cm4gX21hcFtrZXldO1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0X3RoaXMuY29udGFpbnMgPSBmdW5jdGlvbihrZXkpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIF9tYXBba2V5XSAhPSAndW5kZWZpbmVkJztcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHJldHVybiBfdGhpcztcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIF90aGlzO1xyXG5cdH07XHJcblxyXG5cdHZhciBjcmVhdGVJbWdUYWcgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBnZXRQaXhlbCwgYWx0KSB7XHJcblxyXG5cdFx0dmFyIGdpZiA9IGdpZkltYWdlKHdpZHRoLCBoZWlnaHQpO1xyXG5cdFx0Zm9yICh2YXIgeSA9IDA7IHkgPCBoZWlnaHQ7IHkgKz0gMSkge1xyXG5cdFx0XHRmb3IgKHZhciB4ID0gMDsgeCA8IHdpZHRoOyB4ICs9IDEpIHtcclxuXHRcdFx0XHRnaWYuc2V0UGl4ZWwoeCwgeSwgZ2V0UGl4ZWwoeCwgeSkgKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBiID0gYnl0ZUFycmF5T3V0cHV0U3RyZWFtKCk7XHJcblx0XHRnaWYud3JpdGUoYik7XHJcblxyXG5cdFx0dmFyIGJhc2U2NCA9IGJhc2U2NEVuY29kZU91dHB1dFN0cmVhbSgpO1xyXG5cdFx0dmFyIGJ5dGVzID0gYi50b0J5dGVBcnJheSgpO1xyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMSkge1xyXG5cdFx0XHRiYXNlNjQud3JpdGVCeXRlKGJ5dGVzW2ldKTtcclxuXHRcdH1cclxuXHRcdGJhc2U2NC5mbHVzaCgpO1xyXG5cclxuXHRcdHZhciBpbWcgPSAnJztcclxuXHRcdGltZyArPSAnPGltZyc7XHJcblx0XHRpbWcgKz0gJ1xcdTAwMjBzcmM9XCInO1xyXG5cdFx0aW1nICs9ICdkYXRhOmltYWdlL2dpZjtiYXNlNjQsJztcclxuXHRcdGltZyArPSBiYXNlNjQ7XHJcblx0XHRpbWcgKz0gJ1wiJztcclxuXHRcdGltZyArPSAnXFx1MDAyMHdpZHRoPVwiJztcclxuXHRcdGltZyArPSB3aWR0aDtcclxuXHRcdGltZyArPSAnXCInO1xyXG5cdFx0aW1nICs9ICdcXHUwMDIwaGVpZ2h0PVwiJztcclxuXHRcdGltZyArPSBoZWlnaHQ7XHJcblx0XHRpbWcgKz0gJ1wiJztcclxuXHRcdGlmIChhbHQpIHtcclxuXHRcdFx0aW1nICs9ICdcXHUwMDIwYWx0PVwiJztcclxuXHRcdFx0aW1nICs9IGFsdDtcclxuXHRcdFx0aW1nICs9ICdcIic7XHJcblx0XHR9XHJcblx0XHRpbWcgKz0gJy8+JztcclxuXHJcblx0XHRyZXR1cm4gaW1nO1xyXG5cdH07XHJcblxyXG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0Ly8gcmV0dXJucyBxcmNvZGUgZnVuY3Rpb24uXHJcblxyXG5cdHJldHVybiBxcmNvZGU7XHJcbn0oKTtcclxuXG47IGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKHR5cGVvZiBxcmNvZGUgIT0gXCJ1bmRlZmluZWRcIiA/IHFyY29kZSA6IHdpbmRvdy5xcmNvZGUpO1xuXG59KS5jYWxsKGdsb2JhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmdW5jdGlvbiBkZWZpbmVFeHBvcnQoZXgpIHsgbW9kdWxlLmV4cG9ydHMgPSBleDsgfSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuXG47IFNwaW5uZXIgPSBnbG9iYWwuU3Bpbm5lciA9IHJlcXVpcmUoXCJlOlxcXFxjb2Rlc1xcXFxub2RlanNcXFxcYWZcXFxcYm93ZXJfY29tcG9uZW50c1xcXFxsYWRkYS1ib290c3RyYXBcXFxcZGlzdFxcXFxzcGluLmpzXCIpO1xuO19fYnJvd3NlcmlmeV9zaGltX3JlcXVpcmVfXz1yZXF1aXJlOyhmdW5jdGlvbiBicm93c2VyaWZ5U2hpbShtb2R1bGUsIGV4cG9ydHMsIHJlcXVpcmUsIGRlZmluZSwgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18pIHtcbihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFsgXCJzcGluXCIgXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5MYWRkYSA9IGZhY3Rvcnkocm9vdC5TcGlubmVyKTtcbiAgICB9XG59KSh0aGlzLCBmdW5jdGlvbihTcGlubmVyKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIEFMTF9JTlNUQU5DRVMgPSBbXTtcbiAgICBmdW5jdGlvbiBjcmVhdGUoYnV0dG9uKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYnV0dG9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJMYWRkYSBidXR0b24gdGFyZ2V0IG11c3QgYmUgZGVmaW5lZC5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFidXR0b24ucXVlcnlTZWxlY3RvcihcIi5sYWRkYS1sYWJlbFwiKSkge1xuICAgICAgICAgICAgYnV0dG9uLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cImxhZGRhLWxhYmVsXCI+JyArIGJ1dHRvbi5pbm5lckhUTUwgKyBcIjwvc3Bhbj5cIjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3Bpbm5lciA9IGNyZWF0ZVNwaW5uZXIoYnV0dG9uKTtcbiAgICAgICAgdmFyIHNwaW5uZXJXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHNwaW5uZXJXcmFwcGVyLmNsYXNzTmFtZSA9IFwibGFkZGEtc3Bpbm5lclwiO1xuICAgICAgICBidXR0b24uYXBwZW5kQ2hpbGQoc3Bpbm5lcldyYXBwZXIpO1xuICAgICAgICB2YXIgdGltZXI7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBidXR0b24uc2V0QXR0cmlidXRlKFwiZGlzYWJsZWRcIiwgXCJcIik7XG4gICAgICAgICAgICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcImRhdGEtbG9hZGluZ1wiLCBcIlwiKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHNwaW5uZXIuc3BpbihzcGlubmVyV3JhcHBlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRQcm9ncmVzcygwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydEFmdGVyOiBmdW5jdGlvbihkZWxheSkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS5zdGFydCgpO1xuICAgICAgICAgICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBidXR0b24ucmVtb3ZlQXR0cmlidXRlKFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICAgYnV0dG9uLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtbG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdG9wKCk7XG4gICAgICAgICAgICAgICAgfSwgMWUzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTG9hZGluZygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0UHJvZ3Jlc3M6IGZ1bmN0aW9uKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MgPSBNYXRoLm1heChNYXRoLm1pbihwcm9ncmVzcywgMSksIDApO1xuICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzc0VsZW1lbnQgPSBidXR0b24ucXVlcnlTZWxlY3RvcihcIi5sYWRkYS1wcm9ncmVzc1wiKTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZ3Jlc3MgPT09IDAgJiYgcHJvZ3Jlc3NFbGVtZW50ICYmIHByb2dyZXNzRWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHByb2dyZXNzRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwcm9ncmVzc0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzc0VsZW1lbnQuY2xhc3NOYW1lID0gXCJsYWRkYS1wcm9ncmVzc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uLmFwcGVuZENoaWxkKHByb2dyZXNzRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NFbGVtZW50LnN0eWxlLndpZHRoID0gKHByb2dyZXNzIHx8IDApICogYnV0dG9uLm9mZnNldFdpZHRoICsgXCJweFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiLCBcIlwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0xvYWRpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBidXR0b24uaGFzQXR0cmlidXRlKFwiZGF0YS1sb2FkaW5nXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBBTExfSU5TVEFOQ0VTLnB1c2goaW5zdGFuY2UpO1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJpbmQodGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICB2YXIgdGFyZ2V0cyA9IFtdO1xuICAgICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGFyZ2V0cyA9IHRvQXJyYXkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0YXJnZXQpKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGFyZ2V0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiB0YXJnZXQubm9kZU5hbWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRhcmdldHMgPSBbIHRhcmdldCBdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0YXJnZXRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB0YXJnZXRzW2ldO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gY3JlYXRlKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGltZW91dCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlLnN0YXJ0QWZ0ZXIoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudGltZW91dCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChpbnN0YW5jZS5zdG9wLCBvcHRpb25zLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmNhbGxiYWNrLmFwcGx5KG51bGwsIFsgaW5zdGFuY2UgXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN0b3BBbGwoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBBTExfSU5TVEFOQ0VTLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBBTExfSU5TVEFOQ0VTW2ldLnN0b3AoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVTcGlubmVyKGJ1dHRvbikge1xuICAgICAgICB2YXIgaGVpZ2h0ID0gYnV0dG9uLm9mZnNldEhlaWdodCwgc3Bpbm5lckNvbG9yO1xuICAgICAgICBpZiAoaGVpZ2h0ID4gMzIpIHtcbiAgICAgICAgICAgIGhlaWdodCAqPSAuODtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYnV0dG9uLmhhc0F0dHJpYnV0ZShcImRhdGEtc3Bpbm5lci1zaXplXCIpKSB7XG4gICAgICAgICAgICBoZWlnaHQgPSBwYXJzZUludChidXR0b24uZ2V0QXR0cmlidXRlKFwiZGF0YS1zcGlubmVyLXNpemVcIiksIDEwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYnV0dG9uLmhhc0F0dHJpYnV0ZShcImRhdGEtc3Bpbm5lci1jb2xvclwiKSkge1xuICAgICAgICAgICAgc3Bpbm5lckNvbG9yID0gYnV0dG9uLmdldEF0dHJpYnV0ZShcImRhdGEtc3Bpbm5lci1jb2xvclwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGluZXMgPSAxMiwgcmFkaXVzID0gaGVpZ2h0ICogLjIsIGxlbmd0aCA9IHJhZGl1cyAqIC42LCB3aWR0aCA9IHJhZGl1cyA8IDcgPyAyIDogMztcbiAgICAgICAgcmV0dXJuIG5ldyBTcGlubmVyKHtcbiAgICAgICAgICAgIGNvbG9yOiBzcGlubmVyQ29sb3IgfHwgXCIjZmZmXCIsXG4gICAgICAgICAgICBsaW5lczogbGluZXMsXG4gICAgICAgICAgICByYWRpdXM6IHJhZGl1cyxcbiAgICAgICAgICAgIGxlbmd0aDogbGVuZ3RoLFxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgekluZGV4OiBcImF1dG9cIixcbiAgICAgICAgICAgIHRvcDogXCJhdXRvXCIsXG4gICAgICAgICAgICBsZWZ0OiBcImF1dG9cIixcbiAgICAgICAgICAgIGNsYXNzTmFtZTogXCJcIlxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG9BcnJheShub2Rlcykge1xuICAgICAgICB2YXIgYSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhLnB1c2gobm9kZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBiaW5kOiBiaW5kLFxuICAgICAgICBjcmVhdGU6IGNyZWF0ZSxcbiAgICAgICAgc3RvcEFsbDogc3RvcEFsbFxuICAgIH07XG59KTtcbjsgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18odHlwZW9mIExhZGRhICE9IFwidW5kZWZpbmVkXCIgPyBMYWRkYSA6IHdpbmRvdy5MYWRkYSk7XG5cbn0pLmNhbGwoZ2xvYmFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGZ1bmN0aW9uIGRlZmluZUV4cG9ydChleCkgeyBtb2R1bGUuZXhwb3J0cyA9IGV4OyB9KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG47X19icm93c2VyaWZ5X3NoaW1fcmVxdWlyZV9fPXJlcXVpcmU7KGZ1bmN0aW9uIGJyb3dzZXJpZnlTaGltKG1vZHVsZSwgZXhwb3J0cywgcmVxdWlyZSwgZGVmaW5lLCBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXykge1xuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT0gXCJvYmplY3RcIikgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIGRlZmluZShmYWN0b3J5KTsgZWxzZSByb290LlNwaW5uZXIgPSBmYWN0b3J5KCk7XG59KSh0aGlzLCBmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgcHJlZml4ZXMgPSBbIFwid2Via2l0XCIsIFwiTW96XCIsIFwibXNcIiwgXCJPXCIgXSwgYW5pbWF0aW9ucyA9IHt9LCB1c2VDc3NBbmltYXRpb25zO1xuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsKHRhZywgcHJvcCkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyB8fCBcImRpdlwiKSwgbjtcbiAgICAgICAgZm9yIChuIGluIHByb3ApIGVsW25dID0gcHJvcFtuXTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnMocGFyZW50KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykgcGFyZW50LmFwcGVuZENoaWxkKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgIHJldHVybiBwYXJlbnQ7XG4gICAgfVxuICAgIHZhciBzaGVldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWwgPSBjcmVhdGVFbChcInN0eWxlXCIsIHtcbiAgICAgICAgICAgIHR5cGU6IFwidGV4dC9jc3NcIlxuICAgICAgICB9KTtcbiAgICAgICAgaW5zKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXSwgZWwpO1xuICAgICAgICByZXR1cm4gZWwuc2hlZXQgfHwgZWwuc3R5bGVTaGVldDtcbiAgICB9KCk7XG4gICAgZnVuY3Rpb24gYWRkQW5pbWF0aW9uKGFscGhhLCB0cmFpbCwgaSwgbGluZXMpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBbIFwib3BhY2l0eVwiLCB0cmFpbCwgfn4oYWxwaGEgKiAxMDApLCBpLCBsaW5lcyBdLmpvaW4oXCItXCIpLCBzdGFydCA9IC4wMSArIGkgLyBsaW5lcyAqIDEwMCwgeiA9IE1hdGgubWF4KDEgLSAoMSAtIGFscGhhKSAvIHRyYWlsICogKDEwMCAtIHN0YXJ0KSwgYWxwaGEpLCBwcmVmaXggPSB1c2VDc3NBbmltYXRpb25zLnN1YnN0cmluZygwLCB1c2VDc3NBbmltYXRpb25zLmluZGV4T2YoXCJBbmltYXRpb25cIikpLnRvTG93ZXJDYXNlKCksIHByZSA9IHByZWZpeCAmJiBcIi1cIiArIHByZWZpeCArIFwiLVwiIHx8IFwiXCI7XG4gICAgICAgIGlmICghYW5pbWF0aW9uc1tuYW1lXSkge1xuICAgICAgICAgICAgc2hlZXQuaW5zZXJ0UnVsZShcIkBcIiArIHByZSArIFwia2V5ZnJhbWVzIFwiICsgbmFtZSArIFwie1wiICsgXCIwJXtvcGFjaXR5OlwiICsgeiArIFwifVwiICsgc3RhcnQgKyBcIiV7b3BhY2l0eTpcIiArIGFscGhhICsgXCJ9XCIgKyAoc3RhcnQgKyAuMDEpICsgXCIle29wYWNpdHk6MX1cIiArIChzdGFydCArIHRyYWlsKSAlIDEwMCArIFwiJXtvcGFjaXR5OlwiICsgYWxwaGEgKyBcIn1cIiArIFwiMTAwJXtvcGFjaXR5OlwiICsgeiArIFwifVwiICsgXCJ9XCIsIHNoZWV0LmNzc1J1bGVzLmxlbmd0aCk7XG4gICAgICAgICAgICBhbmltYXRpb25zW25hbWVdID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdmVuZG9yKGVsLCBwcm9wKSB7XG4gICAgICAgIHZhciBzID0gZWwuc3R5bGUsIHBwLCBpO1xuICAgICAgICBpZiAoc1twcm9wXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcDtcbiAgICAgICAgcHJvcCA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBwID0gcHJlZml4ZXNbaV0gKyBwcm9wO1xuICAgICAgICAgICAgaWYgKHNbcHBdICE9PSB1bmRlZmluZWQpIHJldHVybiBwcDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBjc3MoZWwsIHByb3ApIHtcbiAgICAgICAgZm9yICh2YXIgbiBpbiBwcm9wKSBlbC5zdHlsZVt2ZW5kb3IoZWwsIG4pIHx8IG5dID0gcHJvcFtuXTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtZXJnZShvYmopIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZWYgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBuIGluIGRlZikgaWYgKG9ialtuXSA9PT0gdW5kZWZpbmVkKSBvYmpbbl0gPSBkZWZbbl07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gICAgZnVuY3Rpb24gcG9zKGVsKSB7XG4gICAgICAgIHZhciBvID0ge1xuICAgICAgICAgICAgeDogZWwub2Zmc2V0TGVmdCxcbiAgICAgICAgICAgIHk6IGVsLm9mZnNldFRvcFxuICAgICAgICB9O1xuICAgICAgICB3aGlsZSAoZWwgPSBlbC5vZmZzZXRQYXJlbnQpIG8ueCArPSBlbC5vZmZzZXRMZWZ0LCBvLnkgKz0gZWwub2Zmc2V0VG9wO1xuICAgICAgICByZXR1cm4gbztcbiAgICB9XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBsaW5lczogMTIsXG4gICAgICAgIGxlbmd0aDogNyxcbiAgICAgICAgd2lkdGg6IDUsXG4gICAgICAgIHJhZGl1czogMTAsXG4gICAgICAgIHJvdGF0ZTogMCxcbiAgICAgICAgY29ybmVyczogMSxcbiAgICAgICAgY29sb3I6IFwiIzAwMFwiLFxuICAgICAgICBkaXJlY3Rpb246IDEsXG4gICAgICAgIHNwZWVkOiAxLFxuICAgICAgICB0cmFpbDogMTAwLFxuICAgICAgICBvcGFjaXR5OiAxIC8gNCxcbiAgICAgICAgZnBzOiAyMCxcbiAgICAgICAgekluZGV4OiAyZTksXG4gICAgICAgIGNsYXNzTmFtZTogXCJzcGlubmVyXCIsXG4gICAgICAgIHRvcDogXCJhdXRvXCIsXG4gICAgICAgIGxlZnQ6IFwiYXV0b1wiLFxuICAgICAgICBwb3NpdGlvbjogXCJyZWxhdGl2ZVwiXG4gICAgfTtcbiAgICBmdW5jdGlvbiBTcGlubmVyKG8pIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzID09IFwidW5kZWZpbmVkXCIpIHJldHVybiBuZXcgU3Bpbm5lcihvKTtcbiAgICAgICAgdGhpcy5vcHRzID0gbWVyZ2UobyB8fCB7fSwgU3Bpbm5lci5kZWZhdWx0cywgZGVmYXVsdHMpO1xuICAgIH1cbiAgICBTcGlubmVyLmRlZmF1bHRzID0ge307XG4gICAgbWVyZ2UoU3Bpbm5lci5wcm90b3R5cGUsIHtcbiAgICAgICAgc3BpbjogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcywgbyA9IHNlbGYub3B0cywgZWwgPSBzZWxmLmVsID0gY3NzKGNyZWF0ZUVsKDAsIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6IG8uY2xhc3NOYW1lXG4gICAgICAgICAgICB9KSwge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBvLnBvc2l0aW9uLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAwLFxuICAgICAgICAgICAgICAgIHpJbmRleDogby56SW5kZXhcbiAgICAgICAgICAgIH0pLCBtaWQgPSBvLnJhZGl1cyArIG8ubGVuZ3RoICsgby53aWR0aCwgZXAsIHRwO1xuICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUoZWwsIHRhcmdldC5maXJzdENoaWxkIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgIHRwID0gcG9zKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgZXAgPSBwb3MoZWwpO1xuICAgICAgICAgICAgICAgIGNzcyhlbCwge1xuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAoby5sZWZ0ID09IFwiYXV0b1wiID8gdHAueCAtIGVwLnggKyAodGFyZ2V0Lm9mZnNldFdpZHRoID4+IDEpIDogcGFyc2VJbnQoby5sZWZ0LCAxMCkgKyBtaWQpICsgXCJweFwiLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IChvLnRvcCA9PSBcImF1dG9cIiA/IHRwLnkgLSBlcC55ICsgKHRhcmdldC5vZmZzZXRIZWlnaHQgPj4gMSkgOiBwYXJzZUludChvLnRvcCwgMTApICsgbWlkKSArIFwicHhcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInByb2dyZXNzYmFyXCIpO1xuICAgICAgICAgICAgc2VsZi5saW5lcyhlbCwgc2VsZi5vcHRzKTtcbiAgICAgICAgICAgIGlmICghdXNlQ3NzQW5pbWF0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBpID0gMCwgc3RhcnQgPSAoby5saW5lcyAtIDEpICogKDEgLSBvLmRpcmVjdGlvbikgLyAyLCBhbHBoYSwgZnBzID0gby5mcHMsIGYgPSBmcHMgLyBvLnNwZWVkLCBvc3RlcCA9ICgxIC0gby5vcGFjaXR5KSAvIChmICogby50cmFpbCAvIDEwMCksIGFzdGVwID0gZiAvIG8ubGluZXM7XG4gICAgICAgICAgICAgICAgKGZ1bmN0aW9uIGFuaW0oKSB7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvLmxpbmVzOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFscGhhID0gTWF0aC5tYXgoMSAtIChpICsgKG8ubGluZXMgLSBqKSAqIGFzdGVwKSAlIGYgKiBvc3RlcCwgby5vcGFjaXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub3BhY2l0eShlbCwgaiAqIG8uZGlyZWN0aW9uICsgc3RhcnQsIGFscGhhLCBvKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbWVvdXQgPSBzZWxmLmVsICYmIHNldFRpbWVvdXQoYW5pbSwgfn4oMWUzIC8gZnBzKSk7XG4gICAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICB9LFxuICAgICAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbCA9IHRoaXMuZWw7XG4gICAgICAgICAgICBpZiAoZWwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICBpZiAoZWwucGFyZW50Tm9kZSkgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBsaW5lczogZnVuY3Rpb24oZWwsIG8pIHtcbiAgICAgICAgICAgIHZhciBpID0gMCwgc3RhcnQgPSAoby5saW5lcyAtIDEpICogKDEgLSBvLmRpcmVjdGlvbikgLyAyLCBzZWc7XG4gICAgICAgICAgICBmdW5jdGlvbiBmaWxsKGNvbG9yLCBzaGFkb3cpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3NzKGNyZWF0ZUVsKCksIHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG8ubGVuZ3RoICsgby53aWR0aCArIFwicHhcIixcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBvLndpZHRoICsgXCJweFwiLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBjb2xvcixcbiAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiBzaGFkb3csXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU9yaWdpbjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogXCJyb3RhdGUoXCIgKyB+figzNjAgLyBvLmxpbmVzICogaSArIG8ucm90YXRlKSArIFwiZGVnKSB0cmFuc2xhdGUoXCIgKyBvLnJhZGl1cyArIFwicHhcIiArIFwiLDApXCIsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogKG8uY29ybmVycyAqIG8ud2lkdGggPj4gMSkgKyBcInB4XCJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoO2kgPCBvLmxpbmVzOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzZWcgPSBjc3MoY3JlYXRlRWwoKSwge1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IDEgKyB+KG8ud2lkdGggLyAyKSArIFwicHhcIixcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBvLmh3YWNjZWwgPyBcInRyYW5zbGF0ZTNkKDAsMCwwKVwiIDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogby5vcGFjaXR5LFxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IHVzZUNzc0FuaW1hdGlvbnMgJiYgYWRkQW5pbWF0aW9uKG8ub3BhY2l0eSwgby50cmFpbCwgc3RhcnQgKyBpICogby5kaXJlY3Rpb24sIG8ubGluZXMpICsgXCIgXCIgKyAxIC8gby5zcGVlZCArIFwicyBsaW5lYXIgaW5maW5pdGVcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChvLnNoYWRvdykgaW5zKHNlZywgY3NzKGZpbGwoXCIjMDAwXCIsIFwiMCAwIDRweCBcIiArIFwiIzAwMFwiKSwge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IDIgKyBcInB4XCJcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgaW5zKGVsLCBpbnMoc2VnLCBmaWxsKG8uY29sb3IsIFwiMCAwIDFweCByZ2JhKDAsMCwwLC4xKVwiKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9LFxuICAgICAgICBvcGFjaXR5OiBmdW5jdGlvbihlbCwgaSwgdmFsKSB7XG4gICAgICAgICAgICBpZiAoaSA8IGVsLmNoaWxkTm9kZXMubGVuZ3RoKSBlbC5jaGlsZE5vZGVzW2ldLnN0eWxlLm9wYWNpdHkgPSB2YWw7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBmdW5jdGlvbiBpbml0Vk1MKCkge1xuICAgICAgICBmdW5jdGlvbiB2bWwodGFnLCBhdHRyKSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlRWwoXCI8XCIgKyB0YWcgKyAnIHhtbG5zPVwidXJuOnNjaGVtYXMtbWljcm9zb2Z0LmNvbTp2bWxcIiBjbGFzcz1cInNwaW4tdm1sXCI+JywgYXR0cik7XG4gICAgICAgIH1cbiAgICAgICAgc2hlZXQuYWRkUnVsZShcIi5zcGluLXZtbFwiLCBcImJlaGF2aW9yOnVybCgjZGVmYXVsdCNWTUwpXCIpO1xuICAgICAgICBTcGlubmVyLnByb3RvdHlwZS5saW5lcyA9IGZ1bmN0aW9uKGVsLCBvKSB7XG4gICAgICAgICAgICB2YXIgciA9IG8ubGVuZ3RoICsgby53aWR0aCwgcyA9IDIgKiByO1xuICAgICAgICAgICAgZnVuY3Rpb24gZ3JwKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjc3Modm1sKFwiZ3JvdXBcIiwge1xuICAgICAgICAgICAgICAgICAgICBjb29yZHNpemU6IHMgKyBcIiBcIiArIHMsXG4gICAgICAgICAgICAgICAgICAgIGNvb3Jkb3JpZ2luOiAtciArIFwiIFwiICsgLXJcbiAgICAgICAgICAgICAgICB9KSwge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogcyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbWFyZ2luID0gLShvLndpZHRoICsgby5sZW5ndGgpICogMiArIFwicHhcIiwgZyA9IGNzcyhncnAoKSwge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG4gICAgICAgICAgICAgICAgdG9wOiBtYXJnaW4sXG4gICAgICAgICAgICAgICAgbGVmdDogbWFyZ2luXG4gICAgICAgICAgICB9KSwgaTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHNlZyhpLCBkeCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgaW5zKGcsIGlucyhjc3MoZ3JwKCksIHtcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IDM2MCAvIG8ubGluZXMgKiBpICsgXCJkZWdcIixcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogfn5keFxuICAgICAgICAgICAgICAgIH0pLCBpbnMoY3NzKHZtbChcInJvdW5kcmVjdFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIGFyY3NpemU6IG8uY29ybmVyc1xuICAgICAgICAgICAgICAgIH0pLCB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiByLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IG8ud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IG8ucmFkaXVzLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IC1vLndpZHRoID4+IDEsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogZmlsdGVyXG4gICAgICAgICAgICAgICAgfSksIHZtbChcImZpbGxcIiwge1xuICAgICAgICAgICAgICAgICAgICBjb2xvcjogby5jb2xvcixcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogby5vcGFjaXR5XG4gICAgICAgICAgICAgICAgfSksIHZtbChcInN0cm9rZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgICAgICAgICB9KSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvLnNoYWRvdykgZm9yIChpID0gMTsgaSA8PSBvLmxpbmVzOyBpKyspIHNlZyhpLCAtMiwgXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQmx1cihwaXhlbHJhZGl1cz0yLG1ha2VzaGFkb3c9MSxzaGFkb3dvcGFjaXR5PS4zKVwiKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPD0gby5saW5lczsgaSsrKSBzZWcoaSk7XG4gICAgICAgICAgICByZXR1cm4gaW5zKGVsLCBnKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3Bpbm5lci5wcm90b3R5cGUub3BhY2l0eSA9IGZ1bmN0aW9uKGVsLCBpLCB2YWwsIG8pIHtcbiAgICAgICAgICAgIHZhciBjID0gZWwuZmlyc3RDaGlsZDtcbiAgICAgICAgICAgIG8gPSBvLnNoYWRvdyAmJiBvLmxpbmVzIHx8IDA7XG4gICAgICAgICAgICBpZiAoYyAmJiBpICsgbyA8IGMuY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjID0gYy5jaGlsZE5vZGVzW2kgKyBvXTtcbiAgICAgICAgICAgICAgICBjID0gYyAmJiBjLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICAgICAgYyA9IGMgJiYgYy5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgIGlmIChjKSBjLm9wYWNpdHkgPSB2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBwcm9iZSA9IGNzcyhjcmVhdGVFbChcImdyb3VwXCIpLCB7XG4gICAgICAgIGJlaGF2aW9yOiBcInVybCgjZGVmYXVsdCNWTUwpXCJcbiAgICB9KTtcbiAgICBpZiAoIXZlbmRvcihwcm9iZSwgXCJ0cmFuc2Zvcm1cIikgJiYgcHJvYmUuYWRqKSBpbml0Vk1MKCk7IGVsc2UgdXNlQ3NzQW5pbWF0aW9ucyA9IHZlbmRvcihwcm9iZSwgXCJhbmltYXRpb25cIik7XG4gICAgcmV0dXJuIFNwaW5uZXI7XG59KTtcbjsgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18odHlwZW9mIFNwaW5uZXIgIT0gXCJ1bmRlZmluZWRcIiA/IFNwaW5uZXIgOiB3aW5kb3cuU3Bpbm5lcik7XG5cbn0pLmNhbGwoZ2xvYmFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGZ1bmN0aW9uIGRlZmluZUV4cG9ydChleCkgeyBtb2R1bGUuZXhwb3J0cyA9IGV4OyB9KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiXX0=
