var JSZip = require('jszip');
var mkdirp = require('mkdirp');
var NoteOpener = function(note){
    this.note = note;
}

NoteOpener.prototype.getMainText = function(callback){
    this.getFullHTML(function (data2) {
        var tempElement =  document.createElement("div");
        tempElement.innerHTML = data2;
        callback(tempElement.innerText)
    });
}

NoteOpener.prototype.getFullHTML = function(callback){
    fs.readFile(this.note.path,  function (err,data) {
        if (err) {
          return console.log(err);
        }
        JSZip.loadAsync(data).then(function (zip) {
            zip.file("index.html").async("string").then(callback)
        });
      }); 
}

NoteOpener.prototype.extractTo = function(path, callback){
    fs.readFile(this.note.path, function(err, data){
        if (!err){
          var zip = new JSZip();
          zip.loadAsync(data).then(function(contents){
            Object.keys(contents.files).forEach(function(filename){



              zip.file(filename).async('nodebuffer').then(function(content) {
                  if(content=="")
                    return;
              var dest = path + filename;              
                mkdirp.sync(getParentFolderFromPath(dest));
            
              fs.writeFileSync(dest, content);
              }); 
            });
            callback()
            
          });
        }
      });
}