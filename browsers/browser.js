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
var api_url = Utils.getParameterByName("api_url")
if (api_url == undefined)
    api_url = document.getElementById("api-url").innerHTML !== "!API_URL" ? document.getElementById("api-url").innerHTML : "./";
new RequestBuilder(api_url);
const store = new Store();
var noteCacheStr = String(store.get("note_cache"))
if (noteCacheStr == "undefined")
    noteCacheStr = "{}"
var cachedMetadata = JSON.parse(noteCacheStr);
var recentCacheStr = String(store.get("recent_cache"))
var cachedRecentDB = undefined
var isFirstLoad = true // used to preopen editor
if (recentCacheStr != "undefined")
    cachedRecentDB = JSON.parse(recentCacheStr);

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
        store.set("note_cache", JSON.stringify(cachedMetadata))
        return;
    }

    var paths = "";
    var start = this.current;
    for (var i = start; i < this.stopAt && i < this.list.length && i - start < 20; i++) { //do it 20 by 20
        this.current = i + 1
        if (!(this.list[i] instanceof Note) || !this.list[i].needsRefresh)
            continue;
        paths += "paths[]=" + encodeURIComponent(this.list[i].path) + "&";
        if (cachedMetadata[this.list[i].path] == undefined)
            cachedMetadata[this.list[i].path] = this.list[i];
    }
    var myTask = this;
    if (paths.length > 0) {
        RequestBuilder.sRequestBuilder.get("/metadata?" + paths, function (error, data) {
            for (var meta in data) {
                var note = new Note(Utils.cleanNoteName(getFilenameFromPath(meta)), data[meta].shorttext, meta, data[meta].metadata, data[meta].previews, false, data[meta].media)
                cachedMetadata[meta] = note
                notes[notePath.indexOf(meta)] = note
                noteCardViewGrid.updateNote(note)
                noteCardViewGrid.msnry.layout();
            }
            myTask.getNext();
        });
    } else myTask.getNext();
}


String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function openNote(notePath, action) {
    isLoadCanceled = false;
    currentNotePath = notePath
    RequestBuilder.sRequestBuilder.get("/note/open/prepare", function (error, data) {
        console.log("opening " + data)
        if (error)
            return;
        if (writerFrame.src == "") {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf("android") > -1) {//open in new tab for firefox android
                window.open("writer?path=" + encodeURIComponent(notePath) + (action != undefined ? "&action=" + action : ""), "_blank");
            }
            else {
                writerFrame.src = data + "?path=" + encodeURIComponent(notePath) + (action != undefined ? "&action=" + action : "");
                if (notePath !== undefined) {
                    $("#editor-container").show()
                    console.log("notePath " + notePath)
                    $(loadingView).fadeIn(function () {

                        writerFrame.style.display = "inline-flex"

                    })
                }
            }
            /*setTimeout(function () {
                writerFrame.openDevTools()
            }, 1000)*/
        }
        else {
            console.log("reuse old iframe");
            $("#editor-container").show()
            $(loadingView).fadeIn(function () {
                if (compatibility.isElectron) {
                    writerFrame.send('loadnote', notePath);
                    writerFrame.send('action', action);
                }
                else
                    writerFrame.contentWindow.loadPath(notePath, action);
                writerFrame.style.display = "inline-flex"

            })
        }
    })
}

