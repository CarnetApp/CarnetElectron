var fs = require('fs');
var NoteUtils = require("../note/NoteUtils").NoteUtils
var {
    remote
} = require('electron');
var main = undefined
if (remote != undefined)
    main = remote.require("./main.js");
var SettingsHelper = require("../settings/settings_helper.js").SettingsHelper;
var settingsHelper = new SettingsHelper()
var getParentFolderFromPath = require('path').dirname;
var KeywordsDBManager = function (path) {
    if (path == undefined) {
        path = settingsHelper.getNotePath() + "/quickdoc/keywords/" + main.getAppUid()
    }
    this.path = path;
}

KeywordsDBManager.prototype.getFullDB = function (callback) {
    console.log("getFullDB")
    fs.readFile(this.path, function (err, data) {
        if (data == undefined || data.length == 0)
            data = "{\"data\":[]}";
        callback(err, data);
    });
}

KeywordsDBManager.prototype.getFlatenDB = function (callback) {
    this.getFullDB(function (err, data) {

        var fullDB = JSON.parse(data)["data"];
        var flaten = {};
        for (let item of fullDB) {
            var keyword = item.keyword
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

KeywordsDBManager.prototype.addToDB = function (keyword, path) {
    console.log("path 1 " + path)
    if (path.startsWith("/"))
        path = NoteUtils.getNoteRelativePath(settingsHelper.getNotePath(), path)
    console.log("path 2 " + path)

    this.action(keyword, path, "add")
}

KeywordsDBManager.prototype.removeFromDB = function (keyword, path) {
    if (path.startsWith("/"))
        path = NoteUtils.getNoteRelativePath(settingsHelper.getNotePath(), path)
    this.action(keyword, path, "remove")
}

KeywordsDBManager.prototype.action = function (keyword, path, action, callback) {
    var db = this;
    this.getFullDB(function (err, data) {
        console.log(data)
        var fullDB = JSON.parse(data);
        var item = new function () {
            this.time = new Date().getTime();
            this.action = action;
            this.path = path;
            this.keyword = keyword;
        };

        fullDB["data"].push(item);
        console.log(JSON.stringify(item))
        require("mkdirp")(getParentFolderFromPath(db.path), function () {
            fs.writeFile(db.path, JSON.stringify(fullDB), function (err) {
                console.log(err)
            });
            if (callback)
                callback()

        })
    })
}

//returns last time
KeywordsDBManager.prototype.mergeDB = function (path, callback) {
    console.log("merging with " + path);
    var db = this;
    var hasChanged = false;
    this.getFullDB(function (err, data) {
        var otherDB = new KeywordsDBManager(path)
        otherDB.getFullDB(function (err, dataBis) {
            var dataJson = JSON.parse(data)
            var dataBisJson = JSON.parse(dataBis)
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
            require("mkdirp")(getParentFolderFromPath(db.path), function () {
                fs.writeFile(db.path, JSON.stringify(dataJson), function (err) {
                    console.log(err);
                    callback(hasChanged);
                });

            })
        });
    })
}

KeywordsDBManager.prototype.actionArray = function (items, action, callback) {
    var db = this;
    db.getFullDB(function (err, data) {
        var fullDB = JSON.parse(data);
        for (var i of items) {
            var item = new function () {
                this.time = new Date().getTime();
                this.action = action;
                this.path = i.path;
                this.keyword = i.keyword;

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


// sort on key values
function keysrt(key, desc) {
    return function (a, b) {
        return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
    }
}

exports.KeywordsDBManager = KeywordsDBManager