
var RecentDBManager = require('./recent/local_recent_db_manager').LocalRecentDBManager;
var KeywordsDBManager = require('./keywords/keywords_db_manager').KeywordsDBManager;

var SettingsHelper = require("../settings/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var NoteOpener = require("./note/note-opener").NoteOpener;
var NoteUtils = require("./note/NoteUtils").NoteUtils;
var Search = require("./search").Search;
var currentSearch = undefined;
var Note = require("../browsers/note").Note;
var fs = require('fs');
const path = require('path')

var handle = function (method, path, data, callback) {
    console.log(path)
    var splitPath = path.split("?")
    var pathBeforeArgs = splitPath[0]
    if (splitPath[1] != undefined) {
        var argsStr = path.split("?")[1]
        argsSplit = argsStr.split("&");
        var args = {}
        for (var arg of argsSplit) {
            argSplit = arg.split("=");
            args[decodeURIComponent(argSplit[0])] = decodeURIComponent(argSplit[1])
        }
    }
    if (method === "GET") {
        switch (pathBeforeArgs) {
            case "/notes/search":
                currentSearch = new Search(args['query'], settingsHelper.getNotePath() + "/" + args['path'])
                currentSearch.start();
                callback(false, "");
                return;
            case "/settings/themes":
                callback(false, '[{"name":"Carnet", "path":"css/carnet", "preview":"css/carnet/preview.png"}, {"name":"Dark", "path":"css/dark", "preview":"css/dark/preview.png"}]');
                return;
            case "/settings/browser_css":
                callback(false, settingsHelper.getBrowserCss())
                return;
            case "/settings/editor_css":
                callback(false, settingsHelper.getEditorCss())
                return;
            case "/settings/settings_css":
                callback(false, settingsHelper.getSettingsCss())
                return;
            case "/notes/getSearchCache":
                callback(false, currentSearch.result)
                return;
            case "/settings/isfirstrun":
                callback(false, settingsHelper.isFirstRun())
                return;
            case "/settings/note_path":
                callback(false, settingsHelper.getNotePath())
                return;
            case "/settings/current_version":
                fs.readFile(__dirname + '/../version', 'utf8', function (err, data) {
                    if (err) {
                    }
                    callback(err, data)
                })
                return;
            case "/recentdb":
                new RecentDBManager(settingsHelper.getNotePath() + "/quickdoc/recentdb/" + settingsHelper.getAppUid()).getFullDB(function (err, data) {
                    callback(err, data)
                }, true);
                return;
            case "/keywordsdb":
                new KeywordsDBManager(settingsHelper.getNotePath() + "/quickdoc/keywords/" + settingsHelper.getAppUid()).getFullDB(function (err, data) {

                    callback(err, data)
                }, true);
                return;
            case "/note/open/prepare":
                prepareEditor(callback);
                return;
            case "/note/open/0/listMedia":
                getMediaList(callback)
                return;
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
                callback(false, JSON.stringify(result))
            });
            handler.next();
        }
        else if (path.startsWith("/note/create?path=")) {
            var folder = decodeURIComponent(path.split("=")[1]);
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
                callback(false, JSON.stringify(result))
            })
        }
        else if (path.startsWith("/browser/list?path=")) {
            var folder = decodeURIComponent(path.split("=")[1]);
            if (!folder.endsWith("/"))
                folder = folder + "/"
            if (folder.indexOf("../") >= 0) {
                callback(true, undefined);
                return;
            }
            else {
                var result = []
                fs.readdir(settingsHelper.getNotePath() + "/" + folder, (err, files) => {
                    for (let f of files) {
                        if ((folder + f) == "/quickdoc")
                            continue
                        const file = {};
                        const stat = fs.statSync(settingsHelper.getNotePath() + "/" + folder + f)
                        console.log("file " + folder + f)
                        file['name'] = f;
                        file['path'] = folder + f;
                        file['isDir'] = !stat.isFile();
                        file['mtime'] = stat.mtime;
                        result.push(file)
                    }
                    callback(false, result)
                })
            }

        }
    } else if (method === "POST") {
        switch (path) {
            case "/settings/note_path":
                settingsHelper.setNotePath(data.path)
                callback(false, undefined)
                console.log("ok")
                return;
            case "/recentdb/action":
                for (action of data.data) {
                    console.log(action.action);
                    new RecentDBManager(settingsHelper.getNotePath() + "/quickdoc/recentdb/" + settingsHelper.getAppUid()).action(action.path, action.action, action.time, function () {
                        callback(false, "");
                    })
                }
                break;
            case "/keywordsdb/action":
                new KeywordsDBManager(settingsHelper.getNotePath() + "/quickdoc/keywords/" + settingsHelper.getAppUid()).actionArray(data.data, function () {
                    callback(false, "");
                })

                break;
            case "/browser/newfolder":
                if (!data.path.startsWith("/"))
                    data.path = "/" + data.path
                if (data.path.indexOf("../") >= 0) {
                    callback(true)
                    return;
                }
                fs.mkdir(settingsHelper.getNotePath() + data.path, function (err) {
                    callback(err)
                })
                return;
            case "/settings/app_theme":
                var metadataFolder = data.url;
                if (!metadataFolder.startsWith("/"))
                    metadataFolder = __dirname + "/../" + data.url
                fs.readFile(metadataFolder + '/metadata.json', 'utf8', function (err, result) {
                    result = JSON.parse(result)
                    console.log(err)
                    console.log("data " + JSON.stringify(result.browser))
                    for (var i = 0; i < result.browser.length; i++)
                        result.browser[i] = metadataFolder + "/" + result.browser[i]
                    for (var i = 0; i < result.editor.length; i++)
                        result.editor[i] = metadataFolder + "/" + result.editor[i]
                    for (var i = 0; i < result.settings.length; i++)
                        result.settings[i] = metadataFolder + "/" + result.settings[i]
                    settingsHelper.setBrowserCss(JSON.stringify(result.browser))
                    settingsHelper.setEditorCss(JSON.stringify(result.editor))
                    settingsHelper.setSettingsCss(JSON.stringify(result.settings))

                    callback(false, "")
                })

                return;
            case "/notes/move":
                if (data.from.startsWith("./"))
                    data.from = data.from.substr(2)
                if (data.to.startsWith("./"))
                    data.to = data.to.substr(2)
                if (data.from.startsWith("/"))
                    data.from = data.from.substr(1)
                if (data.to.startsWith("/"))
                    data.to = data.to.substr(1)
                if (data.from.indexOf("../") >= 0 || data.to.indexOf("../") >= 0) {
                    callback(true, "")
                    return;
                }
                NoteUtils.renameNote(data.from, data.to, function (success) {
                    callback(!success, "")
                })
                return;
            case "/note/saveText":
                data.path = decodeURIComponent(data.path);
                if (!data.path.startsWith("/"))
                    data.path = "/" + data.path
                if (data.path.indexOf("../") >= 0)
                    return
                saveTextToNote(data.path, data.html, data.metadata, callback);
                break;
            case "/note/open/0/addMedia": {
                console.log(typeof data.files)

                addMedias(data.path, data.files, callback)
                return;
            }
        }
    } else if (method === "DELETE") {

        switch (pathBeforeArgs) {
            case "/note":
                var toDelete = decodeURIComponent(path.split("=")[1])
                if (!toDelete.startsWith("./"))
                    toDelete = "/" + toDelete
                if (toDelete.indexOf("../") >= 0) {
                    callback(true, "")
                    return;
                }
                fs.unlink(settingsHelper.getNotePath() + toDelete, function () {
                    callback(false)
                })
                return;
            case "/note/open/0/media":
                console.log("deleting " + args["media"])
                var toDelete = args["media"]
                if (!toDelete.startsWith("./"))
                    toDelete = "/" + toDelete
                if (toDelete.indexOf("../") >= 0) {
                    callback(true, "")
                    return;
                }
                var note = args["path"]
                if (!note.startsWith("./"))
                    note = "/" + note
                if (note.indexOf("../") >= 0) {
                    callback(true, "")
                    return;
                }
                var tmppath = getTmpPath() + "/note/data" + toDelete;
                fs.unlink(tmppath, function () {
                    fs.unlink(getTmpPath() + "/note/data/preview_" + toDelete.substring(1) + ".jpg", function (e) {
                        console.log(e)
                        saveNote(note, function () {
                            getMediaList(callback)
                        })
                    })
                })
                return;


        }
    }

}
var getMediaList = function (callback) {
    var tmppath = getTmpPath() + "/note/data/";
    var medias = [];

    fs.readdir(tmppath, (err, files) => {
        if (err) {
            callback(false, medias) // return empty because no medias
            return
        }
        for (let file of files) {
            if (!file.startsWith("preview_"))
                medias.push(tmppath + file)
        }
        callback(false, medias)

    })
}

