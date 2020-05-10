class BrowserCompatibility extends Compatibility {
    constructor() {
        super();
        var compatibility = this;
        $(document).ready(function () {
            if (compatibility.isGtk) {
                document.getElementsByClassName('mdl-layout__header')[0].style.display = "none"
                document.getElementById('grid-button-container').style.display = "none"
            }
            else if (!compatibility.isElectron) {
                const right = document.getElementById("right-bar");
                right.removeChild(document.getElementById("minus-button"))
                right.removeChild(document.getElementById("close-button"))
                document.getElementById("settings-button").href = "./settings"
                document.getElementById("size-button").onclick = function () {
                    if (!isFullScreen()) {
                        const docElm = document.getElementById("content");
                        if (docElm.requestFullscreen) {
                            docElm.requestFullscreen();
                        } else if (docElm.mozRequestFullScreen) {
                            docElm.mozRequestFullScreen();
                        } else if (docElm.webkitRequestFullScreen) {
                            docElm.webkitRequestFullScreen();
                        }

                    } else {
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.mozCancelFullScreen) {
                            document.mozCancelFullScreen();
                        } else if (document.webkitCancelFullScreen) {
                            document.webkitCancelFullScreen();
                        }
                    }
                }

            } else {
                const {
                    remote,
                    ipcRenderer
                } = require('electron');
                $('head').append("<style>\
                @media screen and (min-width: 1400px) {\
				#loading-view {\
					top: 20px;\
					height: calc(100% - 40px);\
				}\
				#editor-container{\
					height:calc(100% - 40px);\
					padding-top:20px;\
					padding-bottom:20px;\
				}\
			}</style>");
                var syncButton = document.getElementById("sync-button");
                syncButton.style.display = "inline"
                ipcRenderer.on('sync-start', (event, arg) => {
                    syncButton.classList.add("rotation")
                    syncButton.disabled = true;
                });
                ipcRenderer.on('sync-stop', (event, arg) => {
                    syncButton.classList.remove("rotation")
                    syncButton.disabled = false;
                });
                var main = remote.require("./main.js");
                if (main.isSyncing()) {
                    syncButton.classList.add("rotation")
                    syncButton.disabled = true;
                }
                syncButton.onclick = function () {
                    if (!main.startSync()) {
                        compatibility.openElectronSyncDialog()
                    }
                }
                var SettingsHelper = require("./server/settings_helper").SettingsHelper;
                var settingsHelper = new SettingsHelper();
                if (settingsHelper.displayFrame()) {
                    document.getElementById("minus-button").style.display = "none"
                    document.getElementById("size-button").style.display = "none"
                    document.getElementById("close-button").style.display = "none"
                }
                else {

                    document.getElementById("minus-button").onclick = function () {
                        remote.BrowserWindow.getFocusedWindow().minimize();
                    }
                    document.getElementById("size-button").onclick = function () {
                        if (remote.BrowserWindow.getFocusedWindow().isMaximized())
                            remote.BrowserWindow.getFocusedWindow().unmaximize();
                        else
                            remote.BrowserWindow.getFocusedWindow().maximize();
                    }
                    document.getElementById("close-button").onclick = function () {
                        remote.app.exit(0);
                    }
                }
                registerWriterEvent("exit", function () {
                    main.syncOneNote(currentNotePath)
                })
                document.getElementById("settings-button").href = "settings.html"
                setTimeout(function () {
                    RequestBuilder.sRequestBuilder.get("/settings/current_version", function (error, version) {
                        if (!error) {
                            console.log("current version " + version)
                            $.ajax({
                                url: "https://qn.phie.ovh/binaries/desktop/current_version",
                                type: "GET",
                                success: function (newVersion) {
                                    console.log("new version " + newVersion)
                                    if (parseInt(version.replace(/\./g, "")) < parseInt(newVersion.replace(/\./g, ""))) {
                                        displaySnack(
                                            {
                                                message: "New version available",
                                                timeout: 10000,
                                                actionHandler: function () {
                                                    var {
                                                        shell
                                                    } = require('electron');
                                                    shell.openExternal("https://qn.phie.ovh/binaries/desktop/");
                                                },
                                                actionText: 'Download'
                                            })
                                    }
                                },
                                fail: function () {
                                },
                                error: function (e) {
                                }
                            });

                        }

                    })
                }, 5000)

            }
        });

    }

    onFirstrunEnds() {
        if (this.isElectron) {
            this.openElectronSyncDialog()
        }
    }
    getEditorUrl() {
        if (this.isElectron)
            return "";

        else if (!this.isAndroid)
            return "writer"
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


