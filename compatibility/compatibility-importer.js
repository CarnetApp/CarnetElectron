

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.startsWith = function (suffix) {
    return this.indexOf(suffix) === 0;
};

class CompatibilityImporter extends Compatibility {
    constructor() {
        super();
    }
}

var compatibility = new CompatibilityImporter();
