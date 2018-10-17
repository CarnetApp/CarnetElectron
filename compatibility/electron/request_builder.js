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
}