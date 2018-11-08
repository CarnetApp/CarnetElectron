var SettingsHelper = require("../../settings/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var RecentDBManager = require('../recent/local_recent_db_manager').LocalRecentDBManager;

var NoteUtils = function () {

}
NoteUtils.getNoteRelativePath = function (rootPath, notePath) {
    return notePath.substring(rootPath.length + 1)
}
NoteUtils.deleteNote = function (notePath, callback) {
    console.log("delete " + notePath)
    var fs = require('fs');
    fs.unlink(ettingsHelper.getNotePath() + "/" + notePath, function () {
        var db = new RecentDBManager(settingsHelper.getNotePath() + "/quickdoc/recentdb/" + settingsHelper.getAppUid())
        db.removeFromDB(notePath, callback);
    })
}

NoteUtils.moveNote = function (notePath, callback) {

}

NoteUtils.renameNote = function (notePath, newPath, callback) {
    console.log("renameNote " + newPath)
    var fs = require('fs');
    if (!fs.existsSync(settingsHelper.getNotePath() + "/" + newPath)) {
        fs.rename(settingsHelper.getNotePath() + "/" + notePath, settingsHelper.getNotePath() + "/" + newPath, function (err) {
            console.log(err)
            if (err) {
                callback(false)
                return;
            }
            var db = new RecentDBManager(settingsHelper.getNotePath() + "/quickdoc/recentdb/" + settingsHelper.getAppUid())
            db.move(notePath, newPath, function () {
                callback(true);
            })

        })
    } else callback(false)
}

exports.NoteUtils = NoteUtils