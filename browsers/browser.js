var initPath = "recentdb://"
var currentPath;
var currentTask = undefined;
var noteCardViewGrid = undefined;
var notePath = []
var oldFiles = undefined;
var wasNewNote = false
var dontOpen = false;
var currentNotePath = undefined
var root_url = document.getElementById("root-url") != undefined ? document.getElementById("root-url").innerHTML : "";
new RequestBuilder();
/*const {
    ipcRenderer,
    remote,
    app
} = require('electron');*/
const store = new Store();
var noteCacheStr = String(store.get("note_cache"))
if (noteCacheStr == "undefined")
    noteCacheStr = "{}"
var oldNotes = JSON.parse(noteCacheStr);
/*var main = remote.require("./main.js");
var SettingsHelper = require("./settings/settings_helper").SettingsHelper
var settingsHelper = new SettingsHelper()*/
var TextGetterTask = function (list) {
    this.list = list;
    this.current = 0;
    this.continue = true;
    this.stopAt = 50;
}

TextGetterTask.prototype.startList = function () {
    this.getNext();
}

TextGetterTask.prototype.getNext = function () {
    console.log(this.current)
    if (this.current >= this.stopAt || this.current >= this.list.length) {
        console.log("save cache ")
        store.set("note_cache", JSON.stringify(oldNotes))
        return;
    }

    var paths = "";
    var start = this.current;
    for (var i = start; i < this.stopAt && i < this.list.length && i - start < 10; i++) { //do it ten by ten
        this.current = i + 1
        if (!(this.list[i] instanceof Note))
            continue;
        paths += this.list[i].path + ",";
        if (oldNotes[this.list[i].path] == undefined)
            oldNotes[this.list[i].path] = this.list[i];
    }
    var myTask = this;
    RequestBuilder.sRequestBuilder.get("/metadata?paths=" + encodeURIComponent(paths), function (error, data) {
        for (var meta in data) {
            oldNotes[meta].metadata = data[meta].metadata != undefined ? data[meta].metadata : new NoteMetadata();
            oldNotes[meta].text = data[meta].shorttext;
            oldNotes[meta].previews = data[meta].previews;
            noteCardViewGrid.updateNote(oldNotes[meta])
            noteCardViewGrid.msnry.layout();
        }
        myTask.getNext();
    });
}


String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function openNote(notePath) {
    currentNotePath = notePath
    RequestBuilder.sRequestBuilder.get("/note/open/prepare", function (error, data) {
        console.log("opening " + data)
        if (error)
            return;
        if (writerFrame.src == "") {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf("android") > -1) {//open in new tab for firefox android
                window.open("writer?path=" + encodeURIComponent(notePath), "_blank");
            }
            else {

                $(loadingView).fadeIn(function () {
                    writerFrame.src = data + "?path=" + encodeURIComponent(notePath);
                    writerFrame.style.display = "inline-flex"
                })
            }
            /*setTimeout(function () {
                writerFrame.openDevTools()
            }, 1000)*/
        }
        else {
            console.log("reuse old iframe");

            $(loadingView).fadeIn(function () {
                if (compatibility.isElectron)
                    writerFrame.send('loadnote', notePath);
                else
                    writerFrame.contentWindow.loadPath(notePath);
                writerFrame.style.display = "inline-flex"
            })
        }
    })
    //window.location.assign("writer?path=" + encodeURIComponent(notePath));
}

var displaySnack = function (data) {
    var snackbarContainer = document.querySelector('#snackbar');
    if (!(typeof snackbarContainer.MaterialSnackbar == undefined))
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
}

