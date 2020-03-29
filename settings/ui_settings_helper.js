
class UISettingsHelper {
    static getInstance() {
        if (UISettingsHelper.instance == undefined)
            UISettingsHelper.instance = new UISettingsHelper();
        return UISettingsHelper.instance
    }
    loadSettings(callback) {
        if (this.settings == undefined) {
            var Store = compatibility.getStore();
            this.store = new Store();
            try {
                this.settings = JSON.parse(String(this.store.get("ui_settings_cache")))
                callback(this.settings, true)
            } catch (e) {
            }
            RequestBuilder.sRequestBuilder.get("settings/ui", function (error, data) {
                data = data
                UISettingsHelper.instance.settings = data != null ? data : {}
                UISettingsHelper.instance.loadDefaultSettings()
                UISettingsHelper.instance.store.set("ui_settings_cache", JSON.stringify(UISettingsHelper.instance.settings))
                callback(UISettingsHelper.instance.settings, false)
            })
        }
        else
            callback(this.settings, false)
    }

    set(key, value) {
        if (this.settings != undefined) {
            this.settings[key] = value;
        }
    }

    get(key) {
        if (this.settings != undefined)
            return this.settings[key]
    }

    setDefaultSetting(key, value) {
        if (this.settings[key] == undefined)
            this.settings[key] = value
    }

    loadDefaultSettings() {
        this.setDefaultSetting('sort_by', 'default')
        this.setDefaultSetting('reversed', false)
        this.setDefaultSetting('start_page', 'recent')
        this.setDefaultSetting('in_line', false)

    }


    postSettings() {
        this.store.set("ui_settings_cache", JSON.stringify(this.settings))
        RequestBuilder.sRequestBuilder.post("settings/ui", {
            jsonSettings: JSON.stringify(this.settings)
        }, function () {

        })
    }
}