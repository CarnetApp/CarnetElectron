
var rootpath = "";

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.startsWith = function (suffix) {
    return this.indexOf(suffix) === 0;
};

class CompatibilityEditor extends Compatibility {
    constructor() {
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

    print(printTitle, printMod, printCreation, note) {
        var dateC = new Date(note.metadata.creation_date)
        var dateM = new Date(note.metadata.last_modification_date)
        var tmpDiv = document.createElement('div');
        if(printTitle)
            tmpDiv.innerHTML += "<h3>"+FileUtils.stripExtensionFromName(FileUtils.getFilename(note.path))+"<h3>";
        if(printCreation)
            tmpDiv.innerHTML += "<span> Created: "+dateC.toLocaleDateString()+" "+dateC.toLocaleTimeString()+"</span><br />";
        if(printMod)
            tmpDiv.innerHTML += "<span> Modified: "+dateM.toLocaleDateString()+" "+dateM.toLocaleTimeString()+"</span><br />";
        if(printMod || printCreation)
            tmpDiv.innerHTML += "<br />";
        tmpDiv.innerHTML += writer.oDoc.innerHTML
        if (this.isAndroid) {
            app.print(tmpDiv.innerHTML)
        } else {
            var ifr = document.createElement('iframe');
            ifr.style = 'height: 0px; width: 0px; position: absolute'
            document.body.appendChild(ifr);

            $(tmpDiv).clone().appendTo(ifr.contentDocument.body);
            ifr.contentWindow.print();

            ifr.parentElement.removeChild(ifr);
        }
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

    getRecorder(options) {
        if (this.isAndroid) return new AndroidRecorder(options);
        return new Recorder(options);
    }

    onNoteLoaded() {
        if (this.isGtk) {
            document.getElementsByClassName('mdl-layout__header')[0].style.display = "none"
            window.parent.document.title = "msgtopython:::noteloaded"
        }
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