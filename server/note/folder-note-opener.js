var fs = require('fs-extra');
var NoteUtils = require("./NoteUtils").NoteUtils;
const path = require('path')

var getParentFolderFromPath = require("../../utils/file_utils").FileUtils.getParentFolderFromPath
var FolderNoteOpener = function (note, relativeNotePath) {
    this.note = note;
    this.relativeNotePath = relativeNotePath;
}


FolderNoteOpener.prototype.getMainTextMetadataAndPreviews = function (callback) {
    var opener = this;
    this.getFullHTML(function (data) {
        opener.getMetadataString(function (metadata) {
            opener.getMediaList(function (previews, media) {
                callback(NoteUtils.getShortText(data), metadata != undefined ? JSON.parse(metadata) : undefined, previews, media)
            })
        })
    });
}



FolderNoteOpener.prototype.getMediaList = function (callback) {
    fs.readdir(path.join(this.note.path, "data"), (err, files) => {
        var previews = []
        var media = []
        if (!err) {
            for (let file of files) {
                if (file.startsWith("preview_"))
                    previews.push("getMedia?note=" + this.relativeNotePath + "&media=data/" + file)
                else
                    media.push("getMedia?note=" + this.relativeNotePath + "&media=data/" + file)
            }
        }
        callback(previews, media)
    })
}



FolderNoteOpener.prototype.getMetadataString = function (callback) {
    this.getFileContentString("metadata.json", callback);
}


FolderNoteOpener.prototype.getMedia = function (media, callback) {
    var readStream = fs.createReadStream(path.join(this.note.path, media));
    readStream.on('open', function () {
        callback(readStream, undefined)
    });
    readStream.on('error', function (err) {
        callback(undefined, undefined)
    });

}

FolderNoteOpener.prototype.getFileContentString = function (filepath, callback) {
    fs.readFile(path.join(this.note.path, filepath), 'utf8', function (err, data) {
        if (err) {
            callback(undefined)
            return console.logDebug(err);
        }
        if (data.length != 0)
            callback(data)
        else callback(undefined)
    });
}

FolderNoteOpener.prototype.getFullHTML = function (callback) {
    this.getFileContentString("index.html", callback);
}


FolderNoteOpener.prototype.openTo = function (path, callback) {
    var opener = this
    fs.copy(this.note.path, path, err => {
        if (err) return callback(true)
        callback(false)

    })
}

FolderNoteOpener.prototype.saveFrom = function (fromPath, modifiedFiles, deletedFiles, callback) {
    var opener = this;
    if (modifiedFiles != undefined) {
        for (var modifiedFile of modifiedFiles) {
            var parent = getParentFolderFromPath(modifiedFile)
            var toDir = path.join(opener.note.path, parent)
            try {
                fs.mkdirSync(toDir)
            } catch (e) {

            }
            fs.copySync(path.join(fromPath, modifiedFile), path.join(opener.note.path, modifiedFile))

        }
    }
    if (deletedFiles != undefined) {
        for (var deletedFile of deletedFiles) {
            fs.unlinkSync(path.join(opener.note.path, deletedFile))

        }
    }
    callback(false)
}


exports.FolderNoteOpener = FolderNoteOpener