function oldOpenNote(notePath) {
    currentNotePath = notePath
    const electron = require('electron')
    const remote = electron.remote;
    const BrowserWindow = remote.BrowserWindow;
    const path = require('path')
    //var win = new BrowserWindow({ width: 800, height: 600 });
    if (!hasLoadedOnce)
        $(loadingView).fadeIn();
    //$(browserElem).faceOut();
    var rimraf = require('rimraf');
    const tmp = path.join(main.getPath("temp"), "tmpquicknote");
    rimraf(tmp, function () {
        var fs = require('fs');

        fs.mkdir(tmp, function (e) {
            fs.readFile(__dirname + '/reader/reader.html', 'utf8', function (err, data) {
                if (err) {
                    fs.rea
                    console.log("error ")
                    return console.log(err);
                }
                const index = path.join(tmp, 'reader.html');
                fs.writeFileSync(index, data.replace(new RegExp('<!ROOTPATH>', 'g'), __dirname + '/'));
                /* var size = remote.getCurrentWindow().getSize();
                 var pos = remote.getCurrentWindow().getPosition();
                 var win = new BrowserWindow({
                     width: size[0],
                     height: size[1],
                     x: pos[0],
                     y: pos[1],
                     frame: false
                 });
                 console.log("w " + remote.getCurrentWindow().getPosition()[0])
                 const url = require('url')
                 win.loadURL(url.format({
                     pathname: path.join(__dirname, 'tmp/reader.html'),
                     protocol: 'file:',
                     query: {
                         'path': notePath
                     },
                     slashes: true
                 }))*/
                const url = require('url')

                if (!hasLoadedOnce) {
                    webview.setAttribute("src", url.format({
                        pathname: index,
                        protocol: 'file:',
                        query: {
                            'path': notePath,
                            'tmppath': tmp + "/"
                        },
                        slashes: true
                    }));
                } else
                    webview.send('loadnote', notePath);
                webview.style = "position:fixed; top:0px; left:0px; height:100%; width:100%; z-index:100; right:0; bottom:0;"
                //to resize properly
                hasLoadedOnce = true;
            });


        });

    })
}

function onDragEnd(gg) {
    console.log("ondragend")
    dontOpen = true;
}

function refreshKeywords() {
    var keywordsDBManager = new KeywordsDBManager()
    keywordsDBManager.getFlatenDB(function (error, data) {
        var keywordsContainer = document.getElementById("keywords");
        keywordsContainer.innerHTML = "";
        var dataArray = []
        for (let key in data) {
            if (data[key].length == 0)
                continue;
            dataArray.push(key)
        }
        dataArray.sort(Utils.caseInsensitiveSrt)
        for (let key of dataArray) {

            var keywordElem = document.createElement("a");
            keywordElem.classList.add("mdl-navigation__link")
            keywordElem.innerHTML = key;
            keywordElem.setAttribute("href", "");
            keywordElem.onclick = function () {
                toggleDrawer();
                list("keyword://" + key, false);
                return false;
            }
            keywordsContainer.appendChild(keywordElem)
        }
    })
}

function searchInNotes(searching) {
    resetGrid(false)
    notes = [];

    RequestBuilder.sRequestBuilder.get("/notes/search?path=." + "&query=" + encodeURIComponent(searching), function (error, data) {
        if (!error) {
            list("search://", true);
        }
    });

}

function resetGrid(discret) {
    var grid = document.getElementById("page-content");
    var scroll = 0;
    if (discret)
        scroll = document.getElementById("grid-container").scrollTop;
    grid.innerHTML = "";
    noteCardViewGrid = new NoteCardViewGrid(grid, discret, onDragEnd);
    this.noteCardViewGrid = noteCardViewGrid;
    noteCardViewGrid.onFolderClick(function (folder) {
        list(folder.path)
    })
    noteCardViewGrid.onNoteClick(function (note) {
        if (!dontOpen)
            openNote(note.path)
        dontOpen = false;
        // var reader = new Writer(note,"");
        // reader.extractNote()
    })


    noteCardViewGrid.onMenuClick(function (note) {
        mNoteContextualDialog.show(note)
    })
    return scroll;
}

class ContextualDialog {
    constructor() {
        this.showDelete = true;
        this.showArchive = true;
        this.showPin = true;
        this.dialog = document.querySelector('#contextual-dialog');
        this.nameInput = this.dialog.querySelector('#name-input');
        this.deleteButton = this.dialog.querySelector('.delete-button');
        this.archiveButton = this.dialog.querySelector('#archive-button');
        this.pinButton = this.dialog.querySelector('#pin-button');
        this.cancel = this.dialog.querySelector('.cancel');
        this.ok = this.dialog.querySelector('.ok');
        var context = this;
        this.cancel.onclick = function () {
            context.dialog.close();
        }
    }

