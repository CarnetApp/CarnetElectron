class BrowserCompatibility extends Compatibility {
    constructor() {
        super();
        var compatibility = this;
        $(document).ready(function () {
            if (!compatibility.isElectron) {
                const right = document.getElementById("right-bar");
                right.removeChild(document.getElementById("minus-button"))
                right.removeChild(document.getElementById("close-button"))
                document.getElementById("settings-button").href = "./settings"

            }
        });

    }
    getEditorUrl() {
        if (this.isElectron)
            return "";

        else if (!this.isAndroid)
            return "writer"
    }
    getStore() {
        if (this.isElectron) {
            return ElectronStore;
        }
        else
            return NextcloudStore;
    }

    getMasonry() {
        if (this.isElectron) {
            return require('masonry-layout');
        }
        else return Masonry;
    }
}


var compatibility = new BrowserCompatibility();


var Store = compatibility.getStore();

