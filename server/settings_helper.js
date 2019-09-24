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
        path = app.getPath('documents') + "/Carnet";
        store.set("root_path", path);
    }
    require("mkdirp")(path)
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

SettingsHelper.prototype.setEditorCss = function (url) {
    store.set("editor_css", url)
}
SettingsHelper.prototype.setBrowserCss = function (url) {
    store.set("browser_css", url)
}

SettingsHelper.prototype.setSettingsCss = function (url) {
    store.set("settings_css", url)
}

SettingsHelper.prototype.getEditorCss = function () {
    return store.get("editor_css")
}
SettingsHelper.prototype.getBrowserCss = function () {
    return store.get("browser_css")
}

SettingsHelper.prototype.getSettingsCss = function () {
    return store.get("settings_css")
}

SettingsHelper.prototype.setLastChangelogVersion = function (md5) {
    store.set("last_changelog_version", md5)
}

SettingsHelper.prototype.getLastChangelogVersion = function () {
    return store.get("last_changelog_version")
}

SettingsHelper.prototype.setMetadataCache = function (cache) {
    store.set("metadata_cache", cache);
}

SettingsHelper.prototype.getMetadataCache = function () {
    var cache = String(store.get("metadata_cache"));
    if (cache == null || cache == "undefined") {
        cache = "{}"
    }
    return cache;
}

SettingsHelper.prototype.getBrowserSettings = function () {
    var bsettings = String(store.get("browser_settings"));
    if (bsettings == null || bsettings == "undefined") {
        bsettings = "{}"
    }
    return bsettings;
}
SettingsHelper.prototype.setBrowserSettings = function (bsettings) {
    store.set("browser_settings", bsettings);

}
exports.SettingsHelper = SettingsHelper;