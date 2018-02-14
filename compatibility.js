var isElectron = true;
if (typeof require !== "function") {

	isElectron = false;
	var require = function (required) {
		if (required == "fs") {
			return FSCompatibility;
		} else if (required == "mkdirp") {
			return MKDirPCompatibility;
		} else if (required == "archiver") {
			return ArchiverCompatibility;
		} else if (required == "path")
			return PathCompatibility;
		else if (required == "../keywords/keywords_db_manager") {
			return KeywordDBManagerCompatibility;
		}
		return "";
	}

}

var Compatibility = function () {}
Compatibility.onBackPressed = function () {
	if (isElectron) {
		const {
			ipcRenderer
		} = require('electron')
		ipcRenderer.sendToHost('exit', "")
	}
	if(typeof app == "function")		 
	app.onBackPressed();
}
if (isElectron) {
	require('electron').ipcRenderer.on('loadnote', function (event, path) {
		console.log(path); // Prints "whoooooooh!"
		loadPath(path)
	});
}