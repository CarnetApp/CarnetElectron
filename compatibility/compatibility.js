class Compatibility {
    constructor() {
        this.isElectron = typeof require === "function";
        this.isAndroid = typeof app === "object";
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
        } else {
            var win = window.open(url, '_blank');
            win.focus();
        }
    }
}

