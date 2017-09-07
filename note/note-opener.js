var JSZip = require('jszip');
var mkdirp = require('mkdirp');
var fs = require('fs');

var NoteOpener = function(note){
    this.note = note;
}

NoteOpener.prototype.getMainTextAndMetadata = function(callback){
  var opener = this;
    this.getFullHTML(function (data, zip) {
      opener.getMetadataString(zip, function(metadata){
        var tempElement =  document.createElement("div");
        tempElement.innerHTML = data;
        callback(tempElement.innerText, metadata!=undefined?JSON.parse(metadata):undefined)
      })
       
    });
}

NoteOpener.prototype.getMetadataString = function(zip, callback){
  if(zip.file("metadata.json")!=null)
    zip.file("metadata.json").async("string").then(callback)
  else{
    callback(undefined)
  }
}

NoteOpener.prototype.getFullHTML = function(callback){
    fs.readFile(this.note.path,  function (err,data) {
        if (err) {
          return console.log(err);
        }
        JSZip.loadAsync(data).then(function (zip) {
            zip.file("index.html").async("string").then(function(content){
              callback(content, zip)
            })
        });
      }); 
}

NoteOpener.prototype.extractTo = function(path, callback){
  var opener = this;
    fs.readFile(this.note.path, function(err, data){
        if (!err){
          var extractor = new Extractor(data, path, opener, callback)
          extractor.start();
        }
      });
}

NoteOpener.prototype.compressFrom = function(path, callback){
  var comp = new Compressor(path,this.note.path,callback);
  comp.start();
}

var Extractor = function(data, dest, opener, callback){
  this.data = data;
  this.currentFile = 0;
  this.path = dest;
  this.callback = callback;
  this.opener = opener;
}

Extractor.prototype.start = function(){
  this.zip = new JSZip();
  var extractor = this;
  this.zip.loadAsync(this.data).then(function(contents){
    extractor.files = Object.keys(contents.files);
      extractor.fullExtract()
  });
}

Extractor.prototype.fullExtract = function(){
  console.log("fullExtract = "+this.files.length)
  
  if(this.currentFile >= this.files.length){
    console.log("size = "+this.files.length)
    this.callback()
    return;
  }
  var filename = this.files[this.currentFile]
  var extractor = this;
  console.log("extract  = "+filename)
  var file = this.zip.file(filename);
  if(file != null){
    file.async('nodebuffer').then(function(content) {
    
    
    if(content!=""){
      
    var dest = extractor.path + filename;              
    mkdirp.sync(getParentFolderFromPath(dest));
    fs.writeFileSync(dest, content);
    if(filename == "metadata.json"){
      extractor.opener.note.metadata = JSON.parse(content);
    }
   
  }
  extractor.currentFile ++;
  extractor.fullExtract();
}); 
  }
  else{
    extractor.currentFile ++;
    extractor.fullExtract();
  }
}


var Compressor = function(source, dest, callback){
  this.source = source;
  this.currentFile = 0;
  this.path = dest;
  this.callback = callback;
}

Compressor.prototype.start = function(){
  var fs = require('fs');
  var archiver = require('archiver');
  console.log("start")
  var archive = archiver.create('zip', {});
  var output = fs.createWriteStream(this.path);
  archive.pipe(output);
  
  archive
    .directory(__dirname,false )
    .finalize();
}

