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
        var langs = ["en", "fr", "de"];
        var toLoad = {}

        for (var lang of langs) {
            toLoad[lang] = (!this.isElectron ? RequestBuilder.sRequestBuilder.api_url : "/") + 'settings/lang/json?lang=' + lang
        }

        if (!this.isElectron) {
            $.i18n().load(toLoad).done(callback)
        }
        else {
            var size = Object.keys(toLoad).length
            var i = 0;
            var total = {}
            for (const key of Object.keys(toLoad)) {
                RequestBuilder.sRequestBuilder.get(toLoad[key], function (error, data) {
                    i++;
                    total[key] = data
                    if (i == size) {
                        $.i18n().load(total).done(callback)
                    }
                })

            }
        }

    }
}

