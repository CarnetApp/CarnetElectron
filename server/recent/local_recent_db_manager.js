var fs = require('fs');
var getParentFolderFromPath = require('path').dirname;
var lockFile = require('lockfile')
var RecentDBManager = require('../../recent/recent_db_manager').RecentDBManager;
var LocalRecentDBManager = function (path) {
    this.path = path;
    console.log("RecentDBManager with " + path)

}

LocalRecentDBManager.prototype = RecentDBManager.prototype


LocalRecentDBManager.prototype.getFullDB = function (callback) {
    console.log("getFullDB")
    fs.readFile(this.path, function (err, data) {
        if (data == undefined || data.length == 0)
            data = "{\"data\":[]}";
        callback(err, data);
    });
}

LocalRecentDBManager.prototype.actionArray = function (items, action, callback) {
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
LocalRecentDBManager.prototype.action = function (path, action, callback) {
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

exports.LocalRecentDBManager = LocalRecentDBManager;