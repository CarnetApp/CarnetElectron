var fs = require('fs');
var getParentFolderFromPath = require('path').dirname;

var RecentDBManager = function(path) {
    this.path = path;
    console.log("RecentDBManager with " + path)

}

RecentDBManager.prototype.getFullDB = function(callback) {
    console.log("getFullDB")
    fs.readFile(this.path, function(err, data) {
        if(data == undefined||data.length == 0)
            data = "{\"data\":[]}";
        callback(err, data);
    });
}

RecentDBManager.prototype.getFlatenDB = function(callback) {
    this.getFullDB(function(err, data) {

        var fullDB = JSON.parse(data)["data"];
        var flaten = [];
        for (let item of fullDB) {
            var index = flaten.indexOf(item.path);
            if (item.action == "add") {
                if (index > -1) {
                    flaten.splice(index, 1);
                }
                flaten.push(item.path)
            } else if (item.action == "remove") {
                console.log("removing "+item.path)
                if (index > -1) {
                    flaten.splice(index, 1);
                }
            } else if (item.action == "move") {
                console.log("move "+item.path+" to "+item.newPath)
                if (index > -1) {
                    flaten[index] = item.newPath;
                }
            }
        }
        flaten.reverse()
        callback(false, flaten);
    });
}

RecentDBManager.prototype.addToDB = function(path) {
    this.action(path, "add")
}

RecentDBManager.prototype.removeFromDB = function(path,callback) {
    this.action(path, "remove",callback)
}

RecentDBManager.prototype.move = function(path,newPath,callback) {
    var db = this;
    console.log("move "+path+" to "+newPath)
    
    this.getFullDB(function(err, data) {
        var fullDB = JSON.parse(data);
        var item = new function() {
            this.time = new Date().getTime();
            this.action = "move";
            this.path = path;
            this.newPath = newPath;
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

RecentDBManager.prototype.action = function(path, action, callback){
    var db = this;
    this.getFullDB(function(err, data) {
        console.log(data)
        var fullDB = JSON.parse(data);
        var item = new function() {
            this.time = new Date().getTime();
            this.action = action;
            this.path = path;
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

// sort on key values
function keysrt(key,desc) {
    return function(a,b){
     return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
    }
  }

//returns last time
RecentDBManager.prototype.mergeDB = function(path, callback) {
    console.log("merging with "+path);
    var db = this;
    var hasChanged = false;
    this.getFullDB(function(err,data){
        var otherDB = new RecentDBManager(path)
        otherDB.getFullDB(function(err, dataBis){
            var dataJson = JSON.parse(data)
            var dataBisJson = JSON.parse(dataBis)
            for (let itemBis of dataBisJson["data"]) {
                var isIn = false;
                for (let item of dataJson["data"]) {
                    if(itemBis.time == item.time && itemBis.path == item.path && itemBis.action == item.action){
                        isIn = true;
                        console.log(itemBis.time+ " is in");
                        break;
                    }
                }
                if(!isIn){
                    console.log(itemBis.time+ " is not in");
                    dataJson["data"].push(itemBis);
                    hasChanged = true;
                }
            }
            dataJson["data"].sort(keysrt('time'))
            require("mkdirp")(getParentFolderFromPath(db.path), function(){
                fs.writeFile(db.path, JSON.stringify(dataJson), function(err) {
                    console.log(err);
                    callback(hasChanged);
                });
                
            })
        });
    })

}
exports.RecentDBManager = RecentDBManager;