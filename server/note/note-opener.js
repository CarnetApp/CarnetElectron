var JSZip = require('jszip');
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
const intoStream = require('into-stream');
var textVersion = require("textversionjs");
var getParentFolderFromPath = require("../../utils/file_utils").FileUtils.getParentFolderFromPath
var NoteOpener = function (note) {
  this.note = note;
}

NoteOpener.prototype.getMainTextMetadataAndPreviews = function (callback) {
  var opener = this;
  this.getFullHTML(function (data, zip) {
    if (zip != undefined) {
      opener.getMetadataString(zip, function (metadata) {
        opener.getMediaList(zip, function (previews, media) {
          callback(textVersion(data), metadata != undefined ? JSON.parse(metadata) : undefined, previews, media)

        })
      })
    } else {
      callback(undefined, undefined)

    }
  });
}

NoteOpener.prototype.getMediaList = function (zip, callback) {
  var p = new MediaLister(zip, callback)
  p.start();
}

var MediaLister = function (zip, callback) {
  this.zip = zip;
  this.currentFile = 0;
  this.callback = callback;
  this.data = []
}

MediaLister.prototype.start = function () {
  var extractor = this;
  this.files = [];
  this.media = [];
  this.zip.folder("data").forEach(function (relativePath, file) {

    if (relativePath.startsWith("preview_")) {
      extractor.files.push(file.name)
    } else {
      extractor.media.push(file.name)

    }
  })
  this.callback(this.data, this.media)
}

var PreviewOpener = function (zip, callback) {
  this.zip = zip;
  this.currentFile = 0;
  this.callback = callback;
  this.data = []
}

PreviewOpener.prototype.start = function () {
  var extractor = this;
  this.files = [];
  this.media = [];
  this.zip.folder("data").forEach(function (relativePath, file) {

    if (relativePath.startsWith("preview_")) {
      extractor.files.push(file.name)
    } else {
      extractor.media.push(file.name)

    }
  })
  this.fullRead()
}

PreviewOpener.prototype.fullRead = function () {

  if (this.currentFile >= this.files.length || this.currentFile >= 2) {

    this.callback(this.data, this.media)
    return;
  }
  var filename = this.files[this.currentFile]
  var previewOpener = this;
  var file = this.zip.file(filename);

  if (file != null) {
    file.async('base64').then(function (content) {

      if (content != "") {
        previewOpener.data.push('data:image/jpeg;base64,' + content)

      }
      previewOpener.currentFile++;
      previewOpener.fullRead();
    });
  } else {
    previewOpener.currentFile++;
    previewOpener.fullRead();
  }
}

NoteOpener.prototype.getMetadataString = function (zip, callback) {
  if (zip.file("metadata.json") != null)
    zip.file("metadata.json").async("string").then(callback)
  else {
    callback(undefined)
  }
}

//https://miguelmota.com/bytes/arraybuffer-to-buffer/
var isArrayBufferSupported = (new Buffer(new Uint8Array([1]).buffer)[0] === 1);

var arrayBufferToBuffer = isArrayBufferSupported ? arrayBufferToBufferAsArgument : arrayBufferToBufferCycle;

function arrayBufferToBufferAsArgument(ab) {
  return new Buffer(ab);
}

function arrayBufferToBufferCycle(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
  }
  return buffer;
}
const path = require('path')

NoteOpener.prototype.getMedia= function (media, callback) {
  fs.stat(this.note.path, (err, stat) => {
    if(err){
      callback(undefined, undefined)
      return
    }
    if (stat.isFile()){
      fs.readFile(this.note.path, function (err, data) {
        if (err) {
          callback(undefined, undefined)
          return console.logDebug(err);
        }
    
        if (data.length != 0)
          JSZip.loadAsync(data, {
            base64: true
          }).then(function (zip) {
            zip.file(media).async("arraybuffer").then(function (content) {
              callback(intoStream(content), zip)
            })
          }, function (e) {
            callback(undefined, undefined)
          });
        else callback(undefined, undefined)
      });

    } else {

      var readStream = fs.createReadStream(path.join(this.note.path, media));
      readStream.on('open', function () {
        callback(readStream, undefined)
      });
      readStream.on('error', function(err) {
        callback(undefined, undefined)
      });

      
    }
  })
  
}


