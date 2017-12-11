var Settings = function(){

}
var { ipcRenderer, remote } = require('electron');

Settings.prototype.getNotePath = function(){
    const LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('../scratch')
    var path = localStorage.getItem("root_path") 
    if (path == null){
        const {app} = require('electron')
        path = app.getPath('documents')+"/QuickNote" ;
        localStorage.setItem("root_path","/home/alexandre/Nextcloud/Documents/QuickNote");
    }
    require("mkdirp")(path)
    return path+(isDebug?"Debug":"");
}

Settings.prototype.setNotePath = function(path){
    const LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = remote.getLocalStorage()
    localStorage.setItem("root_path",path);
}
var settings = new Settings();
document.getElementById("select_note_path_button").onclick = function(){
    var dialog = remote.dialog; 
          dialog.showOpenDialog({
        properties: ['openDirectory']
      },function(path){
        settings.setNotePath(path)
      })
}

