YUI({
  combine: true,
  comboBase: '/yui3?',
  root:'3.11.0/build/'
}).use('node', 'panel', 'paginator', 'event-hover', 'gallery-timer', function (Y) {
  var mainSlides = Y.one('#main-slides'),
    slides = mainSlides.all('.slides li'),
    controls = mainSlides.all('.controls li'),
    selectedClass = 'active',
    pg = new Y.Paginator({
      itemsPerPage: 1,
      totalItems: slides.size()
    })
    , duration = 4000;


  pg.after('pageChange', function (e) {
    var page = e.newVal;

    // decrement page since nodeLists are 0 based and
    // paginator is 1 based
    page--;

    // clear anything active
    slides.removeClass(selectedClass);
    controls.removeClass(selectedClass);

    // make the new item active
    slides.item(page).addClass(selectedClass);
    controls.item(page).addClass(selectedClass);
  });


  // when we click the control links we want to go to that slide
  mainSlides.delegate('click', function (e) {
    e.preventDefault();
    var control = e.currentTarget;

    // if it's already active, do nothing
    if (control.ancestor('li').hasClass(selectedClass)) {
      return;
    }

    pg.set('page', parseInt(control.getHTML(), 10));
  }, '.controls a');


  // create a timer to go to the next slide automatically
  // we use timer to obtain a pause/resume relationship
  var autoPlay = new Y.Timer({
    length: duration,
    repeatCount: 0});

  autoPlay.after('timer', function (e) {
    if (pg.hasNextPage()) {
      pg.nextPage();
    } else {
      pg.set('page', 1);
    }
  });

  // start the autoPlay timer
  autoPlay.start();


  // we want to pause when we mouse over the slide show
  // and resume when we mouse out
  mainSlides.on('hover', function (e) {
    autoPlay.pause()
  }, function (e) {
    autoPlay.resume()
  });

});