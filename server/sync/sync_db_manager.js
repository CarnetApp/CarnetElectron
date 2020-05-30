class SyncDBManager {
    constructor() {
        const Store = require('electron-store');
        this.store = new Store();
        this.db = JSON.parse(this.store.get("nextcloud_db", "{}"));
        this.visitedDb = JSON.parse(this.store.get("nextcloud_visited_db", "{}"));

    }

    addItem(item) {
        this.db[item.path] = item
        this.store.set("nextcloud_db", JSON.stringify(this.db));
    }

    addVisitedItem(item) {
        this.visitedDb[item.path] = item
    }

    saveVisitedDb() {
        this.store.set("nextcloud_visited_db", JSON.stringify(this.visitedDb));

    }

    getItem(path) {
        return this.db[path]
    }

    getVisitedItem(path) {
        return this.visitedDb[path]
    }


    removeItem(item) {
        delete this.db[item.path];
        this.store.set("nextcloud_db", JSON.stringify(this.db));
    }

    removeVisitedItem(item) {
        delete this.visitedDb[item.path];
        this.store.set("nextcloud_visited_db", JSON.stringify(this.visitedDb));
    }

    getChildrenOf(path) {
        var children = []
        if (!path.endsWith("/")) {
            path = path + "/"
        }
        for (var childPath in this.visitedDb) {
            if (childPath.startsWith(path)) {
                children.push(this.visitedDb[childPath].ncItem)
            }
        }
        return children

    }
    reset() {
        this.store.set("nextcloud_db", "{}");
        this.store.set("nextcloud_visited_db", "{}");
        this.db = {}
        this.visitedDb = {}
    }
    setVisitStatus(status) {
        for (var path in this.visitedDb) {
            this.visitedDb[path].visitStatus = status
        }
        this.store.set("nextcloud_visited_db", JSON.stringify(this.visitedDb));

    }

    static getInstance() {
        if (SyncDBManager.staticManager == undefined) {
            SyncDBManager.staticManager = new SyncDBManager();
        }
        return SyncDBManager.staticManager
    }
}

exports.SyncDBManager = SyncDBManager