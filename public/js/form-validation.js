$(function () {
  var chineseMsg = {
    required: "必填",
    minlength: $.validator.format("请输入不少于{0}个字"),
    maxlength: $.validator.format("请输入不多于{0}个字"),
    rangelength: $.validator.format("请输入{0}-{1}个字"),
  };

  $.extend($.validator.messages , chineseMsg);
  var options;
  try {
    options = JSON.parse($('#val-options').text());
  } catch(e){}
  options = $.extend(options || {}, {});
  $('form.content').validate(options);

  // for password only:
  // TODO: delete following, use name instead (after strengthening back-end name-filter)
  var $repw = $("#re-password");
  if($repw.length) {
    $repw.rules('add', {
      required: true,
      equalTo: "#password",
      messages: {
        equalTo: "密码不匹配"
      }
    });
  }

});