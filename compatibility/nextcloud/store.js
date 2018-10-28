var NextcloudStore = function () {
}

NextcloudStore.prototype.get = function (key) {
    var item = localStorage.getItem(key);
    if (item == null)
        return undefined;
    return item
}

NextcloudStore.prototype.set = function (key, value) {
    localStorage.setItem(key, value);
}