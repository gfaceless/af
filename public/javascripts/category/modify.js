/*note: this script sucks
  don't rely on it
* */

Y = YUI({
  combine: true,
  comboBase: '/yui3?',
  root:'3.11.0/build/'
}).use('node', 'io', 'event', function (Y) {

    var categStr = '<input type="text" value="新类别">'
      , radioStr = '<input type="radio" name="categ-selecter">'
      , delStr = '<button class="delete" tabindex="-1">remove</button>'
      , itemStr = radioStr + categStr + delStr
      , dtStr = '<dt>' + itemStr + '</dt>'
      , inputStr = 'input[type="text"]'

    var form = Y.one('form')
      , btnAdd = Y.one('#add')
      , btnSubmit = Y.one('input[type="submit"]')
      , radioRoot = Y.one('input[type="radio"]') // always get the first? :first-of-type necessary?
      , inputRoot = Y.one('input[type="text"].lvl0')
      , selected = inputRoot

    var urlRoot = '/manage/category'

    if (!inputRoot.get('name')) {
      if(!inputRoot.get('value')) {inputRoot.set('value', '全部种类')}
      create(inputRoot);
    }

    init();

    form.delegate('click', function (e) {

      switch (this.get('tagName').toLowerCase()) {
        case 'input':
          if (this === radioRoot) {
            selected = inputRoot;
            return;
          }
          selected = this.next(inputStr);
          break;
        case 'button':
          e.preventDefault();
          // TODO: make a delete button level, level 3 does not pompt.
          var sure = confirm('此操作在删除本目录的同时，也将删除其子目录(如果有)，确定删除么？');
          if(sure){ remove(this.previous(inputStr)); }
      }
    }, 'button.delete, input[type="radio"]');

    form.delegate('blur', upsert, 'input[type="text"]');

    function upsert(e) {
      var value = this.get('value')
        , parent
        , _id
      if (this.getData('oldValue') !== value) {
        _id = this.get('name');
        parent = this.getData('parent');
        if (!_id) {
          create(this, parent);
        } else {
          update(this);
        }
        this.setData('oldValue', value);
      }
    }


    btnAdd.on('click', function (e) {
      e.preventDefault();

      var dt, dd, dl, input
        , lvl = selected.getData('lvl')

      switch (lvl) {
        case 0:
          dt = Y.Node.create(dtStr);
          input = dt.one(inputStr);
          selected.next('dl').append(dt);
          break;

        case 1:
          dt = selected.ancestor();
          dd = dt.next();
          // the structure is like: dt + dd > dl + dl + dl
          // so the following code generates dd only once:
          if (!dd || dd.get('tagName').toLowerCase() !== 'dd') {
            dd = Y.Node.create('<dd></dd>');
            dt.insert(dd, 'after');
          }

          dl = Y.Node.create('<dl>' + dtStr + '</dl>');
          input = dl.one('>dt>' + inputStr);
          dd.append(dl);
          break;
        case 2:
          dd = Y.Node.create('<dd>' + categStr + delStr + '</dd>');
          input = dd.one(inputStr);
          selected.ancestor('dl').append(dd);
          break;

      }
      input.setData('parent', selected)
        .setData('lvl', lvl + 1)
        .setData('oldValue', input.get('value'));
      create(input, selected);
    });


    function create(self, parent) {
      var data
        , value = self.get('value');
      if (parent) {
        var parentId = parent.get('name');
        if (!parentId) throw 'no parent id??';

        data = 'name=' + value + '&parentId=' + parentId;
      } else {
        console.log('!!!seldom goes here!!!')
        data = 'name=' + value + '&isRoot=true';
      }
      Y.io(urlRoot, {
        method: 'POST',
        data: data,
        on: {
          success: function (id, e) {
            var res = JSON.parse(e.responseText);
            if (res.success) {
              self.set('name', res.doc._id);
              console.log('name has set!', res.doc._id);
            } else {
              console.log('why failed?', res);
            }
          },
          failure: function (id, res) {
            console.log('400 or 500 fail');
          }
        }
      })
    }

    function update(self) {
      var value = self.get('value')
        , _id = self.get('name')
        , url = urlRoot + '/' + _id;
      console.log('going to update! id is: ', _id);
      Y.io(url, {
        method: 'POST',
        data: 'name=' + value + '&_method=PUT',
        on: {
          success: function (id, e) {
            var res = JSON.parse(e.responseText);
            if (res.success) {
              console.log('name has updated!');
            } else {
              console.log('why failed in update?', res);
            }
          },
          failure: function (id, e) {
            var res = JSON.parse(e.responseText);
            console.log(res)
          }
        }
      })
    }


    function remove(self, parent) {

      parent = parent || self.getData('parent');

      var _id = self.get('name')
        , parentId = parent.get('name')
        , data = 'parentId=' + parentId + '&_method=DELETE'
        , url = urlRoot + '/' + _id;

      if (!parentId) throw 'no parent id?? in delete';

      Y.io(url, {
        method: 'POST',
        data: data,
        on: {
          success: function (id, e) {
            var res = JSON.parse(e.responseText);
            if (res.success) {
              self.ancestor().remove(true);
              console.log('successfully removed!')
            } else {
              console.log('delete failed');
            }
          },
          failure: function (id, res) {
            console.log('delete failed! 400/500')
          }
        }
      })
    }

    function init() {

      Y.all('input[type="text"].lvl3').each(function (el) {
        el.setData('parent', el.ancestor('dd').previous('dt').one(inputStr))
          .setData('lvl', 3)
          .setData('oldValue', el.get('value'))
        console.log(el.getDOMNode(), el.get('value'));
      })
      Y.all('input[type="text"].lvl2').each(function (el) {
        el.setData('parent', el.ancestor('dd').previous('dt').one(inputStr))
          .setData('lvl', 2)
          .setData('oldValue', el.get('value'))
        console.log(el.getDOMNode());
      })
      Y.all('input[type="text"].lvl1').each(function (el) {
        el.setData('parent', inputRoot)
          .setData('lvl', 1)
          .setData('oldValue', el.get('value'))
        console.log(el.getDOMNode());
      })
      inputRoot.setData('parent', null)
        .setData('lvl', 0)
        .setData('oldValue', inputRoot.get('value'))
    }


    btnSubmit.on('click', function (e) {
      e.preventDefault();
      Y.io('/manage/categories/refresh', {
        method: 'POST',
        on: {
          success: function () {
            alert('ok');
          }
        }
      });
    });
  });
/*categories.name = categRoot.get('value');

 var data = iterate($dl, categories);
 console.log(data);

 function iterate(parent, data) {
 var children = parent.get('children')
 , tmp = {};
 if (!children.isEmpty()) {

 children.each(function (child, i) {
 var sub = {}
 , input = child.one('>input[type="text"]');

 if(input){
 sub.name = input.get('name');
 sub.value = input.get('value');
 }
 switch (child.get('tagName').toLowerCase()) {
 case 'dt':
 data.children = data.children || [];
 data.children.push(sub);
 tmp = sub;
 break;
 case 'dd':
 //TODO: maybe more generic?
 if(input) {
 tmp.children = tmp.children || [];
 tmp.children.push(sub);
 } else {
 iterate(child, tmp);
 }
 break;
 case 'dl':
 iterate(child, data);
 break;
 default:
 }

 })
 }

 return data;
 }*/

