class ElectronRequestBuilder extends RequestBuilder {
    constructor() {
        super("./");
        var remote = require('electron').remote;
        this.main = remote.require("./main.js");
    }
    get(path, callback) {
        console.log("getting " + path)
        this.main.sendRequestToServer("GET", path, undefined, callback);
    }
    post(path, data, callback) {
        this.main.sendRequestToServer("POST", path, data, callback);

    }
    postFiles(path, data, files, callback) {
        if (data == undefined)
            data = {}
        data.files = []
        var request = this;
        var i = 0;
        function readNext() {
            if (i >= files.length) {
                request.main.sendRequestToServer("POST", path, data, callback);
                return;
            }
            var reader = new FileReader();
            reader.readAsDataURL(files[i]);
            reader.onload = function () {
                console.log(reader.result);
                var f = {
                    name: files[i].name,
                    data: reader.result.replace(/^data:image\/\w+;base64,/, "")
                }
                data.files.push(f)
                i++;
                readNext();
            };
        }
        readNext();

    }

    delete(path, callback) {
        this.main.sendRequestToServer("DELETE", path, undefined, callback);
    }
}