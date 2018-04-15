var fs = require('fs');
var getParentFolderFromPath = require('path').dirname;
var lockFile = require('lockfile')

var RecentDBManager = function (path) {
    this.path = path;
    console.log("RecentDBManager with " + path)

}

RecentDBManager.prototype.getFullDB = function (callback) {
    console.log("getFullDB")
    fs.readFile(this.path, function (err, data) {
        if (data == undefined || data.length == 0)
            data = "{\"data\":[]}";
        callback(err, data);
    });
}

RecentDBManager.prototype.getFlatenDB = function (callback) {
    this.getFullDB(function (err, data) {

        var fullDB = JSON.parse(data)["data"];
        var flaten = [];
        var pin = [];

        for (let item of fullDB) {
            var index = flaten.indexOf(item.path);
            var indexPin = pin.indexOf(item.path);

            if (item.action == "add") {
                if (index > -1) {
                    flaten.splice(index, 1);
                }
                flaten.push(item.path)
            } else if (item.action == "remove") {
                if (index > -1) {
                    flaten.splice(index, 1);
                }
                if (indexPin > -1) {
                    pin.splice(indexPin, 1);
                }
            } else if (item.action == "move") {
                if (index > -1) {
                    flaten[index] = item.newPath;
                }
                if (indexPin > -1) {
                    pin[indexPin] = item.newPath;
                }
            } else if (item.action == "pin") {
                if (indexPin > -1) {
                    pin.splice(indexPin, 1);
                }
                pin.push(item.path)
            } else if (item.action == "unpin") {
                if (indexPin > -1) {
                    pin.splice(indexPin, 1);
                }
            }
        }
        flaten.reverse()
        pin.reverse()
        callback(false, flaten, pin);
    });
}

RecentDBManager.prototype.addToDB = function (path) {
    this.action(path, "add")
}

RecentDBManager.prototype.removeFromDB = function (path, callback) {
    this.action(path, "remove", callback)
}

RecentDBManager.prototype.pin = function (path, callback) {
    this.action(path, "pin", callback)
}

RecentDBManager.prototype.unpin = function (path, callback) {
    this.action(path, "unpin", callback)
}

RecentDBManager.prototype.move = function (path, newPath, callback) {
    var db = this;
    console.log("move " + path + " to " + newPath)

    this.getFullDB(function (err, data) {
        var fullDB = JSON.parse(data);
        var item = new function () {
            this.time = new Date().getTime();
            this.action = "move";
            this.path = path;
            this.newPath = newPath;
        };

        fullDB["data"].push(item);
        console.log(JSON.stringify(item))
        require("mkdirp")(getParentFolderFromPath(db.path), function () {
            lockFile.lock('recent.lock', {
                wait: 10000
            }, function (er) {
                console.log("lock er " + er)
                fs.writeFile(db.path, JSON.stringify(fullDB), function (err) {
                    console.log(err)
                    if (callback)
                        callback()
                });
                lockFile.unlock('recent.lock', function (er) {
                    console.log("unlock er " + er)

                    // er means that an error happened, and is probably bad. 
                })
            })

        })
    })
}
RecentDBManager.prototype.actionArray = function (items, action, callback) {
    var db = this;
    var time = new Date().getTime();
    db.getFullDB(function (err, data) {
        var fullDB = JSON.parse(data);
        for (var i of items) {
            var item = new function () {
                this.time = i.time;
                this.action = action;
                this.path = i.path;
            };
            fullDB["data"].push(item);
        }
        require("mkdirp")(getParentFolderFromPath(db.path), function () {
            // opts is optional, and defaults to {} 

            console.log("writing")
            fs.writeFile(db.path, JSON.stringify(fullDB), function (err) {
                if (callback)
                    callback()
            });

        })
    });
}
RecentDBManager.prototype.action = function (path, action, callback) {
    var db = this;
    lockFile.lock('recent.lock', {
        wait: 10000
    }, function (er) {
        db.getFullDB(function (err, data) {
            console.log(data)
            var fullDB = JSON.parse(data);
            var item = new function () {
                this.time = new Date().getTime();
                this.action = action;
                this.path = path;
            };

            fullDB["data"].push(item);
            console.log(JSON.stringify(item))
            require("mkdirp")(getParentFolderFromPath(db.path), function () {
                // opts is optional, and defaults to {} 

                console.log("writing")
                fs.writeFile(db.path, JSON.stringify(fullDB), function (err) {
                    if (callback)
                        callback()
                    lockFile.unlock('recent.lock', function (er) {
                        console.log("lock er " + er)
                        // er means that an error happened, and is probably bad. 
                    })
                });

            })
        })
    })
}

// sort on key values
function keysrt(key, desc) {
    return function (a, b) {
        return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
    }
}

//returns last time
RecentDBManager.prototype.mergeDB = function (path, callback) {
    console.log("merging with " + path);
    var db = this;
    var hasChanged = false;
    lockFile.lock('recent.lock', {
        wait: 10000
    }, function (er) {
        db.getFullDB(function (err, data) {
            lockFile.unlock('recent.lock', function (er) {
                console.log("lock er " + er)
                // er means that an error happened, and is probably bad. 
            })
            var otherDB = new RecentDBManager(path)
            otherDB.getFullDB(function (err, dataBis) {
                var dataJson = JSON.parse(data)
                try {
                    var dataBisJson = JSON.parse(dataBis)
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
                dataJson["data"].sort(keysrt('time'))
                if (hasChanged) {
                    require("mkdirp")(getParentFolderFromPath(db.path), function () {
                        // opts is optional, and defaults to {} 
                        lockFile.lock('recent.lock', {
                            wait: 10000
                        }, function (er) {
                            fs.writeFile(db.path, JSON.stringify(dataJson), function (err) {
                                console.log(err);
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
exports.RecentDBManager = RecentDBManager;