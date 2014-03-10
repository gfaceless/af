YUI({
  combine: true,
  comboBase: '/yui3?',
  root: '3.11.0/build/'
}).use('node','event-valuechange', function (Y){

    var nameValArr = [ function (str){
      return !(str.length > 15 || str.length < 2);
    }, '长度限制在2-15个字节'];

    var pwValArr = [
      {
        validator: function(pw) {
          return pw.length >= 6;
        },
        msg: '密码至少6位'
      },
      {
        validator: function(pw) {
          return pw.length <= 18;
        },
        msg: '密码最多18位'
      }
    ];

    var rePwValArr = [{
      validator: function (rpw, pw) {
        return rpw === pw;
      },
      msg: '两次输入需一致',
      // if validator.length >= 2, relatedTarget is a must:
      relatedTarget:Y.one('#password'),
//      events: ['focus', 'blur']
    }];

    var obj = {
      "name": nameValArr,
      "password": pwValArr,
      "re-password": rePwValArr
    };



    function generateValidationFn (valArr) {
      var DEFAULT_EVENTS = ['valuechange', 'focus', 'blur'];

      var fns = []
        , fn
        , validation = {}
        , validator
        , msg
        , relatedTarget
        , events

      if (typeof valArr[0] === 'object') {

        valArr.forEach(function (subValidator) {
          fns.push(generateValidationFn(subValidator));
        })
        fn = function () {
          var args = arguments;
          // TODO: make it more intuitive: (check if all returned are true)
          var results = 0;
          fns.forEach(function(fn){
            results = results + ( fn.apply(null, args) ? 0 : 1);
          });
          return !results;
        }
        // TODO: add support for multiple different events:
        fn.events = fns[0].events;
        return fn;
      }
      // TODO: get rid of array being params
      if(Y.Lang.isArray(valArr)) {
        validation.validator = valArr[0];
        validation.msg = valArr[1];
      } else {
        validation = valArr;
      }
      validator = validation.validator;
      msg = validation.msg;
      relatedTarget = validation.relatedTarget;
      events = validation.events;

      fn = function (node) {
        var passed = (validator.length == 2) ?
          validator.call(null, node.get('value'), relatedTarget.get('value'))
          : validator.call(null, node.get('value'));
        // TODO: setHTML should be more specific, not in a whole manner, but add/cut str
        if(!passed) {
          node.errEl.removeClass('correct').addClass('error').setHTML(msg);
          return false;
        }
        if(node.errEl.getHTML() === msg) {
          node.errEl.removeClass('error').addClass('correct').setHTML('');
        }
        return true;
      }
      fn.events = Y.Lang.isArray(events) ? events :
        (typeof events === 'string' ? [events] : DEFAULT_EVENTS);
      return fn;

    }

    Y.Object.each(obj, function (validation, key){
      var node = Y.one('#' + key);
      var validate;
      if(node) {
        node.errEl = node.next('span');
        validate = generateValidationFn(validation);

        node.setData('validate', validate);
        // bind node with events
        node.on(validate.events, function(){
          validate(this);
        })

      }
    })





    Y.one('.main input[type="submit"]').on('click', function (e){
      var test = []
        , passed;
      Y.Object.each(obj, function (validator, key){
        var node = Y.one('#' + key);
        if(node) {
          test.push(node.getData('validate').call(null, node));
        }
      });
      passed = test.every(function (element){return element === true})
      if(!passed) {
        e.preventDefault();
        this.next('span').addClass('error').setHTML('有选项未准备好');
        return;
      }
      this.next('span').removeClass('error').addClass('correct').setHTML('提交中……');

    })

  })