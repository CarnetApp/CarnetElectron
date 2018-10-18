
var RecentDBManager = require('./recent/local_recent_db_manager').LocalRecentDBManager;
var KeywordsDBManager = require('./keywords/keywords_db_manager').KeywordsDBManager;

var SettingsHelper = require("../settings/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var NoteOpener = require("./note/note-opener").NoteOpener;
var Note = require("../browsers/note").Note;
var fs = require('fs');
const path = require('path')

var handle = function (method, path, data, callback) {
    console.log(path)

    if (method === "GET") {
        switch (path) {
            case "/recentdb":
                new RecentDBManager(settingsHelper.getNotePath() + "/quickdoc/recentdb/" + settingsHelper.getAppUid()).getFullDB(function (err, data) {

                    callback(err, data)
                });
                break;
            case "/keywordsdb":
                new KeywordsDBManager(settingsHelper.getNotePath() + "/quickdoc/keywords/" + settingsHelper.getAppUid()).getFullDB(function (err, data) {

                    callback(err, data)
                });
                break;
            case "/note/open/prepare":
                prepareEditor(callback);

                break;

        }
        if (path.startsWith("/metadata?")) {
            var params = path.split("?")[1].split("=")[1].split("%2C");

            var handler = new ArrayHandler(params, function (step) {
                step = decodeURIComponent(step);
                if (step == "" || step == undefined || step.indexOf("../") >= 0) {
                    this.next()
                    return;
                }

                new NoteOpener(new Note("", "", settingsHelper.getNotePath() + "/" + step)).getMainTextMetadataAndPreviews(function (text, metadata, previews) {
                    if (text != undefined) {
                        handler.addResult(step, {
                            shorttext: text.substr(0, 200),
                            metadata: metadata,
                            previews: previews
                        })
                    }

                    handler.next();
                })
            }, function (result) {
                callback(false, result)
            });
            handler.next();
        }
        else if (path.startsWith("/note/create?path=")) {
            var folder = path.split("=")[1];
            if (folder.indexOf("../") >= 0) {
                callback(true, "");
                return;
            }
            if (!folder.startsWith("/"))
                folder = "/" + folder;
            if (!folder.endsWith("/"))
                folder = folder + "/";
            new NewNoteCreationTask(folder, function (path) {
                console.log("found " + path)
                callback(false, path);

            })

        }
        else if (path.startsWith("/note/open")) {
            var folder = decodeURIComponent(path.split("=")[1]);
            if (folder.indexOf("../") >= 0) {
                callback(true, "");
                return;
            }
            openNote(folder, function (result) {
                console.log("result " + result)
                callback(false, result)
            })
        }
    } else if (method === "POST") {
        switch (path) {
            case "/recentdb/action":
                for (action of data.data) {
                    console.log(action.action);
                    new RecentDBManager(settingsHelper.getNotePath() + "/quickdoc/recentdb/" + settingsHelper.getAppUid()).action(action.path, action.action, action.time, function () {
                        callback(false, "");
                    })
                }
                break;
            case "/note/saveText":
                saveNote(data.path, data.html, data.metadata, callback);
                break;
        }
    }

}

var saveNote = function (path, html, metadata, callback) {
    var tmppath = getTmpPath() + "/note/";
    fs.writeFile(tmppath + 'index.html', html, function (err) {
        if (err) {
            callback(true, "")
            return console.log(err);
        }
        var note = new Note("", "", settingsHelper.getNotePath() + "/" + path, metadata)
        var noteOpener = new NoteOpener(note)
        console.log("saving meta  " + metadata)
        fs.writeFile(tmppath + 'metadata.json', metadata, function (err) {
            if (err) {
                callback(true, "")
                return console.log(err);
            }
            console.log("compress")
            noteOpener.compressFrom(tmppath, function () {
                console.log("compressed")

                callback(false, "")
            })
        });

    });
}

var openNote = function (path, callback) {
    var writer = this;
    const tmppath = getTmpPath() + "/note/";
    console.log("extractNote" + settingsHelper.getNotePath() + "/" + path + " to " + tmppath)

    const noteOpener = new NoteOpener(new Note("", "", settingsHelper.getNotePath() + "/" + path));
    noteOpener.extractTo(tmppath, function (noSuchFile) {
        console.log("done " + noSuchFile)
        if (!noSuchFile) {
            fs.readFile(tmppath + 'index.html', 'utf8', function read(err, data) {
                var result = {}

                if (err) {
                    throw err;
                }
                result["html"] = data

                fs.readFile(tmppath + 'metadata.json', 'utf8', function read(err, metadata) {
                    if (err) {
                        throw err;
                    }
                    result["metadata"] = JSON.parse(metadata);
                    result["id"] = 0;
                    callback(result)
                });
            });
        } else {
        }
        /*fs.readFile(tmppath+'metadata.json', function read(err, data) {
            if (err) {
                throw err;
            }

            content = data;
            console.log(data)
            this.note.metadata = JSON.parse(content)
        });*/
        //copying reader.html
    })
}

var getTmpPath = function () {
    const {
        app,
    } = require('electron');
    return path.join(app.getPath("temp"), "tmpcarnet");
}

var prepareEditor = function (callback) {
    console.log("prepareEditor");
    var rimraf = require('rimraf');
    const tmp = getTmpPath();

    rimraf(tmp, function (e) {
        var fs = require('fs');
        console.log("rm " + e)
        fs.mkdir(tmp, function (e) {
            console.log("mkdir " + e)

            fs.readFile(__dirname + '/../reader/reader.html', 'utf8', function (err, data) {
                if (err) {
                    fs.rea
                    console.log("error ")
                    return console.log(err);
                }
                const index = path.join(tmp, 'reader.html');
                data = data.replace(new RegExp('<!ROOTPATH>', 'g'), __dirname + '/../');
                data = data.replace(new RegExp('<!APIURL>', 'g'), '')

                fs.writeFileSync(index, data);
                console.log("index " + index)
                callback(false, index)
            });


        });

    })
}
var NewNoteCreationTask = function (folder, callback) {
    console.log("NewNoteCreationTask " + path)
    var path = settingsHelper.getNotePath() + folder;
    fs.stat(path, function (error, stats) {
        if (error) {
            console.log("not here")
            var mkdirp = require('mkdirp');
            mkdirp.sync(path);
        }
        var task = this;
        fs.readdir(path, (err, files) => {
            var name = "untitled.sqd";
            var sContinue = true;
            var i = 1;
            while (sContinue) {
                sContinue = false
                for (let file of files) {
                    if (file == name) {
                        sContinue = true;
                        i++;
                        name = "untitled " + i + ".sqd";
                    }
                }
            }
            callback(folder.substr(1) + name)

        });
    })


}


class ArrayHandler {
    constructor(array, doNext, onFinished) {
        this.array = array;
        this.current = 0;
        this.result = {}
        this.doNext = doNext;
        this.onFinished = onFinished;
    }

    next() {
        if (this.array.length > 0) {
            this.doNext(this.array.pop());
        }
        else
            this.onFinished(this.result);

    }

    addResult(key, result) {
        this.result[key] = result;
        console.log("adding " + JSON.stringify(this.result))
    }

}
exports.handle = handle;