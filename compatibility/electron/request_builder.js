class ElectronRequestBuilder extends RequestBuilder {
    constructor() {
        super("./");
        var remote = require('electron').remote;
        this.main = remote.require("./main.js");
    }
    get(path, callback) {
        path = this.buildUrl(this.cleanPath(path));
        console.log("getting " + path)
        this.main.sendRequestToServer("GET", path, undefined, function (err, data) {
            if (data != undefined) {
                try {
                    data = JSON.parse(data)
                } catch (e) {
                }
            }
            callback(err, data)
        });
    }
    post(path, data, callback) {
        path = this.buildUrl(this.cleanPath(path));
        this.main.sendRequestToServer("POST", path, data, function (err, data) {
            if (data != undefined) {
                try {
                    data = JSON.parse(data)
                } catch (e) {
                }
            }
            callback(err, data)
        });

    }

    postFiles(path, data, files, callback) {
        path = this.buildUrl(this.cleanPath(path));
        if (data == undefined)
            data = {}
        data.files = []
        var request = this;
        var i = 0;
        function readNext() {
            if (i >= files.length) {
                request.main.sendRequestToServer("POST", path, data, function (err, data) {
                    if (data != undefined) {
                        try {
                            data = JSON.parse(data)
                        } catch (e) {
                        }
                    }
                    callback(err, data)
                });
                return;
            }
            var reader = new FileReader();
            reader.readAsDataURL(files[i]);
            reader.onload = function () {
                console.log(reader.result.replace(/^data:.*\/\w+;base64,/, ""));
                var f = {
                    name: files[i].name,
                    data: reader.result.replace(/^data:.*\/\w+;base64,/, "")
                }
                data.files.push(f)
                i++;
                readNext();
            };
        }
        readNext();

    }

    delete(path, callback) {
        path = this.buildUrl(this.cleanPath(path));
        this.main.sendRequestToServer("DELETE", path, undefined, function (err, data) {
            if (data != undefined) {
                try {
                    data = JSON.parse(data)
                } catch (e) {
                }
            }
            callback(err, data)
        });
    }

    buildUrl(path) {
        return "/" + path;
    }
}