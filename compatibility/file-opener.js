var FileOpener = function () {}
FileOpener.selectFile = function (callback) {
    var electrong = require('electron')
    var dialog = electrong.remote.dialog
    dialog.showOpenDialog(electrong.remote.getCurrentWindow(), {
        properties: ['openFile']
    }, callback)
}