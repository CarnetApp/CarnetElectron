

var CacheManager = function () {
    var SettingsHelper = require("./settings_helper").SettingsHelper;
    this.settingsHelper = new SettingsHelper();
    this.cache = JSON.parse(this.settingsHelper.getMetadataCache());

}

CacheManager.sCacheManager = undefined;

CacheManager.getInstance = function () {
    if (CacheManager.sCacheManager == undefined)
        CacheManager.sCacheManager = new CacheManager();
    return CacheManager.sCacheManager
}

CacheManager.prototype.get = function (path) {
    return this.cache[path]
}

CacheManager.prototype.remove = function (path) {
    delete this.cache[path]
}

CacheManager.prototype.put = function (path, data) {
    this.cache[path] = data
}

CacheManager.prototype.write = function () {
    this.settingsHelper.setMetadataCache(JSON.stringify(this.cache))
}

CacheManager.getMTimeFromStat = function (stat) {
    return stat.mtimeMs != undefined ? stat.mtimeMs / 1000 : new Date(stat.mtime).getTime() / 1000
}

exports.CacheManager = CacheManager