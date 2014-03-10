$(function () {
  // ----- SETTINGS -------
  var labelInputClass = "field-label";
  var $form = $('form.content');


  // ------ DOM CACHE -------
  var $categoryPicker = $('.category-picker');

  var $btnDel = $('<button/>', {"class": "input-remover", type: "button"})
    .button({icons: {"primary": "ui-icon-closethick"}, text: false});


  // ------ DOM METHODS -----
  var addRemoveBtn;

  // for edit page
  addRemoveBtn = function () {

      $(this).append($btnDel.clone());
  };

  function createInput() {
    createInput.inc = createInput.inc || 0;
    createInput.inc += 1;
    // iid: input id
    var iid = "i-id-" + createInput.inc;

    return $('<div/>', {"class": "form-element"})
      .append($("<input/>", {"class": labelInputClass, /*"for": iid,*/ "maxlength": 10, placeholder: "(例:齿轮直径)"}))
      .append($("<input/>", {id: iid, type: 'text'}))
      .append($btnDel.clone())
  }

  function catPickerHide() {
    $categoryPicker.hide();
  }

  function changeFormType() {
    if($(this).val()) $form.attr('enctype', "multipart/form-data");
    // application/x-www-form-urlencoded
    else $form.attr('enctype', null);
  }

  // ------ DOM HANDLERS -----
  var removeInput
    , buildFieldName
    , addMore, showMore
    , onCatBtnClicked
    , onCatSelected
    , goBack

  removeInput = function () {
    $(this).parent().remove();
  };

  goBack = function () {
    history.back(1);
  };



  // TODO: there are quite a lot of customization to do here:
  buildFieldName = function (e) {
    var $this = $(this)
      , val = $this.val()
      , $field = $this.next();

    $field.prop('name', val ? "product[extra][" + val + "]" : null)
      .attr('required', val ? "" : null);
    if(!val) $field.valid();
  };
  showMore = function () {
    $(this).children('.ui-icon').toggleClass("ui-icon-plus ui-icon-minus");
    $('.more-info').toggle();
  };
  addMore = function () {
    $('.added-info').first().append(createInput());
  };

  onCatBtnClicked = function (e) {
    // lazy binding:
    $categoryPicker.show();
    e.stopPropagation();
    $('html').one('click', catPickerHide);
    $(document).one('keyup', function(e) {
      if (e.keyCode == 27) { catPickerHide(); }   // esc
    });
  };

   onCatSelected = function (e) {
     var $target = $(e.target)
       , $anchor
       , cid
     if ($target.hasClass('lvl3')) $anchor = $target.find('a');
     else if ($target.parent().hasClass('lvl3')) $anchor = $target;
     if ($anchor) {

       var href = $anchor.attr('href');
       cid = href.slice(href.indexOf("=") + 1);
       // this is the cat picker ( the menu )
       $(this).siblings('.selected-cat').text($anchor.text())
         .siblings('[type=hidden]').val(cid);
       catPickerHide();
     }

     e.stopPropagation();
     return false;
   };




  // ------- DOM INIT AND BINDING -----

  // ---- BUTTONS ----
  $('button', '.control').add('.select-category').button();

  $('.show-more').button({
    icons: {secondary: "ui-icon-plus"}
  })
    .click(showMore);

  $('.add-more').click(addMore);
  $('.added-info')

    .on('click', '.input-remover', removeInput)
    .find('.form-element').not(':has(button)').each(addRemoveBtn);

  $('.cancel').click(goBack);

  //--- ON-THE-FLY INPUTS ---
  $form
    .on('focusout', '.' + labelInputClass, buildFieldName)
    .on('keyup', '.' + labelInputClass, buildFieldName)

  //--- CATEGORY PICKER ---
  $('.select-category').on('click', onCatBtnClicked);
  $categoryPicker.on('click', onCatSelected);


  //--- UPLOADER ----
  $('#img-upload').on('change', changeFormType);

});
