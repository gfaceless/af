// dependency: jquery-timer
// TODO: HAVE PLENTY OF BUGS (MAINLY TIMER CONFLICT), RESOLVE THOSE WHEN YOU CAN!
$.widget('gf.slideshow', {
  options: {
    duration: 5000,
    "slideContainerClass": 'slides',
    "controlContainerClass": "controls",
    active: 0,
    activeClass: 'active'

  },
  _create: function () {
    this.animating = false;
    this.slides = this.element.find('.' + this.options.slideContainerClass).children();
    this.total = this.slides.length;
    // TODO: we could dynamically and automatically generate those control items.
    this.controls = this.element.find('.' + this.options.controlContainerClass).children();
    var that = this;
    this.timer = $.timer(function () {
      if(that.animating) return;
      var old = that.options.active;
      var active = ++that.options.active;
      if(active == that.total ) active = 0;
      that.doSlide(old, active);

    }, this.options.duration, true);



    this._on({
      // TODO: make it more generic, use options.controlClass instead
      'click li:has(a)': this._onclick,
      'mouseenter': this.pause,
      'mouseleave': this.resume
    })

  },
  _onclick: function(e) {
    var newActive = this.controls.index(e.currentTarget)
      , oldActive = this.options.active;
    if(newActive === oldActive) return;
    // should finish existing animation immediately, as well as reset timer
    this.timer.reset();
    this.doSlide(oldActive, newActive)
  },
  doSlide: function (oldActive, newActive) {
    var that = this;
    this.animating = true;
    this.options.active = newActive;
    this.slides.add(this.controls).filter(function (i) {
      return ~$.inArray($(this).siblings().addBack().index(this), [oldActive, newActive])
    }).toggleClass(this.options.activeClass, 1000, function () {
        that.animating = false;
      });
  },

  pause: function () {
    this.timer.pause();
  },
  resume: function(){
    this.timer.play();
  }


});

$(function () {
  // consider do it after the first image loaded
  $("#main-slideshow").slideshow();
});
