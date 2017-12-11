
var SettingsHelper = require("./settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var { ipcRenderer, remote } = require('electron');
document.getElementById("select_note_path_button").onclick = function(){
    var dialog = remote.dialog; 
          dialog.showOpenDialog({
        properties: ['openDirectory']
      },function(path){
          if(path != undefined)
            settingsHelper.setNotePath(path)
      })
}
document.getElementById("current_root_path").innerHTML = settingsHelper.getNotePath()

