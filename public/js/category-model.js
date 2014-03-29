// very immature:
// the array could get very large
// and there's no error handling.
// should have used jQuery's inner queue system
var queue = (function () {
  var series = [];
  var dfd = $.Deferred();
  dfd.resolve();

  function push() {
    if(!arguments) return;
    var args = Array.prototype.slice.call(arguments);
    series = series.concat(args);
    args.forEach(function (fn, i) {
      // it helps to waterfall
      dfd = dfd.then(fn).fail(function () {
        // if fail, clear the array, clear dfd
        series = [];
        dfd = $.Deferred();
        dfd.resolve();
        // or we could apply some method to execute next fn (use i to track)
      });
    });
  }
  return {push: push}
})();

/*
 * jQuery Tiny Pub/Sub
 * https://github.com/cowboy/jquery-tiny-pubsub
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

(function($) {

  var o = $({});

  $.subscribe = function() {
    o.on.apply(o, arguments);
  };

  $.unsubscribe = function() {
    o.off.apply(o, arguments);
  };

  $.publish = function() {
    o.trigger.apply(o, arguments);
  };

}(jQuery));








var catModel = (function () {
  var nodes = {};
  var tree = {};
  var urlCreate = '/manage/category'
    , urlRemove = '/manage/category'
    , urlUpdate = '/manage/category/'


  function init() {

    try{
      $.extend( tree, $.parseJSON($('#tree-data').text()));
    }catch(e){
    }
    if(!$.isEmptyObject(tree)) _treeToNodes(tree);
  }


  function _treeToNodes(tree) {
    var _id = tree._id;
    var children = tree.children;
    var orders;
    nodes[_id] = nodes[_id] || tree;
    if($.isArray(children) && children.length) {
      orders = [-1];
      children.forEach(function (child) {
        if(child.order !== undefined) orders.push(child.order);
        _treeToNodes(child);
      });
    }
    nodes[_id].currentOrder = orders ? Math.max.apply(null, orders) : -1;
  }

  // node's currentOrder is its new child's order,
  // while order belongs to itself.
  function _setCurrentOrder(node) {

    if(typeof node === 'string') node = nodes[node];
    var currentOrder = node.currentOrder
      , children = node.children
      , orders

    if($.isArray(children) && children.length){
      orders = [-1];
      $.each(children, function (i, child) {
        if(child.order !== undefined) orders.push(child.order);
      });
    }
    node.currentOrder = orders ? Math.max.apply(null, orders) : -1;

    return currentOrder;
  }


  function _setOrder(node) {
    var parent = nodes[node.parent];
    node.order = parent.currentOrder + 1;
  }


  function add(node, callback) {
    _setOrder(node);
    queue.push(function () {
      return $.ajax({
        url: urlCreate,
        method: 'post',
        data: {category: node}
      })
        .done(function (data) {
          var cat = data['category'];
          _add(cat);
          $.publish('folderadded', [cat]);
        })
        .done(callback)
    });
  }

  function rename(_id, name) {
    queue.push(function () {
      return $.ajax({
        data: {
          category: {name: name, save: 'a string'},
          "_method": "put"
        },
        method: 'post',
        url: urlUpdate + _id
      }).done(function (data) {
          var cat = data.category;
          _update(cat);
          $.publish('folderrenamed.gf', [cat]);
      })
    });
  }

  function _update(node) {
    var original = get(node._id);
    $.extend(original, node);
  }

  function _add(node) {
    var parent = nodes[node.parent];
    nodes[node._id] = node;

    parent.children = parent.children  || [];
    parent.children.push(node);

    parent.currentOrder ++;
    _setCurrentOrder(node);
  }

  function _remove(node, isSub) {

    var children = node.children
      , parent = get(node.parent)

    var idx;
    if($.isArray(children) && children.length) {
      $.each(children, function (i, child) {
        _remove(child, true);
      });
      // maybe not necessary: ( we'll splice entire node out of his big sibling-array)
      delete node.children;
    }

    delete nodes[node._id];
    if(!isSub) {
      idx = $.inArray(node, parent.children);
      if(~idx) parent.children.splice(idx, 1);
    }
  }

  /**
   *
   * @param _id of CRUD, only removed event's param is plain id
   * @param callback
   */
  function remove(_id, callback) {
    queue.push(function () {
      return $.ajax({
        url: urlRemove + '/' + _id,
        method: 'post',
        data: {_method: 'delete'}
      })
        .done(function (data) {
          // if remote remove fail, success: false would return, we can use it to test
          // recursively remove sub folders:
          _remove(get(_id));

          // (the same as passing [_id])
          $.publish('folderremoved', _id );
        })
        .done(callback)
    });
  }


  function getChildren(_id) {
    var node = nodes[_id];
    return node && node.children;
  }

  function get(_id) {
    return nodes[_id];
  }

  function set(node) {
    var _id = node._id;
    var parent = get[node.parent];
    nodes[_id] = node;
    // TODO: add sort
    parent.children.push(node);
  }

  function hasChild(_id) {
    var node = nodes[_id];
    return $.isArray(node.children) && node.children.length;
  }
  return {
    init: init,
    add: add,
    remove: remove,
    rename: rename,
    get: get,
    set: set,
    getChildren: getChildren,
    hasChild: hasChild,
    nodes: nodes,
    tree: tree,
  }
})( );




