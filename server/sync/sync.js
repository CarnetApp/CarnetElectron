
var Sync = function (onSyncEnd) {
    var SettingsHelper = require("../../settings/settings_helper").SettingsHelper;
    this.settingsHelper = new SettingsHelper();
    const Store = require('electron-store');
    this.store = new Store();
    this.fs = require('fs');
    this.path = require('path')
    this.FileUtils = require('../../utils/file_utils').FileUtils
    this.onSyncEnd = onSyncEnd
    this.rimraf = require('rimraf');

}
Sync.prototype.connect = function () {
    var createClient = require("webdav");
    var sync = this;
    this.client = createClient(
        sync.settingsHelper.getRemoteWebdavAddr(),
        sync.settingsHelper.getRemoteWebdavUsername(),
        sync.settingsHelper.getRemoteWebdavPassword()
    );


}

Sync.prototype.startSync = function () {
    var sync = this;
    this.hasDownloadedSmt = false
    if (sync.settingsHelper.getRemoteWebdavAddr() == undefined || sync.settingsHelper.getRemoteWebdavAddr() == null) {
        this.exit();
        return;
    }
    if (this.isSyncing) {
        console.log("is syncing")
        return
    }
    this.isSyncing = true;
    this.connect();
    var sync = this;
    this.nextcloudRoot = sync.settingsHelper.getRemoteWebdavPath()
    console.log(this.nextcloudRoot)

    var dbStr = this.store.get("nextcloud_db", "{}");
    this.db = JSON.parse(dbStr);
    this.remoteFiles = {}
    this.remoteFilesStack = []

    this.remoteFoldersToVisit = [];
    this.localFoldersToVisit = [];
    this.localFiles = [];
    this.localDirToRm = []
    this.remoteDirToRm = []
    this.toUpload = [];
    this.filesToStat = []
    this.toDownload = [];
    this.toFix = [];
    this.toDeleteLocal = [];
    this.toDeleteRemote = [];
    this.client.createDirectory(this.nextcloudRoot).then(function () {
        sync.onDirOK();
    }).catch(function (err) {
        console.log(err);
        sync.onDirOK();
    });


}
var correctPath = function (nextcloudRoot, path) {
    if (path.startsWith(nextcloudRoot))
        path = path.substr(nextcloudRoot.length)
    if (path.startsWith("/" + nextcloudRoot))
        path = path.substr(nextcloudRoot.length + 1)
    if (path.startsWith("/"))
        path = path.substr(1)
    return path;
}

var correctLocalPath = function (localRoot, path) {
    if (path.startsWith(localRoot))
        path = path.substr(localRoot.length)
    if (path.startsWith("/"))
        path = path.substr(1)
    return path;
}

Sync.prototype.onDirOK = function () {
    var sync = this;
    this.visitRemote(this.nextcloudRoot, function () {
        var count = 0;
        for (var k in sync.remoteFiles) {
            if (sync.remoteFiles.hasOwnProperty(k)) {
                ++count;
            }
        }
        console.log("found " + count)
        sync.visitlocal(sync.settingsHelper.getNotePath(), function () {
            sync.handleLocalItems(sync.localFiles.shift(), function () {
                console.log("local ends")
                sync.handleRemoteItems(sync.remoteFilesStack.shift(), function () {
                    sync.exit();
                })
            })
        })
    });
}

