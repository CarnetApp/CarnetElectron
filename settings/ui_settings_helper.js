
class UISettingsHelper {
    static getInstance() {
        if (UISettingsHelper.instance == undefined)
            UISettingsHelper.instance = new UISettingsHelper();
    }
    loadSettings(callback) {
        RequestBuilder.sRequestBuilder.get("settings/ui", (data) {
            this.settings = JSON.parse(data)
        })
        this.settings = JSON.parse('"sort-by":"custom"}')
    }

    set(key, value) {
        this.settings[key] = value;
    }

    get(key) {
        return this.settings[key]
    }

    postSettings() {
        RequestBuilder.sRequestBuilder.post("settings/ui", {
            settings: this.settings
        })
    }
}