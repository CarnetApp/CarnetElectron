
var fs = require('fs');
var NoteUtils = require("../note/NoteUtils").NoteUtils
var { remote } = require('electron');
var main = remote.require("./main.js");
var SettingsHelper = require("../settings/settings_helper.js").SettingsHelper;
var settingsHelper = new SettingsHelper()
var getParentFolderFromPath = require('path').dirname;
var KeywordsDBManager = function(path){
    if(path == undefined){
        path = settingsHelper.getNotePath()+ "/quickdoc/keywords/"+main.getAppUid()
    }
    this.path = path;
}

KeywordsDBManager.prototype.getFullDB = function(callback) {
    console.log("getFullDB")
    fs.readFile(this.path, function(err, data) {
        if(data == undefined||data.length == 0)
            data = "{\"data\":[]}";
        callback(err, data);
    });
}

KeywordsDBManager.prototype.getFlatenDB = function(callback) {
    this.getFullDB(function(err, data) {

        var fullDB = JSON.parse(data)["data"];
        var flaten = {};
        for (let item of fullDB) {
            var keyword = item.keyword
            if(flaten[keyword] == undefined){
                flaten[keyword] = []
            }
            var index = flaten[keyword].indexOf(item.path);
            if (item.action == "add") {
                if (index == -1) {
                    console.log("adding key "+item.path)
                    
                    flaten[keyword].push(item.path)

                }
            } else if (item.action == "remove") {
                console.log("removing key "+item.path)
                if (index > -1) {
                    flaten[keyword].splice(index, 1);
                }
            } else if (item.action == "move") {
                console.log("move key "+item.path+" to "+item.newPath)
                if (index > -1) {
                    flaten[keyword][index] = item.newPath;
                }
            }
        }
        for(let key in flaten){
            flaten[key].reverse() //unshift seems slower...
        }
        callback(false, flaten);
    });
}

KeywordsDBManager.prototype.addToDB = function(keyword, path) {
    console.log("path 1 "+path)
    if(path.startsWith("/"))
        path = NoteUtils.getNoteRelativePath(settingsHelper.getNotePath(), path)
        console.log("path 2 "+path)
        
    this.action(keyword, path, "add")
}

KeywordsDBManager.prototype.removeFromDB = function(keyword, path) {
    if(path.startsWith("/"))
        path = NoteUtils.getNoteRelativePath(settingsHelper.getNotePath(), path)
    this.action(keyword, path, "remove")
}

KeywordsDBManager.prototype.action = function(keyword,path, action, callback){
    var db = this;
    this.getFullDB(function(err, data) {
        console.log(data)
        var fullDB = JSON.parse(data);
        var item = new function() {
            this.time = new Date().getTime();
            this.action = action;
            this.path = path;
            this.keyword = keyword;
        };

        fullDB["data"].push(item);
        console.log(JSON.stringify(item))
        require("mkdirp")(getParentFolderFromPath(db.path), function(){
            fs.writeFile(db.path, JSON.stringify(fullDB), function(err) {console.log(err)});
            if(callback)
                callback()
            
        })
    })
}

exports.KeywordsDBManager = KeywordsDBManager