Sync.prototype.uploadAndSave = function (localDBItem, callback) {
    console.log("uploading " + localDBItem.path)
    var sync = this;
    if (localDBItem.type === "directory") {
        console.log("mkdir")
        this.client.createDirectory(this.nextcloudRoot + "/" + localDBItem.path).then(function () {
            sync.client.stat(sync.nextcloudRoot + "/" + localDBItem.path).then(function (stat) {
                DBItem.fromNC(sync.nextcloudRoot, stat)
                sync.save(localDBItem, DBItem.fromNC(sync.nextcloudRoot, stat))
                console.log(JSON.stringify(stat, undefined, 4));
                callback()
            }).catch(function (err) {
                console.log(err);
                sync.exit();
            });
        })

    } else {
        var data = this.fs.readFileSync(this.settingsHelper.getNotePath() + "/" + localDBItem.path);

        this.client.putFileContents(this.nextcloudRoot + "/" + localDBItem.path, data, { format: "binary" }).then(function (contents) {

            sync.client.stat(sync.nextcloudRoot + "/" + localDBItem.path).then(function (stat) {
                DBItem.fromNC(sync.nextcloudRoot, stat)
                sync.save(localDBItem, DBItem.fromNC(sync.nextcloudRoot, stat))
                console.log(JSON.stringify(stat, undefined, 4));
                callback()
            }).catch(function (err) {
                console.log(err);
                sync.exit();
            });
        });
    }
}


Sync.prototype.save = function (local, remote) {
    local.remotelastmod = remote.remotelastmod
    this.db[local.path] = local
    this.store.set("nextcloud_db", JSON.stringify(this.db));
}

Sync.prototype.downloadAndSave = function (remoteDBItem, callback) {
    console.log("downloading " + remoteDBItem.path)
    var sync = this;
    var fpath = sync.settingsHelper.getNotePath() + "/" + remoteDBItem.path
    if (remoteDBItem.type === "directory") {
        this.fs.mkdir(fpath, function (err) {
            if (!err) {
                const stat = sync.fs.statSync(fpath)
                sync.save(DBItem.fromFS(sync.settingsHelper.getNotePath(), fpath, stat), remoteDBItem)
                sync.hasDownloadedSmt = true;
                callback();
            }
            else {
                console.log("error " + err)

                sync.exit()
            }
        })
    } else {
        this.client
            .getFileContents(this.nextcloudRoot + "/" + remoteDBItem.path)
            .then(function (data) {
                sync.fs.writeFileSync(fpath, data);
                const stat = sync.fs.statSync(fpath)
                sync.save(DBItem.fromFS(sync.settingsHelper.getNotePath(), fpath, stat), remoteDBItem)
                sync.hasDownloadedSmt = true;
                callback();
            }).catch(function (err) {
                console.log(err);
                sync.exit();
            });
    }
}

Sync.prototype.exit = function (error) {
    this.isSyncing = false;
    console.log("exit, setting sync to 10 minutes")
    var sync = this
    setTimeout(function () {
        sync.startSync()
    }, 10 * 60 * 1000)
    this.onSyncEnd(this.hasDownloadedSmt)
}

Sync.prototype.deleteLocalAndSave = function (local, callback) {
    var sync = this;
    if (local.type === "directory") {
        console.log("delete dir later")
        this.localDirToRm.push(local)
        callback()
    } else {
        console.log("delete " + this.settingsHelper.getNotePath() + "/" + local.path);
        this.fs.unlink(this.settingsHelper.getNotePath() + "/" + local.path, function (err) {
            if (err) {
                sync.exit()
                return
            }
            console.log("err " + err)
            delete sync.db[local.path];
            sync.store.set("nextcloud_db", JSON.stringify(sync.db));
            callback()
        })
    }
}

Sync.prototype.handleRemoteItems = function (remoteDBItem, callback) {
    if (remoteDBItem == undefined) {
        callback()
        return
    }
    console.log("handleRemoteItems")
    var sync = this;
    var cb = function () {
        setTimeout(function () {
            sync.handleRemoteItems(sync.remoteFilesStack.shift(), callback)
        }, 200)
    }
    var inDBItem = sync.db[remoteDBItem.path];
    if (inDBItem === undefined) {
        //download
        this.downloadAndSave(remoteDBItem, cb)
    } else {
        if (inDBItem.remotelastmod === remoteDBItem.remotelastmod) {
            //delete remote
            this.deleteRemoteAndSave(remoteDBItem, cb)
        } else {
            this.downloadAndSave(remoteDBItem, cb)
        }
    }

}

