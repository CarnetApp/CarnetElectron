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
        var langs = ["tot"];
        var toLoad;


        toLoad = 'settings/lang/json?lang=tot'

        RequestBuilder.sRequestBuilder.get('settings/lang/json?lang=tot', function (error, data) {
            $.i18n().load(data).done(callback)
        })

    }
}

