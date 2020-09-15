
var rootpath = "";

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.startsWith = function (suffix) {
    return this.indexOf(suffix) === 0;
};

class CompatibilityExporter extends Compatibility {
    constructor() {
        super();

    }

    print(htmlElement) {

        if (this.isAndroid) {
            app.print(htmlElement.innerHTML)
        } else {
            var ifr = document.createElement('iframe');
            ifr.style = 'height: 0px; width: 0px; position: absolute'
            document.body.appendChild(ifr);
            ifr.contentDocument.body.appendChild(htmlElement)
            ifr.contentWindow.print();

            ifr.parentElement.removeChild(ifr);
        }
    }


}

var compatibility = new CompatibilityExporter();
var isElectron = compatibility.isElectron;