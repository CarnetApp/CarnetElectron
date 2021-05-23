new RequestBuilder(Utils.getParameterByName("api_path") != null ? Utils.getParameterByName("api_path") : undefined);
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
    $('#import-finished').hide();
    document.getElementById("import-button1").onclick = document.getElementById("import-button2").onclick = function () {
        importer.importNotes()
    }
    document.getElementById("select-folder-button").onclick = function () {
        document.getElementById("input_file").click();

    }
    document.getElementById("back_arrow").onclick = document.getElementById("exit-button").onclick = function () {
        compatibility.exit()
    }
    this.webview.addEventListener('ipc-message', event => {
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
    this.error = []
    var importer = this;
    importer.imported = 0;
    this.importNext(function () {
        $('#import-finished').show();
        $('#importing-view').hide();

        $('#import-report').html(importer.imported + " note(s) imported <br />" + importer.error.length + " failed");
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
    this.archive = archive
    var importer = this
    importer.archiveName = archive.name;
    console.log("$(input[name='archive-type']:checked).val() " + $("input[name='archive-type']:checked").val())
    switch (parseInt($("input[name='archive-type']:checked").val())) {
        case 0:
            importer.converter = new GoogleConverter(this);
            importer.loadNoteList()
            break;
        default:
            importer.converter = new CarnetConverter(this);
            if(!compatibility.isElectron)
                importer.displayChooseWholeArchiveOrSelectNotes()
            else{
                $("#archive-or-notes-selection").hide()
                this.loadNoteList()
            }

    }
    importer.destPath = importer.converter.getDestPath()
    $("#select-folder").hide()
    document.getElementById("folder-picker").style.display = "none"
}

Importer.prototype.displayChooseWholeArchiveOrSelectNotes = function () {
    var files = []
    files.push(this.archive)
    $("#archive-or-notes-selection").show()
    document.getElementById("select-notes-button").onclick = () => {
        $("#archive-or-notes-selection").hide()
        this.loadNoteList()
    }
    document.getElementById("send-archive-button").onclick = () => {
        let progressBar = document.getElementById("progress-bar");
        RequestBuilder.sRequestBuilder.postFiles("/note/import_archive", {

        }, files, function (error, data) {
            console.log("send " + error)

            $('#import-finished').show();
            $('#importing-view').hide();
            if (error)
                $('#import-report').html($.i18n("import_error"));
            else
                $('#import-report').html($.i18n("import_success"));

        }, function (percentComplete) {

            progressBar.classList.remove("mdl-progress__indeterminate")
            progressBar.MaterialProgress.setProgress(percentComplete)
            $("#archive-or-notes-selection").hide()
            console.log("sending " + percentComplete)
            $("#importing-view").show();
            document.getElementById("importing").innerHTML = Math.trunc(percentComplete) + "%<br /> Please wait"
            if (percentComplete == 100)
                progressBar.classList.add("mdl-progress__indeterminate")

        })
    }
}

Importer.prototype.loadNoteList = function () {
    JSZip.loadAsync(this.archive).then(function (zip) {
        importer.currentZip = zip
        importer.converter.getListOfNotesFromZip(zip, (list) => {


            $("#note-selection-view").show()
            importer.fillNoteList(function () { }, list)
        })
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

    this.importingSpan.innerHTML = FileUtils.getFilename(keepNotePath) + " (" + this.notesToImport.length + " remaining)";
    this.converter.convertNoteToSQD(this.currentZip, keepNotePath, destFolder, function (zip, metadata, fileName, isPinned, path) {
        console.log("path " + path)
        if (zip != undefined)
            importer.sendNote(zip, metadata, fileName, isPinned, path, callback)
        else {
            importer.error.push(keepNotePath)
            callback()
        }
    })
}

Importer.prototype.onError = function (filename) {
    this.error.push(filename);
}

Importer.prototype.sendNote = function (blob, metadata, filename, isPinned, path, callback) {
    var self = this
    console.log("metadata " + metadata)
    var files = []

    blob.name = filename
    files.push(blob)
    console.log("document.getElementById().checked " + document.getElementById("add-to-recent-cb").checked)
    RequestBuilder.sRequestBuilder.postFiles("/note/import", {
        add_to_recent: document.getElementById("add-to-recent-cb").checked,
        path: path,
        is_pinned: isPinned,
        metadata: metadata
    }, files, function (error, data) {
        console.log("error " + error)
        if (error) {
            self.onError(filename)
            callback()
        } else {
            self.imported = self.imported + 1;
            callback()

        }
    })

}
var importer;
$(document).ready(function () {
    importer = new Importer("/Keep");
    $.i18n().locale = navigator.language;
    compatibility.loadLang(function () {
        $('body').i18n();
    })
})
