var fs = require('fs');
var getParentFolderFromPath = require('path').dirname;
var lockFile = require('lockfile')

var KeywordsDBManager = function (path) {
    this.path = path;
}



KeywordsDBManager.prototype.getFullDB = function (callback, donotparse) {
    console.logDebug("getFullDB")
    fs.readFile(this.path, "utf8", function (err, data) {
        if (data == undefined || data.length == 0)
            data = "{\"data\":[]}";
        callback(err, donotparse ? data : JSON.parse(data));
    });
}

KeywordsDBManager.prototype.getFlatenDB = function (callback) {
    this.getFullDB(function (err, data) {
        console.logDebug(data)
        var fullDB = data["data"];
        var flaten = {};
        for (let item of fullDB) {
            var keyword = item.keyword
            if (keyword == undefined)
                continue;
            if (keyword != undefined && flaten[keyword] == undefined) {
                flaten[keyword] = []
            }
            var index = flaten[keyword].indexOf(item.path);
            if (item.action == "add") {
                if (index == -1) {

                    flaten[keyword].push(item.path)

                }
            } else if (item.action == "remove") {
                if (index > -1) {
                    flaten[keyword].splice(index, 1);
                }
            } else if (item.action == "move") {
                for (let key in flaten) {
                    var indexBis = flaten[key].indexOf(item.path);
                    flaten[key][indexBis] = item.newPath;
                }
            }
        }
        for (let key in flaten) {
            flaten[key].reverse() //unshift seems slower...
        }
        callback(false, flaten);
    });
}



KeywordsDBManager.prototype.action = function (keyword, path, action, time, callback) {
    this.actionArray([{
        keyword,
        time: time,
        action: action,
        path: path
    }], callback)
}


//returns last time
KeywordsDBManager.prototype.mergeDB = function (path, callback) {
    console.logDebug("merging with " + path);
    var db = this;
    var hasChanged = false;
    lockFile.lock('keyword.lock', {
        wait: 10000
    }, function (er) {
        console.logDebug(er)
        lockFile.unlock('keyword.lock', function (er) { })
        db.getFullDB(function (err, data) {
            var otherDB = new KeywordsDBManager(path)
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
                if (hasChanged) {
                    dataJson["data"].sort(keysrt('time'))
                    require("mkdirp")(getParentFolderFromPath(db.path)).then(made => {
                        lockFile.lock('recent.lock', {
                            wait: 10000
                        }, function (er) {
                            fs.writeFile(db.path, JSON.stringify(dataJson), function (err) {
                                console.logDebug(err);
                                callback(hasChanged);
                            });
                            lockFile.unlock('keyword.lock', function (er) { })

                        })
                    })
                } else callback(hasChanged);
            });
        })
    });
}

KeywordsDBManager.prototype.actionArray = function (items, callback) {
    var db = this;
    lockFile.lock('keyword.lock', {
        wait: 10000
    }, function (er) {
        db.getFullDB(function (err, data) {
            var fullDB = data;
            for (var i of items) {
                var item = new function () {
                    this.time = i.time;
                    this.action = i.action;
                    this.path = i.path;
                    this.keyword = i.keyword;

                };
                fullDB["data"].push(item);
            }
            require("mkdirp")(getParentFolderFromPath(db.path)).then(made => {
                // opts is optional, and defaults to {} 

                console.logDebug("writing")

                fs.writeFile(db.path, JSON.stringify(fullDB), function (err) {
                    if (callback)
                        callback()

                });
                lockFile.unlock('keyword.lock', function (er) { })
            })

        })
    });
}


// sort on key values
function keysrt(key, desc) {
    return function (a, b) {
        return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
    }
}

exports.KeywordsDBManager = KeywordsDBManager