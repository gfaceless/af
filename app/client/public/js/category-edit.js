/*var Modal = (function () {

  // here we cache
  var $modal;

  function ctor(options) {
    if(!this instanceof Modal) return new Modal(options);
    var defaults = {type: 'save'};
    options = $.extend(defaults, options);
    // TODO: make it lazy loading
    init.call(this, options);
  }

  function init(options) {
    var body = options.body
      , title = options.title
      , data = options.data || {}
      , onPop = options.onPop
      , onSave = options.onSave
      , $myModal
      , modal
    $modal = $modal || $('#modal-save');
    if(!$modal) {
      // we can have our own modal html snippet here, for dynamic generation:
    }
    $myModal = this.$modal = $modal.clone();
    this.data = data;
    if(body) {
      $myModal.find('.modal-body').append(
        typeof body == 'function' ? body() : body
      )
    }
    if(title) $myModal.find('.modal-title').html(options.title);
    this.pop = function () {
      $myModal.modal('show');
      if(onPop) onPop.apply(this, arguments);
    };
    this.save = function () {
      $myModal.modal('hide');
      if(onSave) onSave.apply(this, arguments);
    };
  }
  var proto = {
    constructor: ctor,
    on: function (){
      var $modal = this.$modal;
      $modal.on.apply($modal, arguments);
    },
    trigger: function (){
      var $modal = this.$modal;
      $modal.trigger.apply($modal, arguments);
    }
  }

  ctor.prototype = proto;
  return ctor;
})();*/


