var $ = require('jquery');

var
    $container,
    $btn,
    $selected,
    $input,
    $menu

var defaults = {
    container: ".category-picker",
    btn: ".btn-select",
    selected: ".category-selected",
    input: "input",
    menu: ".category-menu"
};


module.exports = picker;


function _init(opts) {

    opts = opts || {};
    // TODO: I wish I could use lodash.defaults
    opts = $.extend(defaults, opts);

    $container = $(opts.container);
    $btn = $(opts.btn);
    $selected = $(opts.selected);
    $input = $container.find(opts.input);
    $menu = $container.find(opts.menu);
}

function _showMenu() {
    $menu.find('>dl').show();

    $menu.show();
}
function _off() {
    _hideMenu();
    $('html').off('click keydown');
}
function _hideMenu() {
    $menu.hide();
}

function _bind() {
    $btn.on('click', function (e) {
        e.stopPropagation();
        _showMenu();

        $('html')
            .on('click', _off)
            .on('keydown', function (e) { if (e.keyCode == 27)  _off(); })
    });

    $menu.on('click', "a", function () {
        var $this = $(this);
        if(!$this.parent().hasClass('lvl3')) {
            alert('暂时只支持底层类别选择');
            return false;
        }
        var href = $this.attr('href');
        var match = href.match(/category=(\w+)/);
        match = match && match[1];

        $selected.text($this.text());
        $input.val(match);
        _hideMenu();
        // validate it if we have validation plugin
        // not only returns true/false, but ALSO TRIGGER THE FEEDBACK
        if($input.valid) $input.valid();

        return false;
    })


}
function picker(opts) {
    _init(opts);
    _bind();
}

