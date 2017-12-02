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
        console.log("data "+data)
        callback(err, data);
    });
}

RecentDBManager.prototype.getFlatenDB = function(callback) {
    this.getFullDB(function(err, data) {
        console.log("fullDB " + data)

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
                if (index > -1) {
                    flaten.splice(index, 1);
                }
            }
        }
        flaten.reverse()
        callback(false, flaten);
    });
}

RecentDBManager.prototype.addToDB = function(path) {
    var db = this;
    this.getFullDB(function(err, data) {
        console.log(data)
        var fullDB = JSON.parse(data);
        var item = new function() {
            this.time = new Date().getTime();
            this.action = "add";
            this.path = path;
        };

        fullDB["data"].push(item);
        console.log(JSON.stringify(item))
        require("mkdirp")(getParentFolderFromPath(db.path), function(){
            fs.writeFile(db.path, JSON.stringify(fullDB), function(err) {console.log(err)});
            
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
                }
            }
            dataJson["data"].sort(keysrt('time'))
            require("mkdirp")(getParentFolderFromPath(db.path), function(){
                fs.writeFile(db.path, JSON.stringify(dataJson), function(err) {
                    console.log(err);
                    callback();
                });
                
            })
        });
    })

}
exports.RecentDBManager = RecentDBManager;