    show() {
        this.showDelete ? $(this.deleteButton).show() : $(this.deleteButton).hide();
        this.showArchive ? $(this.archiveButton).show() : $(this.archiveButton).hide();
        this.showPin ? $(this.pinButton).show() : $(this.pinButton).hide();
        this.dialog.showModal();
        this.nameInput.focus()
    }
}

class NewFolderDialog extends ContextualDialog {
    constructor() {
        super();
        this.showDelete = false;
        this.showArchive = false;
        this.showPin = false;
    }

    show() {
        var context = this;

        this.ok.onclick = function () {
            RequestBuilder.sRequestBuilder.post("/browser/newfolder", {
                path: currentPath + "/" + context.nameInput.value
            }, function (error) {
                if (error) {


                }
                list(currentPath, true)
                context.dialog.close();
            })
        }
        super.show()

    }
}

class NoteContextualDialog extends ContextualDialog {
    constructor() {
        super();
    }

    show(note) {
        var context = this;
        this.nameInput.value = note.title;
        this.deleteButton.onclick = function () {
            var db = new RecentDBManager()
            var keywordDB = new KeywordsDBManager();
            context.dialog.close();
            db.removeFromDB(note.path, function (error, data) {
                console.log("deleted from db " + error)
                if (!error)
                    keywordDB.removeFromDB(undefined, note.path, function (error, data) {
                        console.log("deleted from db " + error)
                        if (!error)
                            RequestBuilder.sRequestBuilder.delete("/notes?path=" + encodeURIComponent(note.path), function () {
                                list(currentPath, true)
                            })
                    });
            });

        }
        this.archiveButton.onclick = function () {
            var db = new RecentDBManager()
            db.removeFromDB(note.path, function () {
                context.dialog.close();
                list(currentPath, true)
            });

        }
        if (note.isPinned == true) {
            this.pinButton.innerHTML = "Unpin"
        } else this.pinButton.innerHTML = "Pin"

        this.pinButton.onclick = function () {
            var db = new RecentDBManager()
            if (note.isPinned == true)
                db.unpin(note.path, function () {
                    context.dialog.close();
                    list(currentPath, true)
                });

            else
                db.pin(note.path, function () {
                    context.dialog.close();
                    list(currentPath, true)
                });
        }
        this.ok.onclick = function () {
            var path = FileUtils.getParentFolderFromPath(note.path);
            var hasOrigin = false;
            for (let part of context.nameInput.value.split("/")) {
                if (part == ".." && !hasOrigin) {
                    path = FileUtils.getParentFolderFromPath(path)
                } else {
                    hasOrigin = true;
                    path += "/" + part;
                }
            }
            RequestBuilder.sRequestBuilder.post("/notes/move", {
                from: note.path,
                to: path + ".sqd"
            }, function () {
                list(currentPath, true);
            });
            context.dialog.close();
        }
        super.show()

    }
}

var mNoteContextualDialog = new NoteContextualDialog()
var mNewFolderDialog = new NewFolderDialog()

