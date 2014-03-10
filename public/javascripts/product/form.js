Y = YUI({
  combine: true,
  comboBase: '/yui3?',
  root:'3.11.0/build/'
}).use('node', 'event-outside', function (Y) {
    var form = Y.one('form.main')
      , submit = form.one('input[type="submit"]')
      , fileBtn = Y.one('#upload')
      , categBtn = Y.one('#categ-btn')
      , resultDisplayer = categBtn.next('span')
      , categPicker = Y.one('#categ-picker')
      , moreBtn = Y.one('#more')
      , categ = !!categBtn;


    Y.one('#add-input').on('click', function (e) {
      e.preventDefault();
      var count = form.getData('count') || 1;
      var p = Y.Node.create(
        Y.Lang.sub('<p><label class="extra"><input value="新项{id}" type="text">: </label>' +
          '<input type="text"><a href="#">删除</a>' +
          '</p>', {id: count})
      );
      form.setData('count', ++count);
      form.insertBefore(p, submit);
      // TODO: see if it could be made DELEGATE
      p.one('.extra input').on('keyup', function (e) {
        p.one('>input').setAttribute('name', 'product[extra[' + this.get('value') + ']');
      })
    });

    form.delegate('click', function (e) {
      e.preventDefault();
      // does remove(true) recursively purge the subtree?
      this.ancestor().remove().destroy(true);

    }, 'p a');

    if(moreBtn) {
      moreBtn.on('click', function (e) {
        e.preventDefault();
        var hidden = this.getData('hidden');
        console.log(hidden);
        hidden = typeof hidden === 'undefined' ? true : hidden;

        Y.one('#optional')[hidden ? 'removeClass' : 'addClass']('hidden');
        this.one('span').set('text', hidden ? '-' : '+');
        this.setData('hidden', !hidden);
      });
    }

    /*form.one('#goback-btn').on('click', function (e) {
      history.back();
    })*/

    fileBtn.on('change', function (e) {
      //TODO: now very fundamental, needs x-browser and be stronger
      var createObjectURL = window.URL && window.URL.createObjectURL;
      if (createObjectURL) {
        var img = this.next('img');
        if (!img) {
          this.insert(Y.Node.create('<br><img>'), 'after');
          img = this.next('img');
        }

        img.set('src', createObjectURL(this.getDOMNode().files[0]));

      }
    });

    categBtn.on('click', function (e) {

      if (!categPicker.getData('display')) {
        categPicker.setStyle('display', 'block')
          .setData('display', true);
        setTimeout(function () {
          categPicker.on('clickoutside', function () {
            this.hide().setData('display', false).detachAll('clickoutside');
          })
        }, 0)


      } else {
        categPicker.setData('display', false)
          .hide().detachAll('clickoutside');

      }

    })

    categPicker.delegate('click', function (e){
      e.preventDefault();
      if(!this.ancestor().hasClass('lvl3') ) {
        alert('只支持第三级目录，1、2级暂不支持');
        return;
      }

      var href = this.get('href')
        , str = 'category='
        , id = href.slice(href.indexOf(str) + str.length);
      console.log(id);
      categPicker.next('input[type=hidden]').set('value', id);
      resultDisplayer.setHTML('已选择: ' + this.get('text'));
      categPicker.setData('display', false)
        .hide().detachAll('clickoutside');

    }, 'a')

    form.on('submit', function(e) {
      e.preventDefault();
      var categ = this.one('input[type=hidden]');
      if(!categ.get('value')) {
        categ.remove();
      }
      this.submit();
    })
  });