class SettingsCompatibility extends Compatibility {
    constructor() {
        super();
        var compatibility = this;
        $(document).ready(function () {
            if (compatibility.isElectron) {
                document.getElementById("export").parentElement.style.display = "none";
            }
        })

    }

}


var compatibility = new SettingsCompatibility();


