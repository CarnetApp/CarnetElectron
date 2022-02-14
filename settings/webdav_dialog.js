$(document).ready(function () {
    document.getElementById("connect-own-server").onclick = function () {
        secondSlide("")
    }
    document.getElementById("is-nextcloud").onchange = toggleRegister;
    $("#address").bind('input', function () {
        toggleRegister();
    })


})

function toggleRegister() {

    if (document.getElementById("is-nextcloud").checked && document.getElementById("address").value !== "")
        document.getElementById("register").style.display = "inline"
    else
        document.getElementById("register").style.display = "none"
}
function secondSlide(server) {
    document.getElementById("address").value = server;
    $("#first-slide").slideToggle();
    $("#second-slide").slideToggle();
    if (server !== "")
        toggleRegister()
}

function register() {
    var {
        shell
    } = require('electron');
    shell.openExternal(getServerAddress() + "/index.php/apps/registration/");
}

function getServerAddress() {
    var addr = document.getElementById("address").value
    if (!addr.startsWith("http"))
        addr = "https://" + addr;
    return addr;
}

function getWebdavAddress() {
    var addr = getServerAddress()
    if (addr.indexOf("remote.php/webdav") < 0 && document.getElementById("is-nextcloud").checked) {
        addr += "/remote.php/webdav";
    }
    return addr;
}

function connect() {
    if (!(document.getElementById("address").value == "" || document.getElementById("username").value == "" || document.getElementById("password").value == "")) {
        document.getElementById("loading-view").style.display = "block"
        const { AuthType, createClient }  = require("webdav");
        this.client = createClient(
            getWebdavAddress(),
            {
                authType: AuthType.Password,
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            }
            
        ).getDirectoryContents("/")
            .then(function (contents) {
                document.getElementById("loading-view").style.display = "none"
                var SettingsHelper = require("../server/settings_helper").SettingsHelper;
                var settingsHelper = new SettingsHelper();
                settingsHelper.setRemoteWebdavAddr(getWebdavAddress())
                settingsHelper.setRemoteWebdavUsername(document.getElementById("username").value)
                settingsHelper.setRemoteWebdavPassword(document.getElementById("password").value)
                settingsHelper.setRemoteWebdavPath(document.getElementById("path").value)

                var SyncDBManager = require("../server/sync/sync_db_manager").SyncDBManager
                SyncDBManager.getInstance().reset()
                const remote = require('@electron/remote');
                const window = remote.getCurrentWindow();
                window.close();
            }).catch(function (e) {
                console.log(e)
                document.getElementById("loading-view").style.display = "none"
                document.getElementById("error").style.display = "block"
            });
    }
}