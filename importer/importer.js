new RequestBuilder();
var Importer = function (destPath) {
    this.elem = document.getElementById("table-container");
    this.progressView = document.getElementById("progress-view");
    this.destPath = destPath;
    this.importingSpan = document.getElementById("importing");
    this.webview = document.getElementById("webview")
    var importer = this
    document.getElementById("folder-picker").style.display = "none"
    $("#note-selection-view").hide();
    $("#importing-view").hide();

    document.getElementById("select-folder-button").onclick = function () {
        document.getElementById("input_file").click();

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
    document.getElementById("input_file").onchange = function () {
        importer.onArchiveSelected(this.files[0])
    }

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
        importer.importingSpan.innerHTML = importer.timeStampedNotes.length + " note(s) imported";
        /*console.log(importer.timeStampedNotes.length + " note(s) imported " + document.getElementById("add-to-recent-cb").checked)
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

        })*/
    })
}

Importer.prototype.importNext = function (callback) {
    if (this.notesToImport.length <= 0) {
        callback();
        return;
    }
    var notePath = this.notesToImport.pop();
    var importer = this;
    this.importNote(notePath, this.destPath, function () {
        importer.importNext(callback);
    })
}

Importer.prototype.onArchiveSelected = function (archive) {
    var importer = this
    JSZip.loadAsync(archive).then(function (zip) {
        var list = []
        importer.currentZip = zip
        // if you return a promise in a "then", you will chain the two promises
        zip.folder("Takeout/Keep").forEach(function (relativePath, zipEntry) {  // 2) print entries
            console.log("note " + relativePath)
            if (relativePath.endsWith(".json"))
                list.push(relativePath)
        });
        document.getElementById("folder-picker").style.display = "none"
        $("#select-folder").hide()
        $("#note-selection-view").show()
        importer.fillNoteList(function () { }, list)

    })

}

Importer.prototype.fillNoteList = function (callback, list) {
    var importer = this;
    $(this.progressView).show();
    for (var elem of document.getElementsByClassName("import-button")) {
        $(elem).hide();
    }
    $("#add-to-recent").hide();
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
    for (var note of list) {
        var tr = document.createElement("tr");
        tbody.appendChild(tr)

        var td = document.createElement("td");
        td.classList.add("mdl-data-table__cell--non-numeric")
        tr.appendChild(td)
        td.innerHTML = note
        td = document.createElement("td");
        tr.appendChild(td)
        td.classList.add("value")
        td.innerHTML = note


    }
    new MaterialDataTable(table)
    $(importer.progressView).hide()
    for (var elem of document.getElementsByClassName("import-button")) {
        $(elem).show();
    }
    $("#add-to-recent").show();
    callback()

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

    var fileName = FileUtils.getFilename(keepNotePath);
    this.importingSpan.innerHTML = fileName + " (" + this.notesToImport.length + " remaining)";
    if (fileName.endsWith(".json"))
        this.importNoteJson(keepNotePath, destFolder, callback)
    else
        this.oldImportNote(keepNotePath, destFolder, callback)
}


Importer.prototype.importNoteAttachments = function (destZip, attachments, callback) {
    this.importNoteAttachment(destZip, attachments, callback)

}

