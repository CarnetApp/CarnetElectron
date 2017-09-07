var initPath = "/home/phoenamandre/QuickNote"
var currentPath;
var currentTask = undefined;
var noteCardViewGrid = undefined;
var oldNotes = {} 
var TextGetterTask = function(list){  
    this.list = list;
    this.current = 0;
    this.continue = true;
}

TextGetterTask.prototype.startList = function(){
    this.getNext();
}

TextGetterTask.prototype.getNext = function(){
    if(this.current>=this.list.length)
    return;
    if(this.list[this.current] instanceof Note){
        var opener = new NoteOpener(this.list[this.current])
        var myTask = this;
        var note = this.list[this.current]
        opener.getMainTextAndMetadata(function(txt, metadata){
            if(myTask.continue){
                note.text = txt.substring(0, 200);
                if(metadata!=undefined)
                note.metadata = metadata;
                oldNotes[note.path] = note;
                noteCardViewGrid.updateNote(note)
               noteCardViewGrid.msnry.layout();
                myTask.getNext();
            }
        });
        this.current++;
    }
    else{
        this.current++;
        this.getNext();
    }
    
}

function list(pathToList, discret){
  if(pathToList == undefined)
    pathToList = currentPath;
  console.log("listing path "+pathToList);
  currentPath = pathToList;
  if(initPath == currentPath){
    $("#back_arrow").hide()
  }
  else
  $("#back_arrow").show()
  var grid = document.getElementById("page-content");
  var scroll = 0;
  if(discret)
    scroll = document.getElementById("page-container").scrollTop;
  grid.innerHTML ="";
  noteCardViewGrid = new NoteCardViewGrid(grid,discret);

  noteCardViewGrid.onFolderClick(function(folder){
    list(folder.path)
  })
  noteCardViewGrid.onNoteClick(function(note){
    const electron = require('electron')
    const remote = electron.remote;
    const BrowserWindow = remote.BrowserWindow;
    const path = require('path')
    //var win = new BrowserWindow({ width: 800, height: 600 });

    var rimraf = require('rimraf'); 
    rimraf('tmp', function(){
      var fs = require('fs');
      
      fs.mkdir("tmp",function(e){
        fs.createReadStream('reader/reader.html').pipe(fs.createWriteStream('tmp/reader.html'));
        var size = remote.getCurrentWindow().getSize();
        var pos = remote.getCurrentWindow().getPosition();
        var win = new BrowserWindow({ width: size[0],height: size[1],x:pos[0], y:pos[1],  frame: false });
       // win.hide()
        console.log("w "+remote.getCurrentWindow().getPosition()[0])
        const url = require('url')
         win.loadURL(url.format({
          pathname: path.join(__dirname, 'tmp/reader.html'),
          protocol: 'file:',
          query:{'path':note.path},
          slashes: true
        }))
        
      });
        
    })   
    
     // var reader = new Writer(note,"");
     // reader.extractNote()
  })
var notes = [];

var fb = new FileBrowser(pathToList);
fb.list(function(files){
    if(currentTask!=undefined)
        currentTask.continue = false
  for(let file of files){
    var filename = getFilenameFromPath(file.path);
    if(file.isFile && filename.endsWith(".sqd")){
      var oldNote = oldNotes[file.path];
      
      var noteTestTxt = new Note(stripExtensionFromName(filename),oldNote!=undefined?oldNote.text:"", file.path, oldNote!=undefined?oldNote.metadata:undefined);
      notes.push(noteTestTxt)
    }
    else if(!file.isFile){

      notes.push(file)
    }
  }
  noteCardViewGrid.setNotesAndFolders(notes)
  if(discret){
    document.getElementById("page-container").scrollTop = scroll;
    console.log("scroll : "+scroll)

  }
  currentTask  = new TextGetterTask(notes);
  console.log("stopping and starting task")
  currentTask.startList();

});
  
}

list(initPath)

$(window).focus(function() {
  list(currentPath, true)
});