class SettingsCompatibility extends Compatibility {
    constructor() {
        super();
        var compatibility = this;
        $(document).ready(function () {
            if (compatibility.isElectron) {
                var SettingsHelper = require("./settings/settings_helper").SettingsHelper;
                var settingsHelper = new SettingsHelper();
                document.getElementById("export").parentElement.style.display = "none";
                document.getElementById("disconnect").onclick = function () {

                    settingsHelper.setRemoteWebdavAddr(undefined)
                    settingsHelper.setRemoteWebdavUsername(undefined)
                    settingsHelper.setRemoteWebdavPassword(undefined)
                    settingsHelper.setRemoteWebdavPath(undefined)
                }
                document.getElementById("connect").onclick = function () {
                    var {
                        remote
                    } = require('electron');
                    const BrowserWindow = remote.BrowserWindow;

                    var win = new BrowserWindow({
                        width: 500,
                        height: 500,
                        frame: true
                    });
                    const url = require('url')
                    const path = require('path')
                    win.loadURL(url.format({
                        pathname: path.join(__dirname, 'settings/webdav_dialog.html'),
                        protocol: 'file:',
                        slashes: true
                    }))
                    win.setMenu(null)

                }

                if (settingsHelper.getRemoteWebdavAddr() == undefined) {
                    document.getElementById("disconnect").parentElement.style.display = "none";
                    document.getElementById("connect").parentElement.style.display = "block";

                } else {
                    document.getElementById("connect").parentElement.style.display = "none";
                    document.getElementById("disconnect").parentElement.style.display = "block";

                }
            }
        })

    }

}


var compatibility = new SettingsCompatibility();


