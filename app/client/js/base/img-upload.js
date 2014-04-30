var img_upload_selector = "#img-upload"

module.exports = function (selector) {
    $(selector || img_upload_selector ).on('change', function () {

        var $this = $(this);
        var $form = $this.parents('form');
        if($this.val())  $form.attr('enctype', "multipart/form-data");
        // application/x-www-form-urlencoded
        else $form.attr('enctype', null);
    });

};

