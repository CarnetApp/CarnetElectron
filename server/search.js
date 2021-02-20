var fs = require("fs");
var Search = function (keyword, path) {
    this.keyword = cleanText(keyword);
    this.path = path
}

Search.prototype.start = function () {
    this.fileList = [];
    this.toVisit = [];
    this.result = [];
    var search = this;

    this.recursiveVisit(this.path, function () {
        if (search.fileList.length > 0) {
            search.searchInFiles();
        }
    })
}
Search.prototype.searchInFiles = function () {
    var search = this;
    if (search.fileList.length > 0) {
        this.searchInFile(search.fileList.pop(), function () {
            setTimeout(function () {
                search.searchInFiles()
            }, 50)
        })
    } else {

    }

}

function getFilenameFromPath(path) {
    return path.replace(/^.*[\\\/]/, '');
}

function stripExtensionFromName(name) {
    return name.replace(/\.[^/.]+$/, "")
}
function cleanText(text) {
    if (text == undefined || typeof text != "string")
        return "";
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
}
Search.prototype.searchInFile = function (filePath, callback) {
    console.log("searchInFile " + filePath)
    var NoteOpener = require("./note/note-opener").NoteOpener
    var Note = require("../browsers/note").Note

    var opener = new NoteOpener(new Note(filePath, "", filePath, undefined))
    var search = this;
    try {

        opener.getMainTextMetadataAndPreviews(function (txt, metadata) {
            var fileName = stripExtensionFromName(getFilenameFromPath(filePath));

            var inKeywords = false
            if (metadata !== undefined) {
                for (var keyword of metadata.keywords) {
                    if (cleanText(keyword).indexOf(search.keyword) >= 0) {
                        inKeywords = true;
                        break;
                    }
                }
            }

            if (inKeywords || cleanText(fileName).indexOf(search.keyword) >= 0 || txt !== undefined && cleanText(txt).indexOf(search.keyword) >= 0) {
                search.result.push({
                    name: fileName,
                    path: filePath.substr(search.path.length),
                    isDir: false,
                    mtime: 0
                })
                console.log("found in " + filePath)

            }
            callback()
        });
    } catch (error) {
        console.log(error);
        callback()
    }
}
Search.prototype.recursiveVisit = function (path, callback) {
    var search = this;
    console.log("visiting " + path)
    fs.readdir(path, (err, dir) => {

        if (!err)
            for (var filePath of dir) {
                filePath = path + "/" + filePath;
                var stat = fs.statSync(filePath);

                if (filePath.endsWith(".sqd")) {
                    search.fileList.push(filePath)
                } else if (!stat.isFile()) {
                    search.toVisit.push(filePath)
                }
            }
        if (search.toVisit.length > 0) {
            setTimeout(function () {
                search.recursiveVisit(search.toVisit.pop(), callback)

            }, 50)
        } else
            callback()
    });
}
exports.Search = Search