
$(document).ready(function () {
  var frame;
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
    const url = 'https://github.com/PhieF/QuickDocDocumentation/blob/master/README.md';
    compatibility.openUrl(url)

    return false;
  };

  document.getElementById("export").onclick = function () {
    const url = RequestBuilder.sRequestBuilder.buildUrl("/notes/export");
    var win = window.open(url, '_blank');
    win.focus();
  }

  document.getElementById("liberapay").onclick = function () {
    const url = 'https://liberapay.com/~34946';
    compatibility.openUrl(url)
  }

  document.getElementById("sources").onclick = function () {
    if (compatibility.isElectron) {
      var {
        shell
      } = require('electron');
      shell.openExternal("https://github.com/PhieF/CarnetElectron");
    } else {
      var win = window.open("https://github.com/PhieF/CarnetNextcloud/", '_blank');
      win.focus();
    }
  }

  document.getElementById("theme").onclick = function () {
    document.getElementById("theme-dialog").showModal();
  }
  function createThemeSelector(name, url, preview) {
    var id = Math.random().toString(36).substring(7);
    var selector = document.createElement("div");
    selector.classList.add("theme-selector")
    var label = document.createElement("label");
    label.classList.add("mdl-radio")
    label.classList.add("mdl-js-radio")
    label.classList.add("mdl-js-ripple-effect")
    label.for = id;
    selector.appendChild(label)
    var input = document.createElement("input");
    input.type = "radio"
    input.id = id
    input.classList.add("mdl-radio__button")
    input.name = "theme"
    input.value = url;

    label.appendChild(input)
    var span = document.createElement("span");
    span.classList.add("mdl-radio__label")
    span.innerHTML = name
    label.appendChild(span)
    var img = document.createElement("img")
    img.src = preview;
    selector.appendChild(img)
    document.getElementById("theme-list").appendChild(selector)
    var mat = new window['MaterialRadio'](label)
    input.onchange = function () {
      if (input.checked) {
        console.log(name)
        RequestBuilder.sRequestBuilder.post("/settings/app_theme", {
          url: url
        }, function (error, data) {
          document.getElementById("theme-dialog").close()
          window.location.reload(true)
        })
      }
    }
    label['MaterialRadio'] = mat
  }

  RequestBuilder.sRequestBuilder.get("/settings/themes", function (error, data) {
    if (!error) {
      for (var theme of data) {
        createThemeSelector(theme.name, theme.path, theme.preview)

      }
    }
  })
  document.getElementById("paypal").onclick = function () {
    const url = "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YMHT55NSCLER6";
    compatibility.openUrl(url)

  }
  document.getElementById("browser_default_view").onchange = function (value) {
    if (value.target.checked)
      UISettingsHelper.getInstance().set("start_page", "browser");
    else
      UISettingsHelper.getInstance().set("start_page", "recent");
    UISettingsHelper.getInstance().postSettings()
  }
  UISettingsHelper.getInstance().loadSettings(function (settings) {
    if (settings['start_page'] == "browser") {
      document.getElementById("browser_default_view").checked = true
      document.getElementById("browser_default_view").parentNode.classList.add("is-checked")
    } else {
      document.getElementById("browser_default_view").checked = false
      document.getElementById("browser_default_view").parentNode.classList.remove("is-checked")
    }

  })
  document.getElementById("import").onclick = function () {
    var url = "";
    if (compatibility.isElectron) {
      const urlBuilder = require('url')
      const path = require('path')
      url = urlBuilder.format({
        pathname: path.join(__dirname, 'importer/importer.html'),
        protocol: 'file:',
        slashes: true
      })
    } else {
      url = "importer"

    }
    frame.src = url
    document.getElementById("frame-container").style.display = "block"
    setTimeout(function () {
      frame.openDevTools()
    }, 1000)
  }
  if (compatibility.isElectron) {
    document.getElementById("recent-button").href = "index.html"
    document.getElementById("browser-button").href = "index.html"
  } else {
    document.getElementById("recent-button").href = "./"
    document.getElementById("browser-button").href = "./"
  }

  RequestBuilder.sRequestBuilder.get("/settings/settings_css", function (error, data) {
    if (!error) {
      console.log("data " + data)
      for (var sheet of data) {
        Utils.applyCss(sheet)
      }
    }
  })
  var dias = document.getElementsByClassName("mdl-dialog")
  for (var i = 0; i < dias.length; i++) {
    dialogPolyfill.registerDialog(dias[i]);
  }
  if (compatibility.isElectron) {
    frame = document.getElementById("webview");
    console.log("frame " + frame)
    frame.addEventListener('ipc-message', event => {
      if (events[event.channel] !== undefined) {
        for (var callback of events[event.channel])
          callback();
      }
    });
  } else {
    frame = document.getElementById("iframe");

    var eventMethod = window.addEventListener ?
      "addEventListener" :
      "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod === "attachEvent" ?
      "onmessage" :
      "message";
    eventer(messageEvent, function (e) {
      if (events[e.data] !== undefined) {
        for (var callback of events[e.data])
          callback();
      }
    });
  }
  var events = []
  function registerWriterEvent(event, callback) {
    if (events[event] == null) {
      events[event] = []
    }
    events[event].push(callback)
  }


  registerWriterEvent("exit", function () {
    document.getElementById("frame-container").style.display = "none"
  })
}
)