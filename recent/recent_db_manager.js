var fs = require('fs');

var RecentDBManager = function(path) {
    this.path = path;
    console.log("RecentDBManager with " + path)

}

RecentDBManager.prototype.getFullDB = function(callback) {
    console.log("getFullDB")
    fs.readFile(this.path, function(err, data) {
        callback(err, data);
    });
}

RecentDBManager.prototype.getFlatenDB = function(callback) {
    this.getFullDB(function(err, data) {
        console.log("fullDB " + fullDB)

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
        fs.writeFile(db.path, JSON.stringify(fullDB), function(err) {});
    })
}


//returns last time
RecentDBManager.prototype.mergeDB = function(path) {


}