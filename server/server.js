
var RecentDBManager = require('./recent/local_recent_db_manager').LocalRecentDBManager;
var SettingsHelper = require("../settings/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();

var handle = function (method, path, data, callback) {

    if (method === "GET") {
        switch (path) {
            case "/recentdb":
                new RecentDBManager(settingsHelper.getNotePath() + "/quickdoc/recentdb/" + settingsHelper.getAppUid()).getFullDB(function (err, data) {

                    callback(err, data)
                });
        }
    }

}

exports.handle = handle;