NoteOpener.prototype.getFullHTML = function (callback) {
  console.logDebug("this.note.path  " + this.note.path)

  fs.readFile(this.note.path, function (err, data) {
    if (err) {
      console.logDebug("error ")
      callback(undefined, undefined)
      return console.logDebug(err);
    }

    if (data.length != 0)
      JSZip.loadAsync(data, {
        base64: true
      }).then(function (zip) {

        zip.file("index.html").async("string").then(function (content) {

          callback(content, zip)
        })
      }, function (e) {
        callback(undefined, undefined)
      });
    else callback(undefined, undefined)
  });
}

NoteOpener.prototype.extractTo = function (path, callback) {
  var opener = this;
  console.logDebug("extractTo")
  fs.readFile(this.note.path, 'base64', function (err, data) {
    if (!err) {
      var extractor = new Extractor(data, path, opener, callback)
      extractor.start();
    } else callback(true)
  });
}

NoteOpener.prototype.openTo = function (path, callback) {
  var opener = this;
  fs.stat(this.note.path, (err, stat) => {
    if (stat == undefined || stat.isFile()){
      opener.extractTo(path, callback)
    } else {
      opener.copyTo(path, callback)
    }
  })
}

NoteOpener.prototype.copyTo = function (path, callback) {
  fs.copy(this.note.path, path, err => {
    if (err) return callback(true)

    callback(false)

  })
}

NoteOpener.prototype.saveFrom = function (fromPath, modifiedFiles, deletedFiles, callback) {
  var opener = this;
  fs.stat(this.note.path, (err, stat) => {
    if (stat == undefined || stat.isFile()){
      opener.compressFrom(fromPath, callback)
    } else {
      if(modifiedFiles != undefined){
        for (var modifiedFile of modifiedFiles){
          var parent = getParentFolderFromPath(modifiedFile)
          var toDir = path.join(opener.note.path, parent)
          try{
          fs.mkdirSync(toDir)
          } catch(e){

          }
          fs.copySync(path.join(fromPath, modifiedFile), path.join(opener.note.path, modifiedFile))
          
        }
      }
      if(deletedFiles != undefined){
        for (var deletedFile of deletedFiles){          
          fs.deleteSync(path.join(toDir, deletedFile))
          
        }
      }
      callback(false)
    }
  })
}

NoteOpener.prototype.compressFrom = function (path, callback) {
  var comp = new Compressor(path, this.note.path, callback);
  comp.start();
}

var Extractor = function (data, dest, opener, callback) {
  this.data = data;
  this.currentFile = 0;
  this.path = dest;
  this.startTime = Date.now()
  this.callback = callback;
  this.opener = opener;
  this.previews = {}
}

Extractor.prototype.start = function () {
  this.zip = new JSZip();
  var extractor = this;
  this.zip.loadAsync(this.data, {
    base64: true
  }).then(function (contents) {
    extractor.files = Object.keys(contents.files);
    extractor.fullExtract()
  });
}

Extractor.prototype.fullExtract = function () {
  console.logDebug("fullExtract = " + this.files.length)

  if (this.currentFile >= this.files.length) {
    console.logDebug("size = " + this.files.length)
    console.logDebug("took " + (Date.now() - this.startTime) + "ms")
    this.callback(false, this.previews)
    return;
  }
  var filename = this.files[this.currentFile]
  var extractor = this;
  console.logDebug("extract  = " + filename)
  var file = this.zip.file(filename);

  if (file != null) {
    file.async('base64').then(function (content) {


      if (content != "") {

        var dest = extractor.path + filename;
        console.logDebug("mkdir");
        mkdirp.sync(getParentFolderFromPath(dest));
        console.logDebug("mkdirok");

        fs.writeFileSync(dest, content, 'base64');
        if (filename.startsWith("data/preview_")) {
          extractor.previews[filename.substr("data/".length)] = 'data:image/jpeg;base64,' + content;
        }


      }
      extractor.currentFile++;
      extractor.fullExtract();
    });
  } else {
    extractor.currentFile++;
    extractor.fullExtract();
  }
}


var Compressor = function (source, dest, callback) {
  this.source = source;
  this.currentFile = 0;
  this.path = dest;
  this.callback = callback;
}

Compressor.prototype.start = function () {
  var fs = require('fs');
  var archiver = require('archiver');
  console.logDebug("start")
  var archive = archiver.create('zip');
  var output = fs.createWriteStream(this.path);
  output.on('close', function () {
    compressor.callback()
  });
  archive.pipe(output);
  var compressor = this;
  archive
    .directory(this.source, false)
    .finalize();


}
exports.NoteOpener = NoteOpener