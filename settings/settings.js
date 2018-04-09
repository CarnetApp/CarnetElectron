var SettingsHelper = require("./settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var {
  ipcRenderer,
  remote,
  shell
} = require('electron');
document.getElementById("select_note_path_button").onclick = function () {
  var dialog = remote.dialog;
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function (path) {
    if (path != undefined) {
      settingsHelper.setNotePath(path)

      document.getElementById("restarting").style.display = "block";
      setTimeout(function () {
        remote.app.relaunch();
        remote.app.exit(0);
      }, 3000)
    }

  })
}

document.getElementById("current_root_path").innerHTML = settingsHelper.getNotePath()

document.getElementById("cloudsync").onclick = function () {
  shell.openExternal('https://github.com/PhieF/QuickDocDocumentation/blob/master/CloudSync.md');
  return false;
};

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