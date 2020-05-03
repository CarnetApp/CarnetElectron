class Compatibility {
    constructor() {
        this.isElectron = typeof require === "function";
        this.isAndroid = typeof app === "object";
        this.isGtk = false;
        console.log("is electron ?" + this.isElectron)

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
}

