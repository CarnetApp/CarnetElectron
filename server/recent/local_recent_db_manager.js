var fs = require('fs');
var getParentFolderFromPath = require('path').dirname;
var lockFile = require('lockfile')
var LocalRecentDBManager = function (path) {
    this.path = path;
    console.logDebug("RecentDBManager with " + path)

}


LocalRecentDBManager.prototype.getFullDB = function (callback, donotparse) {
    console.logDebug("getFullDB")
    fs.readFile(this.path, "utf8", function (err, data) {
        if (data == undefined || data.length == 0)
            data = "{\"data\":[]}";
        callback(err, donotparse ? data : JSON.parse(data)); //working on big object transmitted to ui is a nightmare... so... sending string (far faster)
    });
}

LocalRecentDBManager.prototype.actionArray = function (items, callback) {
    var db = this;
    var time = new Date().getTime();
    db.getFullDB(function (err, data) {
        var fullDB = data;
        for (var i of items) {
            var item = new function () {
                this.time = i.time;
                this.action = i.action;
                this.path = i.path;
                if (i.newPath != undefined)
                    this.newPath = i.newPath
            };
            fullDB["data"].push(item);
        }
        require("mkdirp")(getParentFolderFromPath(db.path), function () {
            // opts is optional, and defaults to {} 

            console.logDebug("writing")
            fs.writeFile(db.path, JSON.stringify(fullDB), function (err) {
                if (callback)
                    callback()
            });

        })
    });
}

LocalRecentDBManager.prototype.move = function (path, newPath, callback) {
    this.actionArray([{
        action: "move",
        time: new Date().getTime(),
        path: path,
        newPath: newPath
    }], callback)
}

LocalRecentDBManager.prototype.action = function (path, action, callback) {
    this.actionArray(path, action, new Date().getTime(), callback);
}
LocalRecentDBManager.prototype.action = function (path, action, time, callback) {
    var db = this;
    console.logDebug("action")
    lockFile.lock('recent.lock', {
        wait: 10000
    }, function (er) {
        db.getFullDB(function (err, data) {
            console.logDebug(data)
            var fullDB = data;
            var item = new function () {
                this.time = time;
                this.action = action;
                this.path = path;
            };

            fullDB["data"].push(item);
            console.logDebug(JSON.stringify(item))
            require("mkdirp")(getParentFolderFromPath(db.path), function () {
                // opts is optional, and defaults to {} 

                console.logDebug("writing")
                fs.writeFile(db.path, JSON.stringify(fullDB), function (err) {
                    if (callback)
                        callback()
                    lockFile.unlock('recent.lock', function (er) {
                        console.logDebug("lock er " + er)
                        // er means that an error happened, and is probably bad. 
                    })
                });

            })
        })
    })
}

// sort on key values
function keysrt(key) {
    return function (a, b) {
        return a[key] > b[key];
    }
}
//returns last time
LocalRecentDBManager.prototype.mergeDB = function (path, callback) {
    console.logDebug("merging with " + path);
    var db = this;
    var hasChanged = false;
    lockFile.lock('recent.lock', {
        wait: 10000
    }, function (er) {
        db.getFullDB(function (err, data) {
            lockFile.unlock('recent.lock', function (er) {
                console.logDebug("lock er " + er)
                // er means that an error happened, and is probably bad. 
            })
            var otherDB = new LocalRecentDBManager(path)
            otherDB.getFullDB(function (err, dataBis) {
                var dataJson = data
                try {
                    var dataBisJson = dataBis
                } catch (e) { //bad :(
                    return
                }
                for (let itemBis of dataBisJson["data"]) {
                    var isIn = false;
                    for (let item of dataJson["data"]) {
                        if (itemBis.time == item.time && itemBis.path == item.path && itemBis.action == item.action) {
                            isIn = true;
                            break;
                        }
                    }
                    if (!isIn) {
                        dataJson["data"].push(itemBis);
                        hasChanged = true;
                    }
                }
                dataJson["data"] = dataJson["data"].sort(keysrt('time'))
                if (hasChanged) {
                    require("mkdirp")(getParentFolderFromPath(db.path), function () {
                        // opts is optional, and defaults to {} 
                        lockFile.lock('recent.lock', {
                            wait: 10000
                        }, function (er) {
                            fs.writeFile(db.path, JSON.stringify(dataJson), function (err) {
                                console.logDebug(err);
                                callback(hasChanged);
                            });
                            lockFile.unlock('recent.lock', function (er) {
                                // er means that an error happened, and is probably bad. 
                            })
                        })
                    })
                } else callback(hasChanged);
            });
        })
    });

}

exports.LocalRecentDBManager = LocalRecentDBManager;