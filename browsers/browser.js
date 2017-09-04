var initPath = "/home/phoenamandre/QuickNote"
var currentPath;
var currentTask = undefined;
var noteCardViewGrid = undefined;
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
        opener.getMainText(function(txt){
            if(myTask.continue){
                console.log(note.name+" "+txt)
                note.text = txt;
                noteCardViewGrid.updateNote(note)
                noteCardViewGrid.iso.layout();
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

function list(path){
  
  currentPath = path;
  if(initPath == currentPath){
    $("#back_arrow").hide()
  }
  else
  $("#back_arrow").show()
  var grid = document.getElementById("page-content");
  grid.innerHTML ="";
  noteCardViewGrid = new NoteCardViewGrid(grid);

  noteCardViewGrid.onFolderClick(function(folder){
    list(folder.path)
  })
  noteCardViewGrid.onNoteClick(function(note){
    
  })
var notes = [];

var fb = new FileBrowser(path);
fb.list(function(files){
    if(currentTask!=undefined)
        currentTask.continue = false
  for(let file of files){
    var filename = getFilenameFromPath(file.path);
    console.log("file "+ file.path)
    if(file.isFile && filename.endsWith(".sqd")){
      var noteTestTxt = new Note(stripExtensionFromName(filename),"content", file.path);
      notes.push(noteTestTxt)
    }
    else if(!file.isFile){
      console.log("folder")

      notes.push(file)
    }
  }
  noteCardViewGrid.setNotesAndFolders(notes)
  currentTask  = new TextGetterTask(notes);
  console.log(currentTask)
  currentTask.startList();

});
  
}
$("#back_arrow").bind("click", function(){
  list(getParentFolderFromPath(currentPath))
});
list(initPath)