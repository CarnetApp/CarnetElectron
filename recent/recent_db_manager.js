var RecentDBManager = function () {

}

RecentDBManager.prototype.getFullDB = function (callback) {
    RequestBuilder.sRequestBuilder.get("/recentdb", callback)
}

RecentDBManager.prototype.getFlatenDB = function (callback, trial = 0) {
    var dbManager = this
    this.getFullDB(function (err, data) {
        if(data == null){
            //error, let's retry
            if(trial < 2)
                setTimeout(function(){
                    dbManager.getFlatenDB(callback, trial+1);
                }, 1000);
            else
                callback(true)
            return;
        }
        //with electron, working on big object transmitted to ui is a nightmare... so... sending string (far faster)
        if (typeof data === "string")
            data = JSON.parse(data)
        var fullDB = data["data"];
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
        RecentDBManager.getInstance().notPinned = flaten
        RecentDBManager.getInstance().pinned = pin;
        RecentDBManager.getInstance().lastDb = pin.concat(flaten)
        callback(false, flaten, pin, data["metadata"]);
    });
}

RecentDBManager.getInstance = function () {
    if (RecentDBManager.instance == undefined)
        RecentDBManager.instance = new RecentDBManager();
    return RecentDBManager.instance
}

RecentDBManager.prototype.addToDB = function (path, callback) {
    RecentDBManager.getInstance().lastDb.push(path)
    this.action(path, "add", callback)
}

RecentDBManager.prototype.removeFromDB = function (path, callback) {
    RecentDBManager.getInstance().lastDb.splice(RecentDBManager.getInstance().lastDb.indexOf(path), 1);
    this.action(path, "remove", callback)
}

RecentDBManager.prototype.pin = function (path, callback) {
    this.action(path, "pin", callback)
}

RecentDBManager.prototype.unpin = function (path, callback) {
    this.action(path, "unpin", callback)
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
RecentDBManager.prototype.actionArray = function (items, callback) {
    RequestBuilder.sRequestBuilder.post("/recentdb/action", {
        data: items
    }, function (error, data) {
        console.log(data)
        callback();
    });

}

RecentDBManager.prototype.action = function (path, action, callback) {

    this.actionArray([{
        time: new Date().getTime(),
        action: action,
        path: path
    }], callback)
}

// sort on key values
function keysrt(key, desc) {
    return function (a, b) {
        return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
    }
}

