class ElectronRequestBuilder extends RequestBuilder {
    constructor() {
        super("./");
        var remote = require('@electron/remote');
        this.main = remote.require("./main");
    }
    get(path, callback) {
        var requestId = Utils.generateUID()
        path = this.buildUrl(this.cleanPath(path));
        console.log("getting " + path)
        this.main.sendRequestToServer("GET", path, undefined, function (err, data) {
            if (data != undefined) {
                try {
                    data = JSON.parse(data)
                } catch (e) {
                }
            }
            if (!RequestBuilder.sRequestBuilder.isCanceled(requestId))
                callback(err, data)
        });
        return requestId;
    }
    post(path, data, callback) {
        var requestId = Utils.generateUID()
        path = this.buildUrl(this.cleanPath(path));
        this.main.sendRequestToServer("POST", path, data, function (err, data) {
            if (data != undefined) {
                try {
                    data = JSON.parse(data)
                } catch (e) {
                }
            }
            if (!RequestBuilder.sRequestBuilder.isCanceled(requestId))
                callback(err, data)
        });
        return requestId;

    }

    postFiles(path, data, files, callback) {
        var requestId = Utils.generateUID()
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
                    if (!RequestBuilder.sRequestBuilder.isCanceled(requestId))
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
        return requestId;

    }

    delete(path, callback) {
        var requestId = Utils.generateUID()
        path = this.buildUrl(this.cleanPath(path));
        this.main.sendRequestToServer("DELETE", path, undefined, function (err, data) {
            if (data != undefined) {
                try {
                    data = JSON.parse(data)
                } catch (e) {
                }
            }
            if (!RequestBuilder.sRequestBuilder.isCanceled(requestId))
                callback(err, data)
        });
        return requestId;
    }

    buildUrl(path) {
        return "/" + path;
    }
}