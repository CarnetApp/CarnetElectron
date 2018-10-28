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
                    remote
                } = require('electron');
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
                                    if (version != newVersion) {
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

