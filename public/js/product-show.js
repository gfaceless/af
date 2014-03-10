$(function () {
  $('input[type=submit]', 'form.delete')
    .click(function () {
      if(!confirm('确定要删除么')) return false;
    });
});

