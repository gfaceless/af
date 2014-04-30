var $ = require('jquery');

require('../lib/form-validation');
var $password_again = $("#re-password");
if ($password_again.length) {
    $password_again.rules('add', {
        required: true,
        equalTo: "#password",
        messages: {
            equalTo: "密码不匹配"
        },
        "rangelength": [6,20]
    });
}