var isElectron = true;
var rootpath = "";

if (typeof require !== "function") {
	var exports = function () {}
	isElectron = false;
	/*var require = function (required) {
		if (required == "fs") {
			return FSCompatibility;
		} else if (required == "mkdirp") {
			return MKDirPCompatibility;
		} else if (required == "archiver") {
			return ArchiverCompatibility;
		} else if (required == "path")
			return PathCompatibility;
		else if (required == rootpath + "keywords/keywords_db_manager") {
			console.log("building keywordsdb compat")
			return KeywordDBManagerCompatibility;
		}
		return "";
	}*/

} else {
	module.paths.push(rootpath + 'node_modules');
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.startsWith = function(suffix) {
    return this.indexOf(suffix) === 0;
};

var Compatibility = function () {}
Compatibility.onBackPressed = function () {
	if (isElectron) {
		const {
			ipcRenderer
		} = require('electron')
		ipcRenderer.sendToHost('exit', "")
	}
	if (typeof app == "object")
		app.onBackPressed();
}
if (isElectron) {
	require('electron').ipcRenderer.on('loadnote', function (event, path) {
		loadPath(path)
	});
}