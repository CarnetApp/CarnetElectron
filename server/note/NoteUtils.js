var SettingsHelper = require("../settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var RecentDBManager = require('../recent/local_recent_db_manager').LocalRecentDBManager;
var textVersion = require("textversionjs");

var NoteUtils = function () {

}
NoteUtils.getNoteRelativePath = function (rootPath, notePath) {
    return notePath.substring(rootPath.length + 1)
}
NoteUtils.deleteNote = function (notePath, callback) {
    console.log("delete " + notePath)
    if (!notePath.endsWith("sqd")) {
        callback(true, undefined)
        return;
    }
    console.log("delete " + notePath)

    var rimraf = require("rimraf");
    rimraf(settingsHelper.getNotePath() + "/" + notePath, function () {
        callback(false, undefined)
    })
}

NoteUtils.moveNote = function (notePath, callback) {

}

NoteUtils.getShortText = function (html) {
    var text = textVersion(html).replace(/\n/g, "<br />");
    return text.substr(0, text.length > 200 ? 200 : text.length)
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