Sync.prototype.deleteRemoteAndSave = function (remote, callback) {
    console.log("delete remote " + remote.path)
    var sync = this
    if (remote.type === "directory") {
        this.remoteDirToRm.push(remote)
        callback()
    } else {
        this.client.deleteFile(this.nextcloudRoot + "/" + remote.path).then(function () {
            delete sync.db[remote.path];
            sync.store.set("nextcloud_db", JSON.stringify(sync.db));
            callback()
        }).catch(function (err) {
            console.log(err);
            sync.exit();
        });;
    }

}
Sync.prototype.handleLocalItems = function (localDBItem, callback) {
    if (localDBItem == undefined) {
        callback()
        return
    }
    console.log(localDBItem.path)
    var sync = this;
    var inDBItem = sync.db[localDBItem.path];
    var remoteDbItem = sync.remoteFiles[localDBItem.path];
    if (remoteDbItem != undefined)
        sync.remoteFilesStack.splice(sync.remoteFilesStack.indexOf(remoteDbItem), 1);
    var cb = function () {
        setTimeout(function () {
            sync.handleLocalItems(sync.localFiles.shift(), callback)
        }, 200)
    }
    if (inDBItem == undefined) { //has never been synced
        if (remoteDbItem == undefined) { //is not on server
            //upload  and save
            console.log("not on server")
            sync.uploadAndSave(localDBItem, cb)
        } else { //is on server
            if (remoteDbItem.remotelastmod !== localDBItem.locallastmod) {
                //conflict

                if (localDBItem.type !== "directory") {
                    console.log("conflict on " + localDBItem.path)
                    sync.fixConflict(localDBItem, remoteDbItem, cb)
                } else cb();

            } else {
                // that's ok !
                console.log("OK 1 ")

                sync.save(localDBItem, remoteDbItem, cb)

            }
        }
    } else { //has already been synced
        if (remoteDbItem == undefined) { //is not on server
            if (localDBItem.locallastmod === inDBItem.locallastmod) { // was already sent
                //delete local...
                sync.deleteLocalAndSave(localDBItem, cb)

            } else {
                //upload
                console.log("not on server")

                sync.uploadAndSave(localDBItem, cb)
            }
        } else { //is on server
            if (remoteDbItem.remotelastmod === inDBItem.remotelastmod) {
                if (localDBItem.locallastmod === inDBItem.locallastmod) {
                    console.log("nothing to do !")
                    cb();
                } else {
                    //upload
                    if (inDBItem.type !== "directory")
                        sync.uploadAndSave(localDBItem, cb)
                    else cb()
                }
            } else if (localDBItem.locallastmod === inDBItem.locallastmod) {
                //download
                if (localDBItem.type !== "directory")
                    sync.downloadAndSave(remoteDbItem, cb)
                else cb()
            } else {
                //conflict

                if (localDBItem.type !== "directory") {
                    console.log("conflict on " + localDBItem.path)
                    sync.fixConflict(localDBItem, remoteDbItem, cb)
                } else cb()
            }


        }

    }

}

