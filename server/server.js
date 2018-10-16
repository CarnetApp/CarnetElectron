
var RecentDBManager = require('./recent/local_recent_db_manager').LocalRecentDBManager;
var KeywordsDBManager = require('./keywords/keywords_db_manager').KeywordsDBManager;

var SettingsHelper = require("../settings/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var NoteOpener = require("./note/note-opener").NoteOpener;
var Note = require("../browsers/note").Note;

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
                console.log(step)

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
    }

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