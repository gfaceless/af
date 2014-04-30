var $ = require('jquery');
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



