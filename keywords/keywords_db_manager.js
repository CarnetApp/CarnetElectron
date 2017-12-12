
var fs = require('fs');
var getParentFolderFromPath = require('path').dirname;
var KeywordsDBManager = function(path){
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
                    flaten[keyword].push(item.path)
                }
            } else if (item.action == "remove") {
                console.log("removing "+item.path)
                if (index > -1) {
                    flaten[keyword].splice(index, 1);
                }
            } else if (item.action == "move") {
                console.log("move "+item.path+" to "+item.newPath)
                if (index > -1) {
                    flaten[keyword][index] = item.newPath;
                }
            }
        }
        flaten.reverse()
        callback(false, flaten);
    });
}

KeywordsDBManager.prototype.addToDB = function(keyword, path) {
    this.action(keyword, path, "add")
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