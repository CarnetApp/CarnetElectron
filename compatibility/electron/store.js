var ElectronStore = function () {
    const Store = require('electron-store');
    this.store = new Store();
}

ElectronStore.prototype.get = function (key) {
    return this.store.get(key)
}

ElectronStore.prototype.set = function (key, value) {
    this.store.set(key, value);
}