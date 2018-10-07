
var rootpath = "";

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.startsWith = function (suffix) {
    return this.indexOf(suffix) === 0;
};

class CompatibilityEditor extends Compatibility {
    contructor() {
        super();
        if (this.isElectron) {
            module.paths.push(rootpath + 'node_modules');
            require('electron').ipcRenderer.on('loadnote', function (event, path) {
                loadPath(path)
            });
        } else {
            var exports = function () { }
        }
    }
    exit() {
        if (this.isElectron) {
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
    onNoteLoaded() {
        if (this.isElectron) {
            const {
                ipcRenderer
            } = require('electron')
            ipcRenderer.sendToHost('loaded', "")
        } else if (this.isAndroid) {
            app.hideProgress();
        } else {
            parent.postMessage("loaded", "*")
        }
    }
}

var compatibility = new CompatibilityEditor();
var isElectron = compatibility.isElectron;