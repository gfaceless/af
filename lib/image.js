var path = require('path')
  , join = path.join
  , url = require('url')
  , fs = require('fs')
  , gm = require('gm').subClass({ imageMagick: true })

// ------ SETTINGS ------
var
    publicSysFolder = path.resolve(__dirname, '../public/')
  , imgFolder = 'img/'
  , imgSysFolder = path.resolve(publicSysFolder, imgFolder)
  , resizeWidth = 500
  , resizeHeight = 500
  , thumbWidth = 200
  , thumbHeight = 200
  , thumbQuality = 90;





  /*var gs = new mongodb.GridStore(dbConnector, 'test.jpg', "w", {
   "contentType": image.type,
   "metadata":{
   "author":"Daniel"
   }*/
  /*,
   "chunk_size":1024 * 4*/
  /*
   });

   var storeImage = function (err, gs){
   if(err) throw err;
   console.log(gs);
   };

   // Q: should gs be opened first? gs.open(callback);
   gs.writeFile( image.path, storeImage );*/



exports.publishImg = function publishImg(img, subFolder, cb) {
  //TODO: remove the original uploaded file after a fixed amount of time
  if(!isImage(img)) return cb(new Error('not right image type'));
  var oldPath = img.path
    , baseName = path.basename(oldPath)
    , thumbName = 'thumb-' + baseName

  //TODO: consider changing basename to pid(excluding the random part)
  // NOTE: subFolder MUST exist
  var imgPath = join(imgSysFolder, subFolder, baseName)
    , thumbPath = join(imgSysFolder, subFolder, thumbName);

  subFolder = subFolder.replace(/\/$/, '') + '/';
  imgFolder = imgFolder.replace(/\/$/, '') + '/';

  console.log();
  var imgUrl = url.resolve(imgFolder+subFolder, baseName)
    , thumbUrl = url.resolve(imgFolder+subFolder, thumbName)

  resize(oldPath, imgPath, function (err) {
    makeThumb(imgPath, thumbPath, function (err){
      cb(err, {imgUrl: imgUrl, thumbUrl: thumbUrl});
    })
  });
}


exports.removeImg = function removeImg(imgUrl, cb) {
  var sysPath = path.resolve(publicSysFolder, imgUrl);

  fs.unlink(sysPath, cb);
};




function makeThumb(imgPath, thumbPath, cb) {
  /*gm(imgPath)
    .thumbnail(thumbWidth, thumbHeight + '^')
    .gravity('center')
    .extent(thumbWidth, thumbHeight)
    .write(thumbPath, cb);*/
  gm(imgPath)
    .thumb(thumbWidth, thumbHeight, thumbPath, thumbQuality, cb)
}

function resize(oldPath, newPath, cb) {
  gm(oldPath)
    .resize(resizeWidth, resizeHeight)
    .write(newPath, cb);
}


function isImage(image) {
  return ~image.type.indexOf('image/') && image.size;
}

