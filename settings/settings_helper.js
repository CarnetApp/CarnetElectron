var SettingsHelper = function(){
    
}
const Store = require('electron-store');
const store = new Store();
SettingsHelper.prototype.getNotePath = function(){
    var path =  String(store.get("root_path")) 
    if (path == null){
        const {app} = require('electron')
        path = app.getPath('documents')+"/QuickNote" ;
        store.set("root_path",path);
    }
    require("mkdirp")(path)
    console.log("path "+path)
    return path;
}

SettingsHelper.prototype.setNotePath = function(path){
    store.set("root_path",path);
}

exports.SettingsHelper = SettingsHelper;