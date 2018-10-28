var currentPath;
document.getElementById("select_note_path_button").onclick = function () {
  if (compatibility.isElectron) {
    const {
      remote
    } = require('electron');
    var dialog = remote.dialog;
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }, function (path) {
      if (path != undefined) {
        RequestBuilder.sRequestBuilder.post("/settings/note_path", {
          path: path
        }, function (error, data) {
          window.location.reload(true)
        });
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
  if (compatibility.isElectron) {
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

document.getElementById("liberapay").onclick = function () {
  const url = 'https://liberapay.com/~34946';
  if (compatibility.isElectron) {
    var {
      shell
    } = require('electron');
    shell.openExternal(url);
  } else {
    var win = window.open(url, '_blank');
    win.focus();
  }
}

document.getElementById("paypal").onclick = function () {
  const url = "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YMHT55NSCLER6";
  if (compatibility.isElectron) {
    var {
      shell
    } = require('electron');
    shell.openExternal(url);
  } else {
    var win = window.open(url, '_blank');
    win.focus();
  }
}

document.getElementById("import").onclick = function () {
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
    pathname: path.join(__dirname, 'importer/importer.html'),
    protocol: 'file:',
    slashes: true
  }))
  win.setMenu(null)

}
if (compatibility.isElectron) {
  document.getElementById("recent-button").href = "index.html"
  document.getElementById("browser-button").href = "index.html"
} else {
  document.getElementById("recent-button").href = "./"
  document.getElementById("browser-button").href = "./"
}