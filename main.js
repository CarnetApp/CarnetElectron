const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path')
const url = require('url')
var uid = null;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win


function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4();
}


const LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch')
if (localStorage.getItem("app_id") == null)
    localStorage.setItem("app_id", guid())
uid = localStorage.getItem("app_id")

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 600, frame: false })

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    win.webContents.openDevTools()

    console.log("app uid " + uid)

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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


exports.displayMainWindow = (size, pos) => {
    win.setSize(size[0], size[1]);
    win.setPosition(pos[0], pos[1]);
    win.show();
}

exports.hideMainWindow = () => {

    win.hide();
}
exports.getNotePath = () => {
    return "/home/alexandre/QuickNote";
}


exports.getAppUid = () => {

    return uid;
}
exports.executeProcess = (process) => {

        process.start();
    }
    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and require them here.