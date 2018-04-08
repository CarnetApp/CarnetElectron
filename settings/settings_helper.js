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
exports.SettingsHelper = SettingsHelper;