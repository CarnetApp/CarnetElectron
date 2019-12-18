var JSZip = require('jszip');
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
const intoStream = require('into-stream');
var textVersion = require("textversionjs");

var getParentFolderFromPath = require("../../utils/file_utils").FileUtils.getParentFolderFromPath
var ZipNoteOpener = function (note) {
    this.note = note;

}


ZipNoteOpener.prototype.getMainTextMetadataAndPreviews = function (callback) {
    var opener = this;
    this.getFullHTML(function (data, zip) {
        if (zip != undefined) {
            opener.getMetadataString(zip, function (metadata) {
                opener.getMediaList(zip, function (previews, media) {
                    callback(textVersion(data), metadata != undefined ? JSON.parse(metadata) : undefined, previews, media)

                })
            })
        } else {
            callback(undefined, undefined)

        }
    });
}

ZipNoteOpener.prototype.getMediaList = function (zip, callback) {
    var p = new MediaLister(zip, callback)
    p.start();
}

var MediaLister = function (zip, callback) {
    this.zip = zip;
    this.currentFile = 0;
    this.callback = callback;
    this.data = []
}

MediaLister.prototype.start = function () {
    var extractor = this;
    this.files = [];
    this.media = [];
    this.zip.folder("data").forEach(function (relativePath, file) {

        if (relativePath.startsWith("preview_")) {
            extractor.files.push(file.name)
        } else {
            extractor.media.push(file.name)

        }
    })
    this.callback(this.data, this.media)
}

var PreviewOpener = function (zip, callback) {
    this.zip = zip;
    this.currentFile = 0;
    this.callback = callback;
    this.data = []
}

PreviewOpener.prototype.start = function () {
    var extractor = this;
    this.files = [];
    this.media = [];
    this.zip.folder("data").forEach(function (relativePath, file) {

        if (relativePath.startsWith("preview_")) {
            extractor.files.push(file.name)
        } else {
            extractor.media.push(file.name)

        }
    })
    this.fullRead()
}

PreviewOpener.prototype.fullRead = function () {

    if (this.currentFile >= this.files.length || this.currentFile >= 2) {

        this.callback(this.data, this.media)
        return;
    }
    var filename = this.files[this.currentFile]
    var previewOpener = this;
    var file = this.zip.file(filename);

    if (file != null) {
        file.async('base64').then(function (content) {

            if (content != "") {
                previewOpener.data.push('data:image/jpeg;base64,' + content)

            }
            previewOpener.currentFile++;
            previewOpener.fullRead();
        });
    } else {
        previewOpener.currentFile++;
        previewOpener.fullRead();
    }
}

ZipNoteOpener.prototype.getMetadataString = function (zip, callback) {
    if (zip.file("metadata.json") != null)
        zip.file("metadata.json").async("string").then(callback)
    else {
        callback(undefined)
    }
}

const path = require('path')

ZipNoteOpener.prototype.getMedia = function (media, callback) {
    fs.readFile(this.note.path, function (err, data) {
        if (err) {
            callback(undefined, undefined)
            return console.logDebug(err);
        }

        if (data.length != 0)
            JSZip.loadAsync(data, {
                base64: true
            }).then(function (zip) {
                zip.file(media).async("arraybuffer").then(function (content) {
                    callback(intoStream(content), zip)
                })
            }, function (e) {
                callback(undefined, undefined)
            });
        else callback(undefined, undefined)
    });

}
ZipNoteOpener.prototype.openTo = function (path, callback) {
    var opener = this;
    console.logDebug("extractTo")
    fs.readFile(this.note.path, 'base64', function (err, data) {
        if (!err) {
            var extractor = new Extractor(data, path, opener, callback)
            extractor.start();
        } else callback(true)
    });
}

ZipNoteOpener.prototype.getFullHTML = function (callback) {
    console.logDebug("this.note.path  " + this.note.path)

    fs.readFile(this.note.path, function (err, data) {
        if (err) {
            console.logDebug("error ")
            callback(undefined, undefined)
            return console.logDebug(err);
        }

        if (data.length != 0)
            JSZip.loadAsync(data, {
                base64: true
            }).then(function (zip) {

                zip.file("index.html").async("string").then(function (content) {

                    callback(content, zip)
                })
            }, function (e) {
                callback(undefined, undefined)
            });
        else callback(undefined, undefined)
    });
}


ZipNoteOpener.prototype.saveFrom = function (path, modifiedFiles, deletedFiles, callback) {
    var comp = new Compressor(path, this.note.path, callback);
    comp.start();
}

var Extractor = function (data, dest, opener, callback) {
    this.data = data;
    this.currentFile = 0;
    this.path = dest;
    this.startTime = Date.now()
    this.callback = callback;
    this.opener = opener;
    this.previews = {}
}

Extractor.prototype.start = function () {
    this.zip = new JSZip();
    var extractor = this;
    this.zip.loadAsync(this.data, {
        base64: true
    }).then(function (contents) {
        extractor.files = Object.keys(contents.files);
        extractor.fullExtract()
    });
}

Extractor.prototype.fullExtract = function () {
    console.logDebug("fullExtract = " + this.files.length)

    if (this.currentFile >= this.files.length) {
        console.logDebug("size = " + this.files.length)
        console.logDebug("took " + (Date.now() - this.startTime) + "ms")
        this.callback(false, this.previews)
        return;
    }
    var filename = this.files[this.currentFile]
    var extractor = this;
    console.logDebug("extract  = " + filename)
    var file = this.zip.file(filename);

    if (file != null) {
        file.async('base64').then(function (content) {


            if (content != "") {

                var dest = extractor.path + filename;
                console.logDebug("mkdir");
                mkdirp.sync(getParentFolderFromPath(dest));
                console.logDebug("mkdirok");

                fs.writeFileSync(dest, content, 'base64');
                if (filename.startsWith("data/preview_")) {
                    extractor.previews[filename.substr("data/".length)] = 'data:image/jpeg;base64,' + content;
                }


            }
            extractor.currentFile++;
            extractor.fullExtract();
        });
    } else {
        extractor.currentFile++;
        extractor.fullExtract();
    }
}


var Compressor = function (source, dest, callback) {
    this.source = source;
    this.currentFile = 0;
    this.path = dest;
    this.callback = callback;
}

Compressor.prototype.start = function () {
    var fs = require('fs');
    var archiver = require('archiver');
    console.logDebug("start")
    var archive = archiver.create('zip');
    var output = fs.createWriteStream(this.path);
    output.on('close', function () {
        compressor.callback()
    });
    archive.pipe(output);
    var compressor = this;
    archive
        .directory(this.source, false)
        .finalize();


}
exports.ZipNoteOpener = ZipNoteOpener