var data = [
  {id: 1, name: 'a', parent: undefined},
  {id: 2, name: 'b', parent: 1},
  {id: 3, name: 'c', parent: 1},
  {id: 4, name: 'd', parent: 2},
  {id: 5, name: 'e', parent: 2},

]


function getRoot() {
  var ret;
  $.each(data, function (i, item) {
    if(item.parent === undefined) {
      ret = item;
      return false;
    }
  })
  return ret;
}

var want = getRoot();

function buildChildren(parent) {
  var ret = [];
  $.each(data, function (i, item) {
    if(item.parent === parent.id) {
      ret.push(item);
    }
  })
  if(ret.length)  parent.children = ret;
  return ret;
}


function buildTree() {


  $.each( buildChildren(want), function (i, item) {
    buildChildren(item)
  })

}


var root = getRoot();