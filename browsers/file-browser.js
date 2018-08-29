var FileBrowser = function (path) {
    this.path = path;
}

FileBrowser.prototype.createFolder = function (name, callback) {
    fs.mkdir(pathTool.join(this.path, name), function (e) {
        callback();
    });

}

FileBrowser.prototype.list = function (callback) {


    if (this.path == "recentdb://") {
        console.log("getting recent")
        var db = new RecentDBManager()
        db.getFlatenDB(function (err, flaten, pin) {
            console.log(JSON.stringify(flaten))
            var files = [];
            for (let filePath of pin) {
                var filename = filePath;
                filePath = filePath
                file = new File(filePath, true, filename);
                file.isPinned = true;
                files.push(file)
            }
            for (let filePath of flaten) {
                if (pin.indexOf(filePath) != -1)
                    continue;
                var filename = filePath;
                filePath = filePath
                file = new File(filePath, true, filename);
                files.push(file)
            }
            callback(files)
        })
    } else if (this.path.startsWith("keyword://")) {
        console.log("getting keyword")
        var keywordsDBManager = new KeywordsDBManager()
        var filebrowser = this;
        keywordsDBManager.getFlatenDB(function (error, data) {
            var files = [];
            console.log("keyword " + filebrowser.path.substring("keyword://".length))
            for (let filePath of data[filebrowser.path.substring("keyword://".length)]) {
                var filename = filePath;
                console.log("file " + filePath)

                filePath = filePath
                file = new File(filePath, true, filename);
                files.push(file)
            }
            callback(files)
        })
    } else {
        RequestBuilder.sRequestBuilder.get("/browser/list?path=" + encodeURIComponent(this.path), function (error, data) {
            if (error) {
                callback(error);
                return;
            }
            var files = [];
            var dirs_in = [];
            var files_in = [];
            for (let node of data) {
                if (node.path == "quickdoc")
                    continue;
                file = new File(node.path, !node.isDir, node.name);
                if (!node.isDir)
                    files_in.push(file)
                else
                    dirs_in.push(file)
            }
            files = files.concat(dirs_in)
            files = files.concat(files_in)
            callback(files)

        });

    }
}

var File = function (path, isFile, name, extension) {
    this.path = path;
    this.isFile = isFile;
    this.name = name;
    this.extension = extension;

}
File.prototype.getName = function () {
    return getFilenameFromPath(this.path);
}

function getFilenameFromPath(path) {
    return path.replace(/^.*[\\\/]/, '');
}

function stripExtensionFromName(name) {
    return name.replace(/\.[^/.]+$/, "")
}