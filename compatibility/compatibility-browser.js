class BrowserCompatibility extends Compatibility {
    constructor() {
        super();

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

