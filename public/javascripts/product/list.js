Y = YUI({
  combine: true,
  comboBase: '/yui3?',

  root:'3.11.0/build/'
}).use('node', function (Y) {
    var hd = Y.one('.categoriesHd')
      , bd = Y.one('.categories');
    hd.on('click', function (e) {
      if(bd.hasClass('expanded')) {
        bd.removeClass('expanded');
        console.log('removed')
      } else {
        bd.addClass('expanded');
      }
    })

  });