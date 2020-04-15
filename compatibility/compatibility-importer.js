

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.startsWith = function (suffix) {
    return this.indexOf(suffix) === 0;
};

class CompatibilityImporter extends Compatibility {
    constructor() {
        super();
    }
    exit() {
        if (this.isGtk) {
            window.parent.document.title = "msgtopython:::exit"
            parent.postMessage("exit", "*")
        }
        else if (this.isElectron) {
            const {
                ipcRenderer
            } = require('electron')
            ipcRenderer.sendToHost('exit', "")
        }
        else if (this.isAndroid)
            app.postMessage("exit", "*");

        else if (window.self !== window.top) //in iframe
            parent.postMessage("exit", "*")

    }
}

var compatibility = new CompatibilityImporter();
