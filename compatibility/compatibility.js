class Compatibility {
    constructor() {
        this.isElectron = typeof require === "function";
        this.isAndroid = typeof app === "object";
        console.log("is electron ?" + this.isElectron)

        if (this.isElectron) {
            RequestBuilder = ElectronRequestBuilder;
            console.log("set resquest builder")
        }
    }
}

