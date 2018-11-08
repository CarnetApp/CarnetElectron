var SettingsHelper = function () {

}
const Store = require('electron-store');
const store = new Store();
SettingsHelper.prototype.getNotePath = function () {
    var path = String(store.get("root_path"))
    if (path == null || path == "undefined") {
        var {
            remote,
            app
        } = require('electron')
        if (app == undefined)
            app = remote.app
        path = app.getPath('documents') + "/QuickDoc";
        store.set("root_path", path);
    }
    require("mkdirp")(path)
    console.log("path " + path)
    var {
        ipcRenderer,
        remote
    } = require('electron');
    var main;
    if (remote != undefined)
        main = remote.require("./main.js");
    else
        main = require("../main.js");
    return path + (main.isDebug ? "Debug" : "");
}

SettingsHelper.prototype.setNotePath = function (path) {
    store.set("root_path", path);
}

SettingsHelper.prototype.setAppUid = function (uid) {
    store.set("appuid", uid);
}

SettingsHelper.prototype.getAppUid = function () {
    return String(store.get("appuid"));
}

SettingsHelper.prototype.isFirstRun = function () {
    var first = store.get("first_launch")
    if (first == null || first == undefined)
        store.set("first_launch", false)
    return first == null || first == undefined
}

SettingsHelper.prototype.getRemoteWebdavAddr = function () {

    return store.get("remote_webdav_addr")
}

SettingsHelper.prototype.getRemoteWebdavUsername = function () {
    return store.get("remote_webdav_username")
}

SettingsHelper.prototype.getRemoteWebdavPassword = function () {
    return store.get("remote_webdav_password")
}

SettingsHelper.prototype.getRemoteWebdavPath = function () {
    return store.get("remote_webdav_path")
}


SettingsHelper.prototype.setRemoteWebdavPath = function (path) {

    return store.set("remote_webdav_path", path)
}

SettingsHelper.prototype.setRemoteWebdavAddr = function (addr) {

    return store.set("remote_webdav_addr", addr)
}

SettingsHelper.prototype.setRemoteWebdavUsername = function (username) {
    return store.set("remote_webdav_username", username)
}

SettingsHelper.prototype.setRemoteWebdavPassword = function (password) {
    return store.set("remote_webdav_password", password)
}

SettingsHelper.prototype.displayFrame = function () {
    return store.get("display_frame", false)
}

SettingsHelper.prototype.setDisplayFrame = function (display) {
    store.set("display_frame", display)
}

exports.SettingsHelper = SettingsHelper;