var addMedias = function (path, files, callback) {
    const Jimp = require('jimp');
    var tmppath = getTmpPath() + "/note/";
    require('mkdirp').sync(tmppath + 'data/');
    var handler = new ArrayHandler(files, function (file) {
        fs.writeFile(tmppath + 'data/' + file.name, file.data, 'base64', function (err) {
            if (!err) {
                Jimp.read(tmppath + 'data/' + file.name, (err, image) => {
                    if (!err) {
                        image.scaleToFit(200, 200);
                        image.getBase64(Jimp.MIME_JPEG, function (err, base) {
                            fs.writeFile(tmppath + 'data/preview_' + file.name + ".jpg", base.replace(/^data:image\/\w+;base64,/, ""), 'base64', function (err) {
                                handler.next()
                            })

                        })

                    } else handler.next()

                })


            }
        })

    }, function () {
        saveNote(path, function (error, data) {
            getMediaList(callback)
        });
    });
    handler.next()
    for (var i = 0; i < files.length; i++) {


    }
}

var saveTextToNote = function (path, html, metadata, callback) {
    var tmppath = getTmpPath() + "/note/";
    fs.writeFile(tmppath + 'index.html', html, function (err) {
        if (err) {
            callback(true, "")
            return console.log(err);
        }
        console.log("saving meta  " + metadata)
        fs.writeFile(tmppath + 'metadata.json', metadata, function (err) {
            if (err) {
                callback(true, "")
                return console.log(err);
            }
            console.log("compress")
            saveNote(path, callback)
        });

    });
}