Importer.prototype.importNoteAttachment = function (destZip, attachments, callback) {
    if (attachments == undefined || attachments.length <= 0) {
        callback()
        return;
    }
    var importer = this;
    var attachment = attachments.pop()
    var attachmentName = attachment['filePath']
    if (attachmentName.endsWith("jpeg"))
        attachmentName = attachmentName.substr(0, attachmentName.length - 4) + "jpg"
    console.log("attachment " + "Takeout/Keep/" + attachmentName)

    this.currentZip.files["Takeout/Keep/" + attachmentName].async("base64")
        .then(function (data) {
            destZip.file("data/" + attachmentName, data, { base64: true });

            if (FileUtils.isFileImage(attachmentName)) {
                var img = new Image();

                img.onload = function () {

                    var maxWidth = 400,
                        maxHeight = 400,
                        imageWidth = img.width,
                        imageHeight = img.height;


                    if (imageWidth > imageHeight) {
                        if (imageWidth > maxWidth) {
                            imageHeight *= maxWidth / imageWidth;
                            imageWidth = maxWidth;
                        }
                    }
                    else if (imageHeight > maxHeight) {
                        imageWidth *= maxHeight / imageHeight;
                        imageHeight = maxHeight;
                    }
                    var canvas = document.createElement('canvas');
                    canvas.width = imageWidth;
                    canvas.height = imageHeight;
                    this.width = imageWidth;
                    this.height = imageHeight;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(this, 0, 0, imageWidth, imageHeight);
                    //console.log(canvas.toDataURL('image/jpeg').substr("data:image/jpeg;base64,".length));
                    destZip.file("data/" + "preview_" + attachmentName + ".jpg", canvas.toDataURL('image/jpeg').substr("data:image/jpeg;base64,".length), { base64: true });
                    importer.importNoteAttachment(destZip, attachments, callback)
                };

                img.src = "data:" + attachment['mimetype'] + ";base64," + data;
            }
            else importer.importNoteAttachment(destZip, attachments, callback)
        });
}
Importer.prototype.importNoteJson = function (keepNotePath, destFolder, callback) {
    var importer = this
    var fileName = FileUtils.getFilename(keepNotePath);
    this.currentZip.files["Takeout/Keep/" + keepNotePath].async('text').then(function (txt) {
        var json = JSON.parse(txt)
        console.log(json['title']);
        var zip = new JSZip();
        zip.file("index.html", '<div id="text" contenteditable="true" style="height:100%;">\
            <!-- be aware that THIS will be modified in java -->\
            <!-- soft won\'t save note if contains -->' + Utils.nl2br(json['textContent']) + '\
        </div>\
        <div id="floating">\
        \
        </div>');
        var filename = keepNotePath.substr(0, keepNotePath.length - 4) + "sqd"
        if (json['title'] === "")
            filename = "untitled " + filename;
        var metadata = {}
        metadata['creation_date'] = json['userEditedTimestampUsec']
        metadata['title'] = json['title']
        metadata['last_modification_date'] = json['userEditedTimestampUsec']
        metadata['keywords'] = []
        metadata['rating'] = -1
        metadata['color'] = "none"
        metadata['urls'] = {}
        metadata['todolists'] = []
        if (json['labels'] != undefined)
            for (var label of json['labels'])
                metadata['keywords'].push(label)
        if (json['annotations'] != undefined) {
            for (var annotation of json['annotations']) {
                if (annotation['url'] != undefined) {
                    var url = {}
                    url['title'] = annotation['title']
                    url['description'] = annotation['description']
                    metadata['urls'][annotation['url']] = url
                }
            }
        }
        zip.file("metadata.json", JSON.stringify(metadata));

        importer.importNoteAttachments(zip, json['attachments'], function () {
            //zip.saveAs(blob, "hello.zip");
            console.log("generateAsync")
            importer.sendNote(zip, metadata)

        })

    })

}

Importer.prototype.sendNote = function (zip, metadata) {
    zip.generateAsync({ type: "blob" }).then(function (blob) {
        var files = []

        blob.name = filename
        files.push(blob)
        RequestBuilder.sRequestBuilder.postFiles("/note/import", {

        }, files, function (error, data) {
            console.log("error " + error)
            if (error) {
                importer.onError()
            } else {
                var db = RecentDBManager.getInstance()
                var keywordDB = new KeywordsDBManager();
                keywordDB.removeFromDB(undefined, note.path, function (error, data) {
                    console.log("deleted from db " + error)
                    if (!error)
                        db.removeFromDB(note.path, function (error, data) {
                            console.log("deleted from db " + error)
                            if (!error)
                                callback()
                            else
                                importer.onError()

                        });

                    else
                        importer.onError()
                });

            }
        })
    }, function (err) {

    });
}

Importer.prototype.oldImportNote = function (keepNotePath, destFolder, callback) {
    var fileName = FileUtils.getFilename(keepNotePath);
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
