var JSZip = require('jszip');
var NoteOpener = function(note){
    this.note = note;
}

NoteOpener.prototype.getMainText = function(callback){
    fs.readFile(this.note.path,  function (err,data) {
        if (err) {
          return console.log(err);
        }
        JSZip.loadAsync(data).then(function (zip) {

            zip.file("index.html").async("string").then(function (data2) {
               var tempElement =  document.createElement("div");
               tempElement.innerHTML = data2;
               callback(tempElement.innerText)
            })
        });
      });
    
    
}