var saveNote = function (path, callback) {
    var note = new Note("", "", settingsHelper.getNotePath() + "/" + path)
    var noteOpener = new NoteOpener(note)
    var tmppath = getTmpPath() + "/note/";
    noteOpener.compressFrom(tmppath, function () {
        console.log("compressed")
        callback(false, "")
    })

}

var openNote = function (path, callback) {
    var writer = this;
    const tmppath = getTmpPath() + "/note/";
    console.log("extractNote" + settingsHelper.getNotePath() + "/" + path + " to " + tmppath)
    var rimraf = require('rimraf');
    rimraf(tmppath, function (e) {
        var mkdirp = require('mkdirp');
        mkdirp.sync(tmppath);
        const noteOpener = new NoteOpener(new Note("", "", settingsHelper.getNotePath() + "/" + path));
        noteOpener.extractTo(tmppath, function (noSuchFile) {
            var result = {}
            result["id"] = 0;

            console.log("done " + noSuchFile)
            if (!noSuchFile) {
                fs.readFile(tmppath + 'index.html', 'utf8', function read(err, data) {

                    if (err) {
                        throw err;
                    }
                    result["html"] = data

                    fs.readFile(tmppath + 'metadata.json', 'utf8', function read(err, metadata) {
                        if (err) {
                            throw err;
                        }
                        result["metadata"] = JSON.parse(metadata);
                        callback(result)
                    });
                });
            } else {
                callback(result)
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
                data = data.replace(new RegExp('<!ROOTURL>', 'g'), __dirname + '/../');
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
    }

}
exports.handle = handle;