var refreshTimeout = undefined;
function list(pathToList, discret) {
    if (refreshTimeout !== undefined)
        clearTimeout(refreshTimeout)
    if (pathToList == undefined)
        pathToList = currentPath;
    console.log("listing path " + pathToList);
    var hasPathChanged = currentPath !== pathToList
    currentPath = pathToList;

    if (pathToList == "/" || pathToList == initPath || pathToList.startsWith("keyword://")) {
        if (pathToList != "/") {
            $("#add-directory-button").hide()
        } else
            $("#add-directory-button").show()

        $("#back_arrow").hide()
    } else {
        $("#back_arrow").show()
        $("#add-directory-button").show()
    }



    var fb = new FileBrowser(pathToList);
    fb.list(function (files, endOfSearch) {
        if (!_.isEqual(files, oldFiles)) {
            var scroll = resetGrid(discret);
            oldFiles = files;
            var noteCardViewGrid = this.noteCardViewGrid
            var notes = [];
            notePath = [];
            if (currentTask != undefined)
                currentTask.continue = false
            if (files.length > 0) {
                $("#emty-view").fadeOut("fast");
            } else if (endOfSearch)
                $("#emty-view").fadeIn("fast");
            for (let file of files) {
                var filename = getFilenameFromPath(file.path);
                if (file.isFile && filename.endsWith(".sqd")) {
                    var oldNote = oldNotes[file.path];

                    var noteTestTxt = new Note(stripExtensionFromName(filename), oldNote != undefined ? oldNote.text : "", file.path, oldNote != undefined ? oldNote.metadata : undefined, oldNote != undefined ? oldNote.previews : undefined);
                    noteTestTxt.isPinned = file.isPinned
                    notes.push(noteTestTxt)
                } else if (!file.isFile) {

                    notes.push(file)
                }
                notePath.push(file.path)
            }
            noteCardViewGrid.setNotesAndFolders(notes)
            if (discret) {
                document.getElementById("grid-container").scrollTop = scroll;
                console.log("scroll : " + scroll)

            }
            currentTask = new TextGetterTask(notes);
            console.log("stopping and starting task")
            currentTask.startList();
        }
        if (!endOfSearch) {
            refreshTimeout = setTimeout(function () {
                list(pathToList, true);
            }, 1000);
        } else {
            refreshTimeout = setTimeout(function () {
                list(pathToList, true);
            }, 20000);
        }

    });

}
list(initPath)
refreshKeywords();

function minimize() {
    remote.BrowserWindow.getFocusedWindow().minimize();
}

function maximize() {
    if (remote.BrowserWindow.getFocusedWindow().isMaximized())
        remote.BrowserWindow.getFocusedWindow().unmaximize();
    else
        remote.BrowserWindow.getFocusedWindow().maximize();
}

function closeW() {
    remote.app.exit(0);
    console.log("cloose")
}

function toggleSearch() {
    $("#search-container").slideToggle();
    if ($("#search-container").css("display") != "none")
        $("#search-input").focus();
}


/*main.setMergeListener(function () {
    list(initPath, true)
})*/

document.getElementById("add-note-button").onclick = function () {
    var path = currentPath;
    if (path == initPath || path.startsWith("keyword://"))
        path = "";
    RequestBuilder.sRequestBuilder.get("/note/create?path=" + encodeURIComponent(path), function (error, data) {
        if (error) return;
        console.log("found " + data)
        wasNewNote = true;
        var db = new RecentDBManager()
        db.addToDB(data, function () {
            openNote(data)
        });

    })
    /*new NewNoteCreationTask(function (path) {
        console.log("found " + path)
        wasNewNote = true;
        var db = new RecentDBManager(main.getNotePath() + "/quickdoc/recentdb/" + main.getAppUid())
        db.addToDB(NoteUtils.getNoteRelativePath(main.getNotePath(), path));
        openNote(path)
    })*/
}

document.getElementById("add-directory-button").onclick = function () {
    mNewFolderDialog.show();
}


document.getElementById("search-input").onkeydown = function (event) {
    if (event.key === 'Enter') {
        toggleSearch();
        searchInNotes(this.value)
    }
}

document.getElementById("back_arrow").addEventListener("click", function () {
    list(FileUtils.getParentFolderFromPath(currentPath))
});

function getNotePath() {

    return main.getNotePath()
}

function loadNextNotes() {
    browser.noteCardViewGrid.addNext(15);
    currentTask.stopAt += 15;
    currentTask.getNext()
}

var browser = this
document.getElementById("grid-container").onscroll = function () {
    if (this.offsetHeight + this.scrollTop >= this.scrollHeight - 80) {
        loadNextNotes();

    }
}

var hasLoadedOnce = false

var loadingView = document.getElementById("loading-view")
//var browserElem = document.getElementById("browser")
console.log("pet")

var dias = document.getElementsByClassName("mdl-dialog")
for (var i = 0; i < dias.length; i++) {
    dialogPolyfill.registerDialog(dias[i]);
}

