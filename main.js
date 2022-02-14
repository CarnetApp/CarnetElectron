const {
    app,
    BrowserWindow,
    ipcMain,
    webContents
} = require('electron');
const path = require('path')
const url = require('url')
// In the main process:
require('@electron/remote/main').initialize()
const Store = require('electron-store');
const store = new Store();
var SettingsHelper = require("./server/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();

var uid = null;
var args = process.argv
var isDebug = args[2]
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

console.logDebug = function (mess) {
    if (isDebug)
        console.log(mess)
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4();
}



if (settingsHelper.getAppUid() == null || settingsHelper.getAppUid() == "undefined")
    settingsHelper.setAppUid(guid());
uid = settingsHelper.getAppUid();
console.logDebug("app uid " + uid)
var dbmerger = require("./server/recent/merge_db");
var keywordsdbmerger = require("./server/keywords/merge_db");

function startMerging() {
    new dbmerger.DBMerger(exports.getNotePath() + "/quickdoc/recentdb/", uid).startMergin(function (hasChanged) {
        if (mergeListener != undefined && hasChanged)
            mergeListener();
        console.logDebug("merge finished has changed ? " + hasChanged);
        //  setTimeout(startMerging, 5*60*1000);

    });
}

function startKeywordsMerging() {
    new keywordsdbmerger.KeywordDBMerger(exports.getNotePath() + "/quickdoc/keywords/", uid).startMergin(function (hasChanged) {
        if (mergeListener != undefined && hasChanged)
            mergeListener();
        console.logDebug("merge finished has changed ? " + hasChanged);
        //  setTimeout(startKeywordsMerging, 5*60*1000);

    });
}
var server = require("./server/server");

function createWindow() {
    server.carnetHttpServer.start(function () {

        setTimeout(function () {
            startMerging();
            startKeywordsMerging()
        }, 15000)

        // Create the browser window.
        win = new BrowserWindow({
            width: 1030,
            height: 600,
            frame: settingsHelper.displayFrame(),
            icon: path.join(__dirname, 'img/512x512.png'),
            webPreferences: {
                nodeIntegration: true,
                webviewTag: true,
                contextIsolation: false,

            }
        })
        win.setMenuBarVisibility(false)
        win.setMenu(null)

        // and load the index.html of the app.
        win.loadURL(url.format({
            pathname: path.join(__dirname, isDebug ? 'index.html' : 'index.html'),
            protocol: 'file:',
            slashes: true
        }) + '?api_url=' + server.carnetHttpServer.getAddress())
        require("@electron/remote/main").enable(win.webContents);
        // Open the DevTools.
        //win.webContents.openDevTools()
        console.log("app uid " + uid)

        // Emitted when the window is closed.
        win.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            win = null
        })


    })


}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow)


app.on('ready', createWindow)
// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

var sendStart = function () {
    if (win != undefined)
        win.webContents.send("sync-start");
}
var sendStop = function () {
    if (win != undefined)
        win.webContents.send("sync-stop");
}
var sync = new (require("./server/sync/sync")).Sync(sendStart
    , function (hasDownloadedSmt) {
        console.logDebug("hasDownloadedSmt " + hasDownloadedSmt)
        if (hasDownloadedSmt) {
            startMerging();
            startKeywordsMerging()
        }
        sendStop();
    });
sync.startSync()

exports.startSync = () => {
    return sync.startSync();

}

exports.syncOneNote = (notePath) => {
    sync.syncOneItem(notePath, function (error) {
        //sync db
        if (!error)
            sync.syncOneItem("quickdoc/recentdb/" + uid, function (error) {
                //sync db
                if (!error)
                    sync.syncOneItem("quickdoc/keywords/" + uid, function (error) { })
            })
    })

}
exports.displayMainWindow = (size, pos) => {
    win.setSize(size[0], size[1]);
    win.setPosition(pos[0], pos[1]);
    win.show();
}

exports.enableEditorWebContent = (webContentsId) => {
    require("@electron/remote/main").enable(webContents.fromId(webContentsId));

}

exports.hideMainWindow = () => {

    win.hide();
}

exports.getNotePath = function () {
    var SettingsHelper = require("./server/settings_helper").SettingsHelper;
    return new SettingsHelper().getNotePath();
}
var mergeListener
exports.setMergeListener = (listener) => {
    mergeListener = listener;
}

exports.getLocalStorage = function () {
    return localStorage;
}

exports.isDebug = isDebug
exports.getAppUid = () => {

    return uid;
}
exports.executeProcess = (process) => {

    process.start();
}

exports.getPath = function (path) {
    return app.getPath(path)
}

exports.sendRequestToServer = function (method, path, data, callback) {
    server.handle(method, path, data, callback);
}

exports.isSyncing = function () {
    return sync.isSyncing;
}
exports.createWindow = createWindow;


