$(function () {
  $('.categoriesHd').click(function () {
    $(this).next('.categories').toggle();
  });


  $('.categories').on('mouseenter mouseleave', '>dd', function (e) {
    $(this).prev('dt').toggleClass('highlight');
  });

});