document.getElementById("search-button").onclick = function () {
    toggleSearch();
}

//nav buttons
document.getElementById("browser-button").onclick = function () {
    toggleDrawer();
    list("/");
    return false;
}
document.getElementById("recent-button").onclick = function () {
    toggleDrawer();
    list("recentdb://");
    return false;
}

function toggleDrawer() {
    if (document.getElementsByClassName("is-small-screen").length > 0)
        document.getElementsByClassName("mdl-layout__drawer-button")[0].click()
}

function isFullScreen() {
    return document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
}



RequestBuilder.sRequestBuilder.get("/recentdb/merge", function (error, data) {
    if (data == true && currentPath == "recentdb://")
        list("recentdb://", true);
})

RequestBuilder.sRequestBuilder.get("/keywordsdb/merge", function (error, data) {
    if (data == true)
        refreshKeywords()
})


const isWeb = true;
const right = document.getElementById("right-bar");






//writer frame

var isElectron = typeof require === "function";
var writerFrame = undefined;
events = []

if (isElectron) {
    writerFrame = document.getElementById("writer-webview");

    writerFrame.addEventListener('ipc-message', event => {
        if (events[event.channel] !== undefined) {
            for (var callback of events[event.channel])
                callback();
        }
    });

} else {
    writerFrame = document.getElementById("writer-iframe");
    //iframe events

    var eventMethod = window.addEventListener ?
        "addEventListener" :
        "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod === "attachEvent" ?
        "onmessage" :
        "message";
    eventer(messageEvent, function (e) {
        if (events[e.data] !== undefined) {
            for (var callback of events[e.data])
                callback();
        }

    });
}

function registerWriterEvent(event, callback) {
    if (events[event] == null) {
        events[event] = []
    }
    events[event].push(callback)

}


registerWriterEvent("exit", function () {
    $(writerFrame).fadeOut();
    $("#no-drag-bar").hide()
    if (!wasNewNote) {
        if (currentTask != undefined) {
            const index = notePath.indexOf(currentNotePath)
            currentTask.current = index
            currentTask.stopAt = index + 1;
            currentTask.startList()
        }

    }
    list(currentPath, true);
    wasNewNote = false;
})

registerWriterEvent("loaded", function () {
    $(loadingView).fadeOut()
    $("#no-drag-bar").show()

})


setTimeout(function () {
    RequestBuilder.sRequestBuilder.get("/settings/isfirstrun", function (error, data) {
        if (!error && data == true) {
            const elem = document.getElementById("firstrun-container");
            $(elem).show();
            $(("#firstrun")).slideToggle();
            new Slides(elem, function () {
                $(("#firstrun")).slideToggle(function () {
                    $(elem).hide();
                    compatibility.onFirstrunEnds();
                });

            });
        }

    })
}, 2000);
initDragAreas();
var launchCount = store.get("launch_count")
if (launchCount == null || launchCount == undefined) {
    launchCount = 1
}
else launchCount = parseInt(launchCount)
console.log("launch count " + launchCount)
if (launchCount % 10 == 0)
    setTimeout(function () {
        displaySnack({
            message: "This application was created for free, please, consider making a donation",
            timeout: 10000,
            actionText: "Donate",
            actionHandler: function () {
                const url = 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YMHT55NSCLER6';
                compatibility.openUrl(url)
            }
        })
    }, 10000);
store.set("launch_count", launchCount + 1)
RequestBuilder.sRequestBuilder.get("/settings/browser_css", function (error, data) {
    if (!error && data != null && data != undefined) {
        store.set("css_sheets", JSON.stringify(data));
        var num = 0;
        for (var sheet of data) {
            Utils.applyCss(sheet, function () {
                num++;
                if (num == data.length)
                    $("#carnet-icon-view").fadeOut('slow');

            })
        }
        if (data.length == 0)
            $("#carnet-icon-view").fadeOut('slow');

    } else $("#carnet-icon-view").fadeOut('slow');
})
var isDebug = false
console.oldlog = console.log;
console.log = function (m) {
    if (isDebug)
        console.oldlog(m)
}
