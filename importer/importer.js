var FileUtils = require("../utils/file_utils.js").FileUtils
var Importer = function (destPath) {
    this.elem = document.getElementById("table-container");
    this.progressView = document.getElementById("progress-view");
    this.destPath = destPath;
    this.importingSpan = document.getElementById("importing");
    this.webview = document.getElementById("webview")
    var settingsHelper = require("../settings/settings_helper").SettingsHelper
    var SettingsHelper = new settingsHelper();
    this.notePath = SettingsHelper.getNotePath();
    var importer = this
    document.getElementById("folder-picker").style.display = "none"
    $("#note-selection-view").hide();
    $("#importing-view").hide();

    document.getElementById("select-folder-button").onclick = function () {
        document.getElementById("folder-picker").style.display = "block"

    }
    this.webview.addEventListener('ipc-message', event => {
        // prints "ping"
        if (event.channel == "pathSelected") {
            importer.path = event.args[0]
            console.log("event.channel " + event.args[0])
            importer.fillNoteList(function () { })
            document.getElementById("folder-picker").style.display = "none"
            $("#select-folder").hide()
            $("#note-selection-view").show()
        }
    })

}

function generateUID() {
    // I generate the UID from two parts here
    // to ensure the random number provide enough bits.
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

Importer.prototype.listNotes = function (callback) {
    var fs = require("fs");
    var FileUtils = require("../utils/file_utils.js").FileUtils

    var importer = this;
    fs.readdir(this.path, (err, dir) => {
        if (err)
            callback(false);
        else {
            importer.result = []
            importer.dir = dir;
            importer.readNext(callback)
        }

    });
}

function keysrt(key, desc) {
    return function (a, b) {
        return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
    }
}

Importer.prototype.importNotes = function () {
    $("#importing-view").show();
    $("#note-selection-view").hide()
    this.notesToImport = this.getSelectedNotes()
    this.timeStampedNotes = []
    this.timeStampedKeywords = []
    var importer = this;
    this.importNext(function () {
        console.log(importer.timeStampedNotes.length + " note(s) imported " + document.getElementById("add-to-recent-cb").checked)
        if (document.getElementById("add-to-recent-cb").checked) {
            importer.timeStampedNotes.sort(keysrt('time'))
            importer.timeStampedKeywords.sort(keysrt('time'))
            var paths = []
            for (var er of importer.timeStampedNotes) {
                paths.push(er.path)
            }
            var RecentDBManager = require("../server/recent/local_recent_db_manager").LocalRecentDBManager
            var db = new RecentDBManager(SettingsHelper.getNotePath() + "/quickdoc/recentdb/" + SettingsHelper.getAppUid())
            db.actionArray(importer.timeStampedNotes, function () {
                importer.importingSpan.innerHTML = importer.timeStampedNotes.length + " note(s) imported";

            })
        } else {
            importer.importingSpan.innerHTML = importer.timeStampedNotes.length + " note(s) imported";

        }
        var KeywordsDBManager = require("../server/keywords/keywords_db_manager").KeywordsDBManager
        var db = new KeywordsDBManager(SettingsHelper.getNotePath() + "/quickdoc/keywords/" + SettingsHelper.getAppUid())
        db.actionArray(importer.timeStampedKeywords, function () {
            importer.importingSpan.innerHTML = importer.timeStampedNotes.length + " note(s) imported";

        })
    })
}

Importer.prototype.importNext = function (callback) {
    if (this.notesToImport.length <= 0) {
        callback();
        return;
    }
    var notePath = this.notesToImport.pop();
    var importer = this;
    var FileUtils = require("../utils/file_utils.js").FileUtils
    this.importNote(notePath, this.destPath, function () {
        importer.importNext(callback);
    })
}

Importer.prototype.fillNoteList = function (callback) {
    var importer = this;
    $(this.progressView).show();
    for (var elem of document.getElementsByClassName("import-button")) {
        $(elem).hide();
    }
    $("#add-to-recent").hide();
    this.listNotes(function (success, notes) {
        var table = document.createElement("table");
        table.classList.add("mdl-data-table")
        table.classList.add("mdl-js-data-table")
        table.classList.add("mdl-data-table--selectable")
        table.classList.add("mdl-shadow--2dp")
        var head = document.createElement("thead");
        table.appendChild(head)
        var tr = document.createElement("tr");
        head.appendChild(tr)
        var th = document.createElement("th");
        th.classList.add("mdl-data-table__cell--non-numeric")
        th.innerHTML = "Title"
        tr.appendChild(th)
        var tbody = document.createElement("tbody");
        table.appendChild(tbody)


        importer.elem.appendChild(table)
        for (var note of notes) {
            var tr = document.createElement("tr");
            tbody.appendChild(tr)

            var td = document.createElement("td");
            td.classList.add("mdl-data-table__cell--non-numeric")
            tr.appendChild(td)
            td.innerHTML = note.title
            td = document.createElement("td");
            tr.appendChild(td)
            td.classList.add("value")
            td.innerHTML = note.path


        }
        new MaterialDataTable(table)
        $(importer.progressView).hide()
        for (var elem of document.getElementsByClassName("import-button")) {
            $(elem).show();
        }
        $("#add-to-recent").show();
        callback()
    })
}

Importer.prototype.getSelectedNotes = function () {
    var toImport = [];
    for (var note of document.getElementsByClassName("value")) {
        if (note.parentElement.getElementsByClassName("mdl-checkbox__input")[0].checked)
            toImport.push(note.innerText)
    }
    return toImport;
}
Importer.prototype.readNext = function (callback) {
    if (this.dir.length == 0 || this.result.length == -1) {
        callback(true, this.result)

        return;
    }
    var importer = this;
    var fileName = this.dir.pop()
    var fs = require("fs");
    fs.readFile(this.path + "/" + fileName, 'base64', function (err, data) {
        if (err) {
            callback(false)
            return;
        }
        var buffer = new Buffer(data, 'base64');
        var file = buffer.toString()
        if (file.indexOf("<?xml") > -1) {
            var container = document.createElement("div");
            container.innerHTML = file
            var thisTitle = container.querySelector("title").innerHTML;
            console.log(thisTitle)
            importer.result.push({
                title: thisTitle,
                path: importer.path + "/" + fileName
            })

        } else {

            console.log(fileName + " " + "unknown")

        }
        setTimeout(function () {
            importer.readNext(callback)

        }, 10)

    });
}

Importer.prototype.writeNext = function (callback) {
    if (this.toWrite.length <= 0) {
        callback()
        return;
    }
    var fs = require("fs");
    var importer = this;
    var toWrite = this.toWrite.pop()
    console.log("write to " + toWrite.path + " " + toWrite.type)
    var mkdirp = require('mkdirp');
    mkdirp.sync(FileUtils.getParentFolderFromPath(toWrite.path));
    fs.writeFile(toWrite.path, toWrite.data, {
        encoding: toWrite.type
    }, function (err) {
        console.log(err)
        importer.writeNext(callback)

    });
}

function DateError() { }

Importer.prototype.importNote = function (keepNotePath, destFolder, callback) {
    var FileUtils = require("../utils/file_utils.js").FileUtils
    var fileName = FileUtils.getFilename(keepNotePath);
    this.importingSpan.innerHTML = fileName + " (" + this.notesToImport.length + " remaining)";
    var fs = require("fs");
    console.log(keepNotePath)
    var importer = this;
    fs.readFile(keepNotePath, 'base64', function (err, data) {
        if (err) {
            console.log(err)

            callback()
            return
        }
        importer.toWrite = []
        var buffer = new Buffer(data, 'base64');
        var content = buffer.toString()
        var container = document.createElement("div");
        container.innerHTML = content
        var titleDiv = container.querySelector("title")
        var title = "";
        if (titleDiv != null)
            title = titleDiv.innerHTML;
        console.log("title " + title)
        var textDiv = container.querySelector(".content");
        var text = "";
        if (textDiv != null)
            text = textDiv.innerHTML;
        importer.toWrite.push({
            type: "utf8",
            path: "importtmp/index.html",
            data: '<div id="text" contenteditable="true" style="height:100%;">\
        <!-- be aware that THIS will be modified in java -->\
        <!-- soft won\'t save note if contains -->' + text + '\
    </div>\
    <div id="floating">\
    \
    </div>'
        })

        console.log("text " + text)
        var labels = container.getElementsByClassName("label");
        var keywords = [];
        var dateDiv = container.querySelector(".heading");
        console.log(dateDiv.innerText.trim())


        console.log(escape(dateDiv.innerText.trim()).replace("%E0%20", ""))
        var date = dateDiv.innerText.trim();
        //escape unescape only way I've found to replace the à which didn't work with simple replace("à ","")
        var fixedDate = unescape(escape(date).replace("%E0%20", "").replace("%E9", "e").replace("%FB", "u")).replace("at ", "").replace("à ", "")
            .replace("&agrave; ", "")
            .replace("juin", "june")
            .replace("juil.", "july")
            .replace("mars", "march")
            .replace("oct.", "october")
            .replace("jan.", "january")
            .replace("janv.", "january")
            .replace("sept.", "september")
            .replace("déc.", "december")
            .replace("dec.", "december")
            .replace("fevr.", "february")
            .replace("avr.", "april")
            .replace("nov.", "november")
            .replace("mai", "may")
            .replace("aout", "august");
        console.log(fixedDate)
        var time = getDateFromFormat(fixedDate, "dd MMM yyyy HH:mm:ss")
        if (time == 0) //try different
            time = getDateFromFormat(fixedDate, "d MMM yyyy HH:mm:ss")
        if (time == 0) //try moment
            time = moment(fixedDate).toDate().getTime()
        if (time == 0)
            throw new DateError()
        var notePath = destFolder + "/" + (title == date ? "untitled" : "") + FileUtils.stripExtensionFromName(fileName) + ".sqd"
        importer.timeStampedNotes.push({
            action: "add",
            time: time,
            path: notePath.substring((importer.notePath + '/').length)
        });

        console.log(time)
        if (labels != undefined) {
            for (var label of labels) {
                if (keywords.indexOf(label.innerText) >= 0)
                    continue;
                keywords.push(label.innerText)
                console.log("label " + label.innerText)
                importer.timeStampedKeywords.push({
                    action: 'add',
                    time: time,
                    path: notePath.substring((importer.notePath + '/').length),
                    keyword: label.innerText
                })

            }
        }
        var metadata = {
            creation_date: time,
            last_modification_date: time,
            keywords: keywords
        }
        console.log("meta " + JSON.stringify(metadata))

        importer.toWrite.push({
            type: "utf8",
            path: "importtmp/metadata.json",
            data: JSON.stringify(metadata)
        })
        //attachments
        var attachments = container.querySelector(".attachments");
        var base64Files = []
        if (attachments != undefined) {


            var audioFiles = attachments.getElementsByClassName("audio");
            if (audioFiles != undefined) {
                for (var audioFile of audioFiles) {
                    var data = audioFile.getAttribute("href")

                    importer.toWrite.push({
                        type: "base64",
                        path: "importtmp/data/" + generateUID() + "." + FileUtils.getExtensionFromMimetype(FileUtils.base64MimeType(data)),
                        data: data.substr(data.indexOf(',') + 1)
                    })
                }
            }

            var imgFiles = attachments.getElementsByTagName("img");
            if (imgFiles != undefined) {
                for (var imageFile of imgFiles) {
                    console.log("adding img1")

                    var data = imageFile.getAttribute("src")
                    console.log("adding img")
                    importer.toWrite.push({
                        type: "base64",
                        path: "importtmp/data/" + generateUID() + "." + FileUtils.getExtensionFromMimetype(FileUtils.base64MimeType(data)),
                        data: data.substr(data.indexOf(',') + 1)
                    })
                }
            }


        }


        FileUtils.deleteFolderRecursive("importtmp");

        var mkdirp = require('mkdirp');
        mkdirp.sync("importtmp");
        importer.writeNext(function () {
            console.log("callback, zip to " + notePath)
            var archiver = require("archiver")
            var archive = archiver.create('zip');
            mkdirp(destFolder)

            var output = fs.createWriteStream(notePath);
            output.on('close', function () {
                callback()
            });

            archive.pipe(output);


            archive
                .directory("importtmp", false)
                .finalize();

        })



    });

}
