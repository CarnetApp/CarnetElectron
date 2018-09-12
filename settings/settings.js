var currentPath;
document.getElementById("select_note_path_button").onclick = function () {
  if (isElectron) {
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
  } else {
    var newPath = window.prompt("Please enter a new path. Be aware that this won't move your notes, so be careful", currentPath);
    if (newPath != currentPath && newPath !== null && newPath !== "")
      RequestBuilder.sRequestBuilder.post("/settings/note_path", {
        path: newPath
      }, function (error, data) {
        window.location.href = "./";
      });
  }
}
new RequestBuilder();
RequestBuilder.sRequestBuilder.get("/settings/note_path", function (error, data) {
  if (!error) {
    document.getElementById("current_root_path").innerHTML = data
    currentPath = data;
  }

})

document.getElementById("cloudsync").onclick = function () {
  console.log("pet")
  const url = 'https://github.com/PhieF/QuickDocDocumentation/blob/master/README.md';
  if (isElectron) {
    var {
      shell
    } = require('electron');
    shell.openExternal(url);
  } else {
    var win = window.open(url, '_blank');
    win.focus();
  }
  return false;
};

document.getElementById("export").onclick = function () {
  const url = RequestBuilder.sRequestBuilder.buildUrl("/notes/export");
  var win = window.open(url, '_blank');
  win.focus();
}

document.getElementById("import").onclick = function () {
  var settingsHelper = new SettingsHelper();
  var {
    remote
  } = require('electron');
  const BrowserWindow = remote.BrowserWindow;

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
}
const isWeb = true;
if (isWeb) {
  document.getElementById("recent-button").href = "./"
  document.getElementById("browser-button").href = "./"
}