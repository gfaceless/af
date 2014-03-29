var a = $({});

a.queue('hey', [
  function (next) {
    setTimeout(function () {
        console.log(1);
        next();
      },
      1000
    );
  } ,
  function (next) {
    setTimeout(function () {
      console.log(2);
      next();
    }, 1000);
  },
  function (next) {
    setTimeout(function () {
      console.log(3);
      next();
    }, 1000);
  }
]).dequeue('hey')
var p = a.promise('hey');
p.progress(function (a, b, c) {
  console.log(a, b, c);
}).done(function () {
    console.log('done');
  });