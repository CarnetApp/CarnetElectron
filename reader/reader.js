var Writer = function(note, elem){
    this.note = note;
    this.elem = elem;
    this.noteOpener = new NoteOpener(note);
    
}

Writer.prototype.extractNote = function (){
    var rimraf = require('rimraf'); 
    var writer = this;
    rimraf('tmp/', function(){
        writer.noteOpener.extractTo("tmp/", function(){
            console.log("done")
            //copying reader.html
        })
    })   
    
}

Writer.prototype.fillWriter = function (extractedHTML){
    
}