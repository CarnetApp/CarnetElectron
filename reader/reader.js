var Writer = function(note, elem){
    this.note = note;
    this.elem = elem;
    this.noteOpener = new NoteOpener(note);
    
}


Writer.prototype.extractNote = function (){
        var writer = this;
        writer.noteOpener.extractTo("tmp/", function(){
            console.log("done")
            var fs = require('fs');            
            fs.readFile('tmp/index.html', function read(err, data) {
                if (err) {
                    throw err;
                }
                
                content = data;
                console.log(data)
                writer.fillWriter(content)
            });
            //copying reader.html
        })
}

Writer.prototype.fillWriter = function (extractedHTML){
    this.oEditor.innerHTML=extractedHTML;
	this.oDoc = document.getElementById("text");
    this.oFloating = document.getElementById("floating");
    var writer=  this
    this.oDoc.addEventListener("input", function() {
        var fs = require('fs');    
        fs.unlink(__dirname+"/reader.html",function(){
            fs.writeFile(__dirname+'/index.html', writer.oEditor.innerHTML, function (err) {
                if (err) return console.log(err);
                writer.note.metadata.last_modification_date = Date.now();
                fs.writeFile(__dirname+'/metadata.json', JSON.stringify(writer.note.metadata), function (err) {
                    if (err) return console.log(err);
                    writer.oEditor.innerHTML
                    writer.noteOpener.compressFrom(__dirname,function(){})
                  });
    
              });
            
            
        }) 
        
    }, false);
    this.sDefTxt = this.oDoc.innerHTML;
  /*simple initialization*/
	this.oDoc.focus();
    resetScreenHeight();
     
    $("#editor").webkitimageresize().webkittableresize().webkittdresize();
    
}

Writer.prototype.formatDoc = function(sCmd, sValue) {
	oEditor.focus();
    if (validateMode()) { document.execCommand(sCmd, false, sValue); oEditor.focus(); }
}

Writer.prototype.init = function(){

    this.statsDialog = this.elem.querySelector('#statsdialog');
    this.showDialogButton = this.elem.querySelector('#show-dialog');
    if (! this.statsDialog.showModal) {
    //  dialogPolyfill.registerDialog(this.statsDialog);
    }
   
    this.statsDialog.querySelector('.ok').addEventListener('click', function() {
		this.statsDialog.close();
      
    });

    this.oEditor = document.getElementById("editor");
    this.backArrow = document.getElementById("back-arrow");
    this.backArrow.addEventListener("click", function(){
        var {ipcRenderer, remote} = require('electron');  
        var main = remote.require("./main.js");
        var win = remote.getCurrentWindow();
        main.displayMainWindow(win.getSize(), win.getPosition());
        win.close()
    });
   // $("#editor").webkitimageresize().webkittableresize().webkittdresize();
}
Writer.prototype.displayCountDialog = function(){
    if(window.getSelection().toString().length==0){
        nouveauDiv = oDoc;			
    }
    else{
        nouveauDiv = document.createElement("div");
        nouveauDiv.innerHTML = window.getSelection();
    }
    Countable.once(nouveauDiv, function (counter) {
        mStatsDialog.querySelector('.words_count').innerHTML = counter.words;
        mStatsDialog.querySelector('.characters_count').innerHTML = counter.characters;
        mStatsDialog.querySelector('.sentences_count').innerHTML = counter.sentences;
        mStatsDialog.showModal();
    });

}