$(function () {

  var modal, left, right, meta, nav;


  //----- LEFT PANEL ------

  left = (function () {
    var $container = $('#tree-view');

    function init() {
      var tree = catModel.tree;
      var nodes = catModel.nodes;

      $container.append(buildDomTree(tree, true));
      _bind();
      _subscribe();
    }


    function _bind() {
      $container.on('click', '.expand', function () {

        $(this)
          .find('.glyphicon')
          .toggleClass('glyphicon-plus')
          .toggleClass('glyphicon-minus')
          .end()
          .nextAll('ul').toggle()
          .end()
        /*.nextAll('.select').find('.glyphicon')
         .toggleClass('glyphicon-folder-open')
         .toggleClass('glyphicon-folder-close')*/

      });

      var prev;
      $container.on('click', '.select', function () {
        if(prev && this === prev) return;
        prev = this;
        // should i pass an entire object instead of an _id?
        $.publish('folderselected.gf', [$(this).parent().data('_id')]);
      });

    }

    function _subscribe() {

      $.subscribe('folderadded.gf', function (e, node) {
        var $li = _findLi(node.parent);
        _buildChild($li, node);
      });

      $.subscribe('folderrenamed.gf', function (e, node) {
        var $li = _findLi(node._id);
        //TODO: such awkward selector:
        $li.find('.select span:last').text(node.name);
      })

      // only removed event's param is plain id
      $.subscribe('folderremoved.gf', function (e, _id) {
        var $li = _findLi(_id);
        $li.remove();
      })

      var $prev;
      $.subscribe('folderselected.gf', function (e, _id) {
        var $li = _findLi(_id);

        $prev = $prev || $li;
        $prev.add($li)
          .children('.select').toggleClass('selected')
            .children('.glyphicon').toggleClass('glyphicon-folder-open');
        $prev = $li;
      });
    }
    
    function _buildChild ($parent, childData){
      // TODO: merge with buildTree
      var $ul = $parent.children('ul');
      var $li;
      if(!$ul.length) {
        $parent
          .append($ul = $('<ul/>'))
          .prepend(
            $('<a/>', {"class": "expand"})
              .append(  $("<span/>", {"class": 'glyphicon glyphicon-minus'}) )
          )
      }
      $li = $("<li/>", {"class": "folder"})
        .append(
          // TODO: use jQuery fragment:
          $('<a/>', {"class": "select"}).append(
            $("<span/>", {"class": 'glyphicon glyphicon-folder-close'}),
            $('<span/>', {text: childData.name })
          )
        )
        .data("_id", childData._id)
      $ul.append($li)
    }

    function _findLi (_id){
      return $('.folder', $container).filter(function () {
        return $(this).data('_id') === _id;
      });
    }
    
    
    function buildDomTree (tree, isRoot){

      var $dom = $( isRoot ? "<div/>" : "<li/>", {"class": "folder"});
      var children = tree.children
        , hasChildren = $.isArray(children) && children.length

      $dom.append(
        hasChildren ?
        $('<a/>', {"class": "expand"}).append(  $("<span/>", {"class": 'glyphicon glyphicon-minus'}) ) : null,
        $('<a/>', {"class": "select"}).append(
          $("<span/>", {"class": 'glyphicon glyphicon-folder-close'}),
          $('<span/>', {text: tree.name })
        )
      ).data('_id', tree._id)


      if(hasChildren){
        var $ul = $('<ul>');
        children.forEach(function (subtree) {
          $ul.append(buildDomTree(subtree));
        });
        $dom.append($ul);
      }
      return $dom;
    }

    return {
      init: init,
      // refresh: refresh
    }
  })();






  //--- RIGHT PANEL -----
  right = (function () {

    var selectedParent
      , selectedChild

    var $right = $('#details-view')
      , $ul = $('ul', '#payload')
      , $control = $('.control', $right)

    var $modal;

    function init() {
      _bind();
      _subscribe();
    }

    function _bind() {

      $ul.on('click', 'li', function () {
        var $this = $(this);
        $this.siblings().removeClass('selected').end().addClass('selected');
        selectedChild = $(this).data("_id");
      })
        .on('dblclick', 'li', function () {
          // maybe we should normalize that every passing param is node instead of id
          $.publish('folderselected.gf', [$(this).data('_id')]);
      });


      $right.find('.add').on('click', function () {
        // add input
        if(!selectedParent) return alert('请先选中父文件夹');
        var $input;
        // TODO: use _buildLi
        var $li = $('<li/>',{"class":"form-inline"}).append(
          $('<span/>', {"class": "glyphicon glyphicon-folder-close"}),
          $('<span/>', {"class": "name help-block invisible", text: "新分类"}),
          $input = $('<input/>', {"class": "form-control", value: "新分类"})

        );
        $ul.append($li);
        $input.focus();
        $ul.on('focusout', 'input', function handler(e) {
          var $this = $(this)
            , value = $this.val()
            , $li = $this.parent()
            , domId = generateDomId()

          $ul.off('focusout');
          _toggleInputSpan($li);
          $li.data('cid', domId);
          catModel.add({name: value, parent: selectedParent, cid: domId});
          /*// logic would be better if figure out a way to use $.subscribe instead of using callback
          // ( which couples things )
          catModel.add({name: value, parent: selectedParent}, $.proxy(function (data){
            var cat = data.category;
            this.data('_id', cat._id);
          }, $this.parent()) );*/
        });

      });

      $control.find('.batch-add').on('click', function () {
        if(!selectedParent) return alert('请先选中父文件夹');
        _initModal();
        $modal.trigger('pop', [selectedParent]);
      });


      $control.find('.rename').on('click', function () {
        if(!selectedChild) return alert('未选中');
        var $btn = $(this).addClass('disabled');
        var $li = _findLi(selectedChild)

        _toggleInputSpan($li);
        $li.children('input').focus();
        $ul.on('focusout', 'input', function handler(e) {
          var $this = $(this);
          var value = $this.val();
          $ul.off('focusout');
          _toggleInputSpan($this.parent());
          $btn.removeClass('disabled');
          catModel.rename(selectedChild, value);
        });

      });

      // for both add and rename
      $ul.on('keypress', 'input', function (e) {
        if(e.which===13) $(this).trigger('blur');
      });

      $right.find('.remove').on('click', function () {
        if(!selectedChild) return alert('未选中');
        var sure = true;
        if(catModel.hasChild(selectedChild)){
          sure = confirm('有子文件夹，确认一起删除么？');
        }

        var $ctx = _findLi(selectedChild);
        sure && catModel.remove(selectedChild, $.proxy(function (data) {
          // data is just a success info
          // of course we could as well do it in $.subscribe:
          this.remove();
          selectedChild = null;
        }, $ctx));
      });

      $control.find('.up').on('click', function () {
        var _id = catModel.get(selectedParent).parent;
        if(_id) $.publish('folderselected.gf', [_id]);
        return false;
      });

      $control.find('.refresh').on('click', function () {
        // temporarily just refresh server data
        $.post('/manage/category/refresh');
      });

    }

    function _subscribe() {
      $.subscribe('folderselected.gf', function (e, _id) {
        var children = catModel.get(_id).children;
        $ul.empty();
        selectedParent = _id;
        selectedChild = null;

        if($.isArray(children)) {
          $.each(children, function (i, child) {
            $ul.append(_buildLi(child));
          });
        }
      });

      $.subscribe('folderadded.gf', function (e, node) {
        // single:
        var cid = node.cid;
        // in case users quickly switched to other folder:
        if(!selectedParent || node.parent !== selectedParent) return;
        if(cid){
          var $li = $ul.find('li').filter(function () {
            return cid === $(this).data('cid');
          });
          $li.data('_id', node._id);
        }else{
          // batch add
          $ul.append(_buildLi(node));
        }
      });


      //not necessary, the sole reason these are here is that i want to test mongoose `trim`
      $.subscribe('folderrenamed.gf', function (e, node) {
        var $li = _findLi(node._id);

        $li.children('.name').text(node.name);
      })
    }

    function _initModal() {

      var $textarea

      if(_initModal.initiated) return;
      _initModal.initiated = true;

      $modal = $('#modal-save').clone();
      initDom();
      bind();

      function initDom() {
        $modal.find('.modal-body').append(
          $textarea = $('<textarea/>', {
            rows: 10, cols: 80,
            placeholder: '批量新建，用分隔符 | 将每个元素分开，每个元素两侧的空格会自动清除'
          })
        );
        $modal.find('.modal-title').html('批量新建');
      }

      function bind() {
        $modal.on('pop', function (e, pid) {
          $modal.modal('show');
          $textarea.select().focus();
          $modal.data('pid', pid);
        })
        $modal.find('.save').click(function () {
          $modal.modal('hide');

          var val = $textarea.val()
            , pid = $modal.data('pid')
            , arr;
          // $.map removes item if it is undefined/null (unlike official map or lodash)
          arr = $.map(val.split('|'), function (item) {
            if (item) {
              return {name: $.trim(item), parent: pid};
            }
          });
          catModel.add(arr);
          $textarea.val('');
        });
      }

    }


    function _buildLi( node ) {
      // TODO: use clone()
      return $('<li/>', {title: node.name}).append(
        $('<span/>', {"class": "glyphicon glyphicon-folder-close"}),
        $('<span/>', {"class": "name help-block", text: node.name })
      ).data("_id", node._id)
    }


    function _toggleInputSpan ($li) {
      var $span = $li.children('.name')
        , $input = $li.children('input')

      if(!$input.length) {
        $input = $('<input/>', {"class": "form-control invisible", value: $span.text()}).appendTo($li);
      }


      // input to span:
      var i2s = $span.hasClass('invisible');

      $span.add($input).toggleClass('invisible');

      if(i2s) $span.text( $input.val() );
      else $input.val($span.text());
    }

    function _findLi(_id) {
      return $ul.find('li').filter(function () {
        return _id === $(this).data('_id');
      });
    }



    return {
      init: init
    }


  })();

  meta = (function () {
    var $meta = $('#metadata')
      , $breadcrumb = $('.breadcrumb', $meta)
      , $info = $('.info', $meta)

    function init() {
      _bind();
      _subscribe();
    }

    function _bind() {

      $(document).on('ajaxError', function (err) {
        $info.addClass("bg-danger").text('操作失败').fadeIn().delay(300).fadeOut();
        console.log(err);
      });

      $meta.on('click', 'li a', function () {
        $.publish('folderselected', $(this).attr('href').slice(1));

        return false;
      });
    }

    function _subscribe() {
      $.subscribe('folderselected.gf', function (e, _id) {

        $breadcrumb.html(_buildBreadcrumb(_id));
      });
    }

    function _buildBreadcrumb(_id) {
      var node = catModel.get(_id)
        , parents = $.merge([], node.parents);

      var $dom = $.map(parents.reverse(), function (parent) {
        return $('<li/>').append($('<a/>', { text: catModel.get(parent).name, href: "#" + parent}))
      })

      $dom.push(
        $('<li/>', {"class": "active"}).text( node.name)
      );

      return $dom;




    }


    return {init: init}
  })();


  nav = (function () {
    var $control = $('.control')
      , $back = $('.back', $control)
      , $forward = $('.forward', $control)


    var history = []
      , current = 0;


    function init() {
      _bind();
      _subscribe()
    }



    function _subscribe() {
      $.subscribe('folderselected.gf', function (e, _id, skipHistory) {

        if(skipHistory) {
          current += (skipHistory === 'back' ? -1 : 1);
        } else {
          history.splice(current + 1);
          history.push(_id);
          if(history.length > 100){}
          current = history.length - 1;
        }

        toggleDisable();
      })
    }
    function _bind() {
      $back.on('click', function () {

        var len = history.length;
        if(len >=2 && current > 0) {
          $.publish('folderselected.gf', [ history[ current - 1 ], 'back']);
        }
      });

      $forward.on('click', function () {
        var len = history.length;
        if( len >=2 && current+1 !== len) {
          $.publish('folderselected.gf', [ history[ current + 1 ], 'forward']);
        }
      });

    }
    function toggleDisable() {
      var len = history.length;

      if(len <= 1) return _disable();
      if(current+1 === len)  {
        _disable($forward);
        _enable($back);
        return;
      }
      if(current === 0) {
        _disable($back);
        _enable($forward);
        return;
      }
      _enable();
    }

    function _disable( $nav ) {
      ( $nav || $back.add($forward) )
        .addClass('disabled');
    }

    function _enable($nav) {
      ( $nav || $back.add($forward) )
        .removeClass('disabled');
    }

    return {
      init: init,
      disable: toggleDisable
    }
  })();

  /*//---- MODAL -----
  //TODO: we'll make modal less generic (exists inside each module, instead of global)
  modal = (function () {
    var $modal
      , $textarea
    var initiated;
    function init() {
      if(initiated) return;
      initiated = true;
      $modal = $('#modal-save').clone();
      if(!$modal.length) throw 'no #modal-save';

      $modal.find('.modal-body').append(
        $textarea = $('<textarea/>', {})
      );
      _bind();
    }

    function _bind() {
      $modal.find('.save').click(function () {
        console.log($textarea.val());
        $modal.modal('hide')
      });

    }

    // lazy init
    function pop() {
      init();
      $modal.modal('show');
      $textarea.focus().empty();
    }

    return {
      pop: pop,
      init: init
    }
  })();*/




  //---- HELPER -----
  function generateDomId() {
    generateDomId.count = generateDomId.count || 0;
    // start from 1:
    // we can add a prefix here:
    return ++generateDomId.count;
  }





  catModel.init();
  left.init();
  right.init();
  meta.init();
  nav.init();



  $.publish('folderselected.gf', catModel.tree._id);


});
