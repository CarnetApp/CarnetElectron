var compatRequire = undefined
class Compatibility {
    constructor() {
        this.isElectron = typeof require === "function" || typeof parent.require === "function";
        console.log("this.isElectron  " + this.isElectron)
        if (this.isElectron) {
            if (typeof require !== "function") {
                compatRequire = parent.require
            }
            else compatRequire = require
        }
        this.isAndroid = typeof app === "object";

        this.isGtk = false;
        console.log("isAndroid" + this.isAndroid)

        if (this.isElectron) {
            RequestBuilder = ElectronRequestBuilder;
            console.log("set resquest builder")
        }
        if (this.isAndroid) {
            $(document).on('ajaxSend', function (elm, xhr, settings) {
                if (settings.crossDomain === false) {
                    xhr.setRequestHeader('requesttoken', app.getRequestToken());
                    xhr.setRequestHeader('OCS-APIREQUEST', 'true');
                }
            });
        }
    }
    addRequestToken(url) {
        if (this.isAndroid) {
            if (url.indexOf("?") > -1)
                url += "&"
            else url += "?"
            url += "requesttoken=" + app.getRequestToken()
        }
        return url;
    }
    openUrl(url) {
        if (compatibility.isElectron) {
            var {
                shell
            } = require('electron');
            shell.openExternal(url);
        } else if (compatibility.isAndroid) {
            app.openUrl(url)
        } else {
            var win = window.open(url, '_blank');
            win.focus();
        }
    }

    loadLang(callback) {
        RequestBuilder.sRequestBuilder.get('settings/lang/json?lang=tot', function (error, data) {
            $.i18n().load(data).done(callback)
        })

    }

    getStore() {
        if (this.isElectron) {
            return ElectronStore;
        }
        else
            return NextcloudStore;
    }

    openElectronSyncDialog() {
        const remote = require('@electron/remote');

        const BrowserWindow = remote.BrowserWindow;

        var win = new BrowserWindow({
            width: 500,
            height: 500,
            frame: true,
            webPreferences: {
                nodeIntegration: true,
                webviewTag: true,
                enableRemoteModule: true,
                contextIsolation: false,
            }
        });
        const url = require('url')
        const path = require('path')
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'settings/webdav_dialog.html'),
            protocol: 'file:',
            slashes: true
        }))
        win.setMenu(null)
        win.webContents.openDevTools()
        var main = remote.require("./main");
        main.enableEditorWebContent(win.webContents.id)
    }

    sendNextLargeDownload() {
        if (this.largeDownload == undefined) {
            if (currentFrame != undefined) {
                currentFrame.contentWindow.compatibility.sendNextLargeDownload()
                return
            }
            return
        }
        if (this.largeDownload.length <= 0) {
            app.onLargeDownloadEnd()
            this.largeDownload = undefined
        } else {
            var nextSize = this.largeDownload.length > 200000 ? 200000 : this.largeDownload.length
            var next = this.largeDownload.substring(0, nextSize)
            this.largeDownload = this.largeDownload.substring(nextSize)

            app.onNextLargeDownload(next)

        }
    }
}

