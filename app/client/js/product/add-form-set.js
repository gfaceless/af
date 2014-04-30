var $ = require('jquery');
var options;
var defaults = {
    container: ".info-added"

};

var $container
    , initialized
    , $dom

module.exports = factory;

function factory(opts) {
    _init(opts);
    return addFormSet;
}

function _createDom() {
    var $form_set = $("<div/>", {"class": "form-set"})
    var $label_input_wrapper = $('<div/>', {"class": "label-input-wrapper"})
    var $input_wrapper = $('<div/>', {"class": 'input-wrapper'});
    var $error_wrapper = $('<div/>', {"class": 'error-wrapper'});

    $input_wrapper.append(
        $('<input/>', {"class": "form-control"}),
        $('<button/>',{"type": "button", "class": "form-set-remove"})
            .append($('<span/>'))
    );

    $label_input_wrapper.append(
        $("<input/>", {"class": "form-control", placeholder: "(例:内径)"} )
    )

    return $form_set.append(
        $label_input_wrapper, $input_wrapper, $error_wrapper
    )


}

function _clone() {
    $dom = $dom || _createDom();
    return $dom.clone();
}
function addFormSet() {
    $container.append(_clone());
}
function _bind() {

    $container.on('click', ".form-set-remove", function () {
        $(this).parents(".form-set").remove();
    });
    $container.parents('form').on('submit', function () {
        var $label_inputs = $container.find('.label-input-wrapper input');

        function setName(el, name) {
            $(el).parent().next().find('input')
                .prop('name', "product[extra][" + name + "]");
        }

        $label_inputs.each(function (i, el) {
            var name = $.trim($(el).val());
            if(name) setName(el, name);
        });

    });


}


function _init(opts) {
    options = $.extend(defaults, opts);
    $container = $(options.container);
    _bind();
}