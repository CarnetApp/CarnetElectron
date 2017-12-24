var SettingsHelper = require("./settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var {
  ipcRenderer,
  remote
} = require('electron');
document.getElementById("select_note_path_button").onclick = function () {
  var dialog = remote.dialog;
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function (path) {
    if (path != undefined)
      settingsHelper.setNotePath(path)
  })
}
document.getElementById("current_root_path").innerHTML = settingsHelper.getNotePath()
const BrowserWindow = remote.BrowserWindow;
document.getElementById("import").onclick = function () {
  var win = new BrowserWindow({
    width: 600,
    height: 700,
    frame: true
  });
  const url = require('url')
  const path = require('path')
  win.loadURL(url.format({
    pathname: path.join(__dirname, '../importer/importer.html'),
    protocol: 'file:',
    slashes: true
  }))
  win.setMenu(null)
  win.webContents.openDevTools()
}