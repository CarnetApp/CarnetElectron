
var RecentDBManager = require('./recent/local_recent_db_manager').LocalRecentDBManager;
var KeywordsDBManager = require('./keywords/keywords_db_manager').KeywordsDBManager;

var SettingsHelper = require("../settings/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();

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
            callback("", "");
        }
    }

}

exports.handle = handle;