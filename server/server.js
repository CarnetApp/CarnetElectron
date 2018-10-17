
var RecentDBManager = require('./recent/local_recent_db_manager').LocalRecentDBManager;
var KeywordsDBManager = require('./keywords/keywords_db_manager').KeywordsDBManager;

var SettingsHelper = require("../settings/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var NoteOpener = require("./note/note-opener").NoteOpener;
var Note = require("../browsers/note").Note;
var fs = require('fs');

var handle = function (method, path, data, callback) {
    console.log(path)

    if (method === "GET") {
        switch (path) {
            case "/recentdb":
                new RecentDBManager(settingsHelper.getNotePath() + "/quickdoc/recentdb/" + settingsHelper.getAppUid()).getFullDB(function (err, data) {

                    callback(err, data)
                });
            case "/keywordsdb":
                new KeywordsDBManager(settingsHelper.getNotePath() + "/quickdoc/keywords/" + settingsHelper.getAppUid()).getFullDB(function (err, data) {

                    callback(err, data)
                });
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
    }

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