Sync.prototype.fixConflict = function (localDBItem, remoteDBItem, callback) {
    var sync = this
    this.client
        .getFileContents(this.nextcloudRoot + "/" + remoteDBItem.path)
        .then(function (remoteData) {

            sync.fs.readFile(sync.settingsHelper.getNotePath() + "/" + localDBItem.path, (err, localData) => {
                if (err) {
                    console.log(err);
                    sync.exit();
                    return;
                }
                if (localData.compare(remoteData) === 0) {
                    console.log("conflict fixed ")
                    sync.save(localDBItem, remoteDBItem)
                    callback();
                } else {
                    console.log("real conflict... fixing ")
                    var name = sync.FileUtils.getFilename(localDBItem.path)
                    var newName = sync.FileUtils.stripExtensionFromName(name) + " conflict " + new Date().getTime();
                    var extension = sync.FileUtils.getExtensionFromPath(name)
                    if (extension != undefined)
                        newName += "." + extension
                    sync.fs.writeFile(sync.settingsHelper.getNotePath() + "/" + sync.FileUtils.getParentFolderFromPath(localDBItem.path) + "/" + newName, localData, (err) => {
                        if (err) {
                            console.log(err);
                            sync.exit();
                            return;
                        }
                        sync.fs.writeFile(sync.settingsHelper.getNotePath() + "/" + localDBItem.path, remoteData, (err) => {
                            if (err) {
                                console.log(err);
                                sync.exit();
                                return;
                            }
                            sync.save(localDBItem, remoteDBItem)
                            callback();

                        });

                    });

                }

            });

        }).catch(function (err) {
            console.log(err);
            sync.exit();
        });
    //
}
Sync.prototype.visitlocal = function (path, callback) {
    var sync = this
    this.fs.readdir(path, (err, files) => {
        if (err) {
            sync.exit()
            return
        }
        for (let file of files) {
            const fpath = this.path.join(path, file);

            sync.filesToStat.push(fpath);

            //console.log(stat.mtimeMs / 1000)
        }
        if (sync.localFoldersToVisit.length !== 0) {
            setTimeout(function () {
                sync.visitlocal(sync.localFoldersToVisit.pop(), callback)

            }, 200)
        } else if (sync.filesToStat.length !== 0)
            sync.statFiles(sync.filesToStat.pop(), callback)
        else callback()
    })

}

Sync.prototype.statFiles = function (fpath, callback) {
    var sync = this;
    this.fs.stat(fpath, (err, stat) => {
        if (err) {
            sync.exit()
            return;
        }
        var localDBItem = DBItem.fromFS(sync.settingsHelper.getNotePath(), fpath, stat);
        sync.localFiles.push(localDBItem);
        if (localDBItem.type == "directory")
            sync.localFoldersToVisit.push(fpath)
        if (sync.filesToStat.length !== 0) {
            sync.statFiles(sync.filesToStat.pop(), callback)
        } else if (sync.localFoldersToVisit.length !== 0) {
            setTimeout(function () {
                sync.visitlocal(sync.localFoldersToVisit.pop(), callback)

            }, 200)
        } else callback()
    })

}


Sync.prototype.visitRemote = function (path, callback) {
    var sync = this;
    this.client
        .getDirectoryContents(path)
        .then(function (contents) {
            for (var i of contents) {
                var item = DBItem.fromNC(sync.nextcloudRoot, i)
                /*if (this.db[item.path] !== undefined && this.db[item.path].remotelastmod === item.remotelastmod){
 
                }*/
                sync.remoteFiles[item.path] = item;
                sync.remoteFilesStack.push(item)
                if (item.type == "directory")
                    sync.remoteFoldersToVisit.push(i.filename)
                // console.log(correctPath(sync.nextcloudRoot, i.filename));
            }
            // console.log("sync.remoteFoldersToVisit.length " + sync.remoteFoldersToVisit.length)
            if (sync.remoteFoldersToVisit.length !== 0) {
                sync.visitRemote(sync.remoteFoldersToVisit.pop(), callback)
            } else
                callback()
        }).catch(function (err) {
            console.log(err);
            sync.exit();
        });
}

var DBItem = function (path, locallastmod, remotelastmod, type) {
    this.path = path;
    this.locallastmod = locallastmod;
    this.remotelastmod = remotelastmod;
    this.type = type;
}
DBItem.fromNC = function (ncroot, ncItem) {
    return new DBItem(correctPath(ncroot, ncItem.filename), undefined, new Date(ncItem.lastmod).getTime() / 1000, ncItem.type);
}
DBItem.fromFS = function (localroot, path, stat) {
    return new DBItem(correctLocalPath(localroot, path), stat.mtimeMs != undefined ? stat.mtimeMs / 1000 : new Date(stat.mtime).getTime() / 1000, undefined, stat.isFile() ? "file" : "directory");
}
exports.Sync = Sync
