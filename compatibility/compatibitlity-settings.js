class SettingsCompatibility extends Compatibility {
    constructor() {
        super();
        var compatibility = this;
        $(document).ready(function () {
            if (compatibility.isElectron) {
                var SettingsHelper = require("./server/settings_helper").SettingsHelper;
                var settingsHelper = new SettingsHelper();
                document.getElementById("window-frame-switch").checked = settingsHelper.displayFrame()
                document.getElementById("window-frame-switch").onchange = function () {
                    settingsHelper.setDisplayFrame(document.getElementById("window-frame-switch").checked)
                    const remote = require('electron').remote;
                    remote.app.relaunch();
                    remote.app.exit(0);
                }
                document.getElementById("export").parentElement.style.display = "none";
                document.getElementById("disconnect").onclick = function () {
                    settingsHelper.setRemoteWebdavAddr(undefined)
                    settingsHelper.setRemoteWebdavUsername(undefined)
                    settingsHelper.setRemoteWebdavPassword(undefined)
                    settingsHelper.setRemoteWebdavPath(undefined)
                    window.location.reload(true)
                }
                document.getElementById("connect").onclick = function () {
                    compatibility.openElectronSyncDialog()

                }

                if (settingsHelper.getRemoteWebdavAddr() == undefined) {
                    document.getElementById("disconnect").parentElement.style.display = "none";
                    document.getElementById("connect").parentElement.style.display = "block";

                } else {
                    document.getElementById("connect").parentElement.style.display = "none";
                    document.getElementById("disconnect").parentElement.style.display = "block";

                }
            } else {
                document.getElementById("window-frame").parentElement.style.display = "none";
                document.getElementById("connect").parentElement.style.display = "none";
                document.getElementById("disconnect").parentElement.style.display = "none";
                document.getElementById("account").onclick = function () {
                    compatibility.openUrl("../../settings/user")
                }
                document.getElementById("logout").onclick = function () {
                    compatibility.openUrl("../../logout?requesttoken=" + document.getElementById("logout-token").innerHTML)
                }
            }
        })

    }

}


var compatibility = new SettingsCompatibility();