var displaySnack = function (data) {
    var snackbarContainer = document.querySelector('#snackbar');
    if (!(typeof snackbarContainer.MaterialSnackbar == undefined))
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
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
            keywordElem.dir = "auto"
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



function resetGrid(discret) {
    var grid = document.getElementById("page-content");
    var scroll = 0;
    if (discret)
        scroll = document.getElementById("grid-container").scrollTop;
    grid.innerHTML = "";
    noteCardViewGrid = new NoteCardViewGrid(grid, UISettingsHelper.getInstance().get("in_line"), discret, onDragEnd);
    this.noteCardViewGrid = noteCardViewGrid;
    noteCardViewGrid.onFolderClick(function (folder) {
        list(folder.path)
    })
    noteCardViewGrid.onTodoListChange = function (note) {
        RequestBuilder.sRequestBuilder.post("/notes/metadata", {
            path: note.path,
            metadata: JSON.stringify(note.metadata)
        }, function (error) {

        })
    }
    noteCardViewGrid.onNoteClick(function (note) {
        if (!dontOpen) {
            if (note.path != "untitleddonotedit.sqd")
                openNote(note.path)
            else
                displaySnack({
                    message: $.i18n("fake_notes_warning"),
                    timeout: 2000,
                })
        }
        dontOpen = false;
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
            var db = RecentDBManager.getInstance()
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
        if (RecentDBManager.getInstance().lastDb.indexOf(note.path) < 0) {
            this.archiveButton.innerHTML = $.i18n("unarchive")
        }
        else
            this.archiveButton.innerHTML = $.i18n("archive")

        this.archiveButton.onclick = function () {
            var db = RecentDBManager.getInstance()
            if (RecentDBManager.getInstance().lastDb.indexOf(note.path) < 0) {
                db.addToDB(note.path, function () {
                    context.dialog.close();
                    list(currentPath, true)
                });

            } else {
                db.removeFromDB(note.path, function () {
                    context.dialog.close();
                    list(currentPath, true)
                });
            }

        }
        if (note.isPinned == true) {
            this.pinButton.innerHTML = "Unpin"
        } else this.pinButton.innerHTML = "Pin"

        this.pinButton.onclick = function () {
            var db = RecentDBManager.getInstance()
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
var lastListingRequestId = undefined;
function sortBy(sortBy, reversed, discret) {
    notePath = []
    var sorter = Utils.sortByDefault
    switch (sortBy) {
        case "creation":
            sorter = Utils.sortByCreationDate
            break;
        case "modification":
            sorter = Utils.sortByModificationDate
            break;
        case "custom":
            sorter = Utils.sortByCustomDate
            break;
    }
    resetGrid(discret);
    notes.sort(reversed ? function (a, b) {
        return -sorter(a, b);
    } : sorter)

    for (var item of notes) {
        notePath.push(item.path)
    }
    noteCardViewGrid.setNotesAndFolders(notes)
    currentTask = new TextGetterTask(notes);
    console.log("stopping and starting task")
    currentTask.startList();

}

function onListEnd(pathToList, files, metadatas, discret, force, fromCache) {
    lastListingRequestId = undefined;
    if (!_.isEqual(files, oldFiles) || force) {
        var scroll = resetGrid(discret);
        oldFiles = files;
        var noteCardViewGrid = this.noteCardViewGrid
        notes = [];
        notePath = [];
        if (currentTask != undefined)
            currentTask.continue = false

        var i = 0
        for (let file of files) {
            var filename = getFilenameFromPath(file.path);
            if (filename.endsWith(".sqd")) {
                var metadata = undefined;
                if (metadatas != undefined) {
                    metadata = metadatas[file.path];
                    //bad fix for paths starting with / but having not metadata... Need to find out why
                    if (metadata == undefined && file.path.startsWith("/")) {
                        metadata = metadatas[file.path.substr(1)]
                    }
                }
                let needsRefresh = metadata == undefined;
                if (metadata == undefined) {
                    metadata = cachedMetadata[file.path]
                }
                var noteTestTxt = new Note(Utils.cleanNoteName(filename), metadata != undefined ? metadata.shorttext : "", file.path, metadata != undefined ? metadata.metadata : undefined, metadata != undefined ? metadata.previews : undefined, needsRefresh, metadata != undefined ? metadata.media : undefined);
                noteTestTxt.isPinned = file.isPinned
                noteTestTxt.originalIndex = i;
                notes.push(noteTestTxt)
                if (metadata != undefined)
                    cachedMetadata[file.path] = metadata
            } else if (!file.isFile) {
                file.originalIndex = i;
                notes.push(file)
            }
            i++
        }

        if (files.length == 0 && pathToList === "recentdb://") {
            $("#emty-view").fadeOut("fast");
            var noteTestTxt = new Note("untitleddonotedit.sqd", $.i18n("fake_note_1"), "untitleddonotedit.sqd", {
                creation_date: new Date().getTime(),
                last_modification_date: new Date().getTime(),
                keywords: [],
                rating: 5,
                color: "none"
            }, undefined);
            notes.push(noteTestTxt)

            var noteTestTxt = new Note("untitleddonotedit.sqd", $.i18n("fake_note_5"), "untitleddonotedit.sqd", {
                creation_date: new Date().getTime(),
                last_modification_date: new Date().getTime(),
                keywords: [],
                rating: -1,
                color: "red"
            }, undefined);
            noteTestTxt.previews = []
            noteTestTxt.previews.push(root_url + "img/bike.png");
            notes.push(noteTestTxt)

            var noteTestTxt = new Note("untitleddonotedit.sqd", $.i18n("fake_note_2"), "untitleddonotedit.sqd", {
                creation_date: new Date().getTime(),
                last_modification_date: new Date().getTime(),
                keywords: ["keyword"],
                rating: -1,
                color: "orange"
            }, undefined);
            notes.push(noteTestTxt)
            var noteTestTxt = new Note("untitleddonotedit.sqd", $.i18n("fake_note_3"), "untitleddonotedit.sqd", {
                creation_date: new Date().getTime(),
                last_modification_date: new Date().getTime(),
                keywords: [],
                rating: 3,
                color: "none"
            }, undefined);
            notes.push(noteTestTxt)
            var noteTestTxt = new Note("untitleddonotedit.sqd", $.i18n("fake_note_4"), "untitleddonotedit.sqd", {
                creation_date: new Date().getTime(),
                last_modification_date: new Date().getTime(),
                keywords: [],
                rating: -1,
                color: "green"
            }, undefined);
            notes.push(noteTestTxt)


            var noteTestTxt = new Note("untitleddonotedit.sqd", $.i18n("fake_note_6"), "untitleddonotedit.sqd", {
                creation_date: new Date().getTime(),
                last_modification_date: new Date().getTime(),
                keywords: [],
                rating: -1,
                urls: { "https://carnet.live": {} },
                todolists: [{ todo: [$.i18n("fake_note_todo_item_1"), $.i18n("fake_note_todo_item_2")] }],
                color: "none"
            }, undefined);

            notes.push(noteTestTxt)

        }
        sortBy(UISettingsHelper.getInstance().get('sort_by'), UISettingsHelper.getInstance().get('reversed'), discret);
        if (discret) {
            document.getElementById("grid-container").scrollTop = scroll;
            console.log("scroll : " + scroll)

        }
        if (!fromCache && isFirstLoad) {
            openNote(undefined, undefined)
            isFirstLoad = false
        }

    }
}

var notes = [];
function list(pathToList, discret) {
    if (refreshTimeout !== undefined)
        clearTimeout(refreshTimeout)
    if (lastListingRequestId != undefined) {
        RequestBuilder.sRequestBuilder.cancelRequest(lastListingRequestId)
    }
    if (pathToList == undefined)
        pathToList = currentPath;
    console.log("listing path " + pathToList);
    var hasPathChanged = currentPath !== pathToList
    currentPath = pathToList;

    if (pathToList == "/" || pathToList == "recentdb://" || pathToList.startsWith("keyword://")) {
        if (pathToList != "/") {
            $("#add-directory-button").hide()
        } else
            $("#add-directory-button").show()

        $("#back_arrow").hide()
    } else {
        $("#back_arrow").show()
        $("#add-directory-button").show()
    }


    if (!discret) {
        document.getElementById("note-loading-view").style.display = "inline";
        document.getElementById("page-content").style.display = "none";

    }
    var fb = new FileBrowser(pathToList);
    lastListingRequestId = fb.list(function (error, files, endOfSearch, metadatas) {
        if (error || endOfSearch || files.length > 0) {
            document.getElementById("page-content").style.display = "block";
            document.getElementById("note-loading-view").style.display = "none";
        }
        if (error) {
            document.getElementById("page-content").style.display = "none";
            $("#emty-view").fadeIn("fast");
            document.getElementById("emty-view").innerHTML = $.i18n("something_went_wrong_please_reload")
            return
        }
        if (files != null && pathToList === "recentdb://" && files.length > 0) {
            //save to cache
            store.set("recent_cache", JSON.stringify(files))
        }

        if (files.length > 0) {
            $("#emty-view").fadeOut("fast");
        } else if (endOfSearch)
            $("#emty-view").fadeIn("fast");

        onListEnd(pathToList, files, metadatas, discret)

        if (!endOfSearch) {
            refreshTimeout = setTimeout(function () {
                list(pathToList, files.length > 0);
            }, 1000);
        } else {
            refreshTimeout = setTimeout(function () {
                list(pathToList, true);
            }, 60000);
        }

    });

}

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

/*main.setMergeListener(function () {
    list(initPath, true)
})*/

document.getElementById("add-note-button").onclick = function () {
    createAndOpenNote();
}

document.getElementById("add-record-button").onclick = function () {
    createAndOpenNote("record-audio");
}

function createAndOpenNote(action) {
    var path = currentPath;
    if (path == "recentdb://" || path.startsWith("keyword://"))
        path = "";
    RequestBuilder.sRequestBuilder.get("/note/create?path=" + encodeURIComponent(path), function (error, data) {
        if (error) return;
        console.log("found " + data)
        wasNewNote = true;
        var db = RecentDBManager.getInstance()
        db.addToDB(data, function () {
            openNote(data, action)
        });

    })
}

document.getElementById("add-directory-button").onclick = function () {
    mNewFolderDialog.show();
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
    refreshKeywords()
})


const isWeb = true;
const right = document.getElementById("right-bar");






//writer frame

var isElectron = typeof require === "function";
var writerFrame = undefined;
var events = []

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
    $("#editor-container").hide()
    $("#drag-bar").show()
    setDraggable(true)
    if (!wasNewNote) {
        if (currentTask != undefined) {
            const index = notePath.indexOf(currentNotePath)
            currentTask.current = index
            currentTask.stopAt = index + 1;
            currentTask.list[index].needsRefresh = true
            currentTask.startList()
        }

    }
    list(currentPath, true);
    wasNewNote = false;
})

var isLoadCanceled = false;

registerWriterEvent("loaded", function () {
    if (!isLoadCanceled) {
        $(loadingView).fadeOut()
        $("#drag-bar").hide()
        setDraggable(false)

    }
})

registerWriterEvent("error", function () {
    hideEditor()
})

function setDraggable(draggable) {
    if (draggable)
        $(document.getElementsByClassName("mdl-layout__header")[0]).css("-webkit-app-region", "drag");
    else
        $(document.getElementsByClassName("mdl-layout__header")[0]).css("-webkit-app-region", "unset");

}
function hideEditor() {
    isLoadCanceled = true;
    $(loadingView).fadeOut()
    $(writerFrame).fadeOut();
    $("#editor-container").hide()
    $("#drag-bar").show()
    setDraggable(true)
}



// line / grid switch

function setInLineButton(isInLine) {
    document.getElementById("line-grid-switch-button").getElementsByClassName("material-icons")[0]
        .innerHTML = !isInLine ? "view_headline" : "view_module";
}

function setInLine(isInLine) {
    UISettingsHelper.getInstance().set("in_line", isInLine)
    UISettingsHelper.getInstance().postSettings()
    setInLineButton(isInLine)
    onListEnd(currentPath, oldFiles, cachedMetadata, true, true)

}

function toggleInLine() {
    setInLine(!UISettingsHelper.getInstance().get("in_line"))
}



document.getElementById("line-grid-switch-button").onclick = function () {
    toggleInLine()
}




document.getElementById("cancel-load-button").onclick = function () {
    hideEditor();
    return false;
}

document.getElementById("editor-container").onclick = function () {
    hideEditor();
    return false;
}


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
        else {
            RequestBuilder.sRequestBuilder.get("/settings/changelog", function (error, data) {
                if (data.shouldDisplayChangelog) {
                    var dialog = document.getElementById("changelog-dialog");
                    dialog.getElementsByClassName("mdl-dialog__content")[0].innerHTML = "Changelog <br /><br />" + data.changelog.replace(/\n/g, "<br />");;
                    dialog.getElementsByClassName("ok")[0].onclick = function () {
                        dialog.close();
                    }
                    dialog.showModal()
                }
            })
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
var isDebug = true
console.oldlog = console.log;
/*console.log = function (m) {
    if (isDebug)
        console.oldlog(m)
}*/

function loadCachedRecentDB() {
    if (cachedRecentDB != undefined)
        onListEnd("recentdb://", cachedRecentDB, cachedMetadata, false, false, true)

}

UISettingsHelper.getInstance().loadSettings(function (settings, fromCache) {
    console.oldlog("settings from cache " + fromCache + " order " + settings["sort_by"])
    if (settings['start_page'] == 'recent')
        initPath = "recentdb://"
    if (settings['start_page'] == 'browser') {
        // we need to load recent db
        RecentDBManager.getInstance().getFlatenDB(function () {

        })
        initPath = "/"
    }
    setInLineButton(settings['in_line'])
    $("input[name='sort-by'][value='" + settings['sort_by'] + "']").parent().addClass("is-checked")
    $("input[name='sort-by'][value='" + settings['sort_by'] + "']").attr('checked', 'checked')

    document.getElementById("reversed-order").checked = settings['reversed']
    if (settings['reversed']) {
        document.getElementById("reversed-order").parentNode.classList.add("is-checked")
    }
    if (fromCache)
        loadCachedRecentDB();
    else
        list(initPath, cachedRecentDB != undefined ? true : false)
})

compatibility.loadLang(function () {
    $('body').i18n();
    console.oldlog("lang loaded")

})



$.i18n().locale = navigator.language;
$(".sort-item").click(function () {
    var radioValue = $("input[name='sort-by']:checked").val();

    if (radioValue) {
        UISettingsHelper.getInstance().set('sort_by', radioValue)
        UISettingsHelper.getInstance().set('reversed', document.getElementById("reversed-order").checked)
        sortBy(radioValue, document.getElementById("reversed-order").checked)
        UISettingsHelper.getInstance().postSettings()
    }

});


setDraggable(true)