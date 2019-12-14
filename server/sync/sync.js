var CacheManager = require('../cache_manager').CacheManager;
var NoteOpener = require("../note/note-opener").NoteOpener;
var Note = require("../../browsers/note").Note;

var Sync = function (onSyncStart, onSyncEnd) {
    var SettingsHelper = require("../settings_helper").SettingsHelper;
    this.settingsHelper = new SettingsHelper();
    const Store = require('electron-store');
    this.store = new Store();
    this.fs = require('fs');
    this.path = require('path')
    this.FileUtils = require('../../utils/file_utils').FileUtils
    this.onSyncStart = onSyncStart
    this.syncNext = []
    this.onSyncEnd = onSyncEnd
    this.rimraf = require('rimraf');

}
Sync.prototype.connect = function () {
    var createClient = require("webdav");
    var sync = this;
    console.logDebug("connecting with " + sync.settingsHelper.getRemoteWebdavUsername())

    this.client = createClient(
        sync.settingsHelper.getRemoteWebdavAddr(),
        sync.settingsHelper.getRemoteWebdavUsername(),
        sync.settingsHelper.getRemoteWebdavPassword()
    );


}

Sync.prototype.startSync = function (onDirOK) {
    var sync = this;
    this.isFullSync = onDirOK == undefined;
    if (onDirOK == undefined)
        onDirOK = function () {
            sync.onDirOK()
        }
    this.hasDownloadedSmt = false
    if (sync.settingsHelper.getRemoteWebdavAddr() == undefined || sync.settingsHelper.getRemoteWebdavAddr() == null) {
        this.exit();
        return false;
    }
    if (this.isSyncing) {
        console.logDebug("is syncing")
        return false;
    }
    this.isSyncing = true;
    this.onSyncStart();
    this.connect();
    var sync = this;
    this.nextcloudRoot = sync.settingsHelper.getRemoteWebdavPath()
    console.logDebug(this.nextcloudRoot)

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
        onDirOK();
    }).catch(function (err) {
        console.logDebug(err);
        onDirOK();
    });
    return true;


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
    if (!this.fs.existsSync(this.settingsHelper.getNotePath()))
        this.fs.mkdirSync(this.settingsHelper.getNotePath())
    this.visitRemote(this.nextcloudRoot, function () {
        var count = 0;
        for (var k in sync.remoteFiles) {
            if (sync.remoteFiles.hasOwnProperty(k)) {
                ++count;
            }
        }
        console.logDebug("found " + count)
        var t = new Date().getTime()
        sync.visitlocal(sync.settingsHelper.getNotePath(), function () {
            console.log("visit ok " + (new Date().getTime() - t))
            sync.handleLocalItems(sync.localFiles.shift(), function () {
                console.logDebug("local ends")
                sync.handleRemoteItems(sync.remoteFilesStack.shift(), function () {
                    sync.exit();
                })
            })
        })
    });
}

Sync.prototype.uploadAndSave = function (localDBItem, callback) {
    console.logDebug("uploading " + localDBItem.path)
    var sync = this;
    if (localDBItem.type === "directory") {
        console.logDebug("mkdir")
        this.client.createDirectory(this.nextcloudRoot + "/" + localDBItem.path).then(function () {
            sync.client.stat(sync.nextcloudRoot + "/" + localDBItem.path).then(function (stat) {
                DBItem.fromNC(sync.nextcloudRoot, stat)
                sync.save(localDBItem, DBItem.fromNC(sync.nextcloudRoot, stat))
                console.logDebug(JSON.stringify(stat, undefined, 4));
                callback()
            }).catch(function (err) {
                console.logDebug(err);
                sync.exit();
            });
        })

    } else {
        var data = this.fs.readFileSync(this.settingsHelper.getNotePath() + "/" + localDBItem.path);

        this.client.putFileContents(this.nextcloudRoot + "/" + localDBItem.path, data, { format: "binary" }).then(function (contents) {

            sync.client.stat(sync.nextcloudRoot + "/" + localDBItem.path).then(function (stat) {
                DBItem.fromNC(sync.nextcloudRoot, stat)
                sync.save(localDBItem, DBItem.fromNC(sync.nextcloudRoot, stat))
                console.logDebug(JSON.stringify(stat, undefined, 4));
                callback()
            }).catch(function (err) {
                console.logDebug(err);
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
    console.logDebug("downloading " + remoteDBItem.path)
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
                console.logDebug("error " + err)

                sync.exit()
            }
        })
    } else {
        this.client
            .getFileContents(this.nextcloudRoot + sync.path.sep + remoteDBItem.path)
            .then(function (data) {
                sync.fs.writeFileSync(fpath, data);
                const stat = sync.fs.statSync(fpath)
                sync.save(DBItem.fromFS(sync.settingsHelper.getNotePath(), fpath, stat), remoteDBItem)
                sync.hasDownloadedSmt = true;
                var notePath = fpath;
                if (!notePath.endsWith(".sqd")) {
                    notePath = sync.FileUtils.getParentFolderFromPath(notePath)
                    if (notePath.endsWith(sync.path.sep + "data")) {
                        notePath = sync.FileUtils.getParentFolderFromPath(notePath)
                    }
                }
                if (notePath.endsWith(".sqd")) {
                    sync.addToCache(notePath, sync.correctLocalPath(sync.settingsHelper.getNotePath(), notePath), stat);

                }
                callback();
            }).catch(function (err) {
                console.logDebug(err);
                sync.exit();
            });
    }
}

Sync.prototype.addToCache = function (fullpath, relativePath, stat) {
    new NoteOpener(new Note("", "", fullpath), relativePath).getMainTextMetadataAndPreviews(function (text, metadata, previews, media) {
        if (text != undefined) {
            CacheManager.getInstance().put(relativePath, {
                last_file_modification: CacheManager.getMTimeFromStat(stat),
                shorttext: text != undefined ? text.substr(0, text.length > 200 ? 200 : text.length) : "",
                metadata: metadata,
                previews: previews,
                media: media
            })
        }
    })
}

Sync.prototype.exit = function (error) {
    this.isSyncing = false;
    console.logDebug("exit")
    var sync = this
    CacheManager.getInstance().write()
    if (this.isFullSync) {
        console.log("setting sync to 10 minutes")
        this.nextFullSyncTO = setTimeout(function () {
            sync.startSync()
        }, 10 * 60 * 1000)
    }
    this.onSyncEnd(this.hasDownloadedSmt)
    if (this.syncNext.length > 0) {
        var toSync = this.syncNext.pop();
        this.syncOneItem(toSync.path, toSync.callback)
    }
}

Sync.prototype.deleteLocalAndSave = function (local, callback) {
    var sync = this;
    if (local.type === "directory") {
        console.logDebug("delete dir later")
        this.localDirToRm.push(local)
        callback()
    } else {
        console.logDebug("delete " + this.settingsHelper.getNotePath() + "/" + local.path);
        this.fs.unlink(this.settingsHelper.getNotePath() + "/" + local.path, function (err) {
            if (err) {
                sync.exit()
                return
            }
            if (local.path.endsWith(".sqd"))
                CacheManager.getInstance().remove(local.path)
            console.logDebug("err " + err)
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
    console.logDebug("handleRemoteItems")
    var sync = this;
    var cb = function () {
        setTimeout(function () {
            sync.handleRemoteItems(sync.remoteFilesStack.shift(), callback)
        }, 50)
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
/**
 * Error not reported: file doesn't exist.
 */
Sync.prototype.syncOneItem = function (localRelativePath, callback) {
    if (this.isSyncing) {
        console.log("is syncing, delaying")
        this.syncNext.push({ path: localRelativePath, callback: callback })
        return;
    }
    console.log("sync one item " + localRelativePath)

    var sync = this;
    sync.startSync(function () {
        sync.fs.stat(sync.path.join(sync.settingsHelper.getNotePath(), localRelativePath), (err, stat) => {
            var localDBItem = undefined;
            if (err) {
                console.logDebug(err)
                if (err.errno !== -2) { // not existing
                    sync.exit()
                    callback(true)
                }
            }
            else
                localDBItem = DBItem.fromFS(sync.settingsHelper.getNotePath(), localRelativePath, stat);
            sync.client
                .stat(sync.nextcloudRoot + "/" + localRelativePath)
                .then(function (stat) {
                    var item = DBItem.fromNC(sync.nextcloudRoot, stat)
                    sync.remoteFiles[item.path] = item;
                    console.logDebug("file stat " + stat)
                    if (localDBItem != undefined) {
                        sync.remoteFilesStack.push(item)
                        sync.handleLocalItems(localDBItem, function () {
                            console.logDebug("end")
                            sync.exit()
                            callback(false)
                        })
                    }
                    else
                        sync.handleRemoteItems(item, function () {
                            console.logDebug("end")
                            sync.exit()
                            callback(false)
                        })
                }).catch(function (err) {
                    console.logDebug(err.status);
                    if (err.status == 404 && localDBItem != undefined) {
                        sync.handleLocalItems(localDBItem, function () {
                            console.logDebug("end")
                            sync.exit()
                            callback(false)
                        })
                    }
                    else {
                        sync.exit();
                        callback(false)
                    }
                });
        })

    })

}

Sync.prototype.deleteRemoteAndSave = function (remote, callback) {
    console.logDebug("delete remote " + remote.path)
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
            console.logDebug(err);
            sync.exit();
        });;
    }

}
Sync.prototype.handleLocalItems = function (localDBItem, callback) {
    if (localDBItem == undefined) {
        callback()
        return
    }
    console.logDebug(localDBItem.path)
    var sync = this;
    var inDBItem = sync.db[localDBItem.path];
    var remoteDbItem = sync.remoteFiles[localDBItem.path];
    if (remoteDbItem != undefined)
        sync.remoteFilesStack.splice(sync.remoteFilesStack.indexOf(remoteDbItem), 1);
    var cb = function () {
        setTimeout(function () {
            sync.handleLocalItems(sync.localFiles.shift(), callback)
        }, 50)
    }
    if (inDBItem == undefined) { //has never been synced
        if (remoteDbItem == undefined) { //is not on server
            //upload  and save
            console.logDebug("not on server")
            sync.uploadAndSave(localDBItem, cb)
        } else { //is on server
            if (remoteDbItem.remotelastmod !== localDBItem.locallastmod) {
                //conflict

                if (localDBItem.type !== "directory") {
                    console.logDebug("conflict on " + localDBItem.path)
                    sync.fixConflict(localDBItem, remoteDbItem, cb)
                } else cb();

            } else {
                // that's ok !
                console.logDebug("OK 1 ")

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
                console.logDebug("not on server")

                sync.uploadAndSave(localDBItem, cb)
            }
        } else { //is on server
            if (remoteDbItem.remotelastmod === inDBItem.remotelastmod) {
                if (localDBItem.locallastmod === inDBItem.locallastmod) {
                    console.logDebug("nothing to do !")
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
                    console.logDebug("conflict on " + localDBItem.path)
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
                    console.logDebug(err);
                    sync.exit();
                    return;
                }
                if (localData.compare(remoteData) === 0) {
                    console.logDebug("conflict fixed ")
                    sync.save(localDBItem, remoteDBItem)
                    callback();
                } else {
                    console.logDebug("real conflict... fixing ")
                    var name = sync.FileUtils.getFilename(localDBItem.path)
                    var newName = sync.FileUtils.stripExtensionFromName(name) + " conflict " + new Date().getTime();
                    var extension = sync.FileUtils.getExtensionFromPath(name)
                    if (extension != undefined)
                        newName += "." + extension
                    sync.fs.writeFile(sync.settingsHelper.getNotePath() + "/" + sync.FileUtils.getParentFolderFromPath(localDBItem.path) + "/" + newName, localData, (err) => {
                        if (err) {
                            console.logDebug(err);
                            sync.exit();
                            return;
                        }
                        sync.fs.writeFile(sync.settingsHelper.getNotePath() + "/" + localDBItem.path, remoteData, (err) => {
                            if (err) {
                                console.logDebug(err);
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
            console.logDebug(err);
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

            //console.logDebug(stat.mtimeMs / 1000)
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
        else if (fpath.endsWith(".sqd")) {
            var cached = CacheManager.getInstance().get(localDBItem.path);
            if (cached == undefined || cached == null || cached.last_file_modification !== CacheManager.getMTimeFromStat(stat)) {
                sync.addToCache(fpath, localDBItem.path, stat)
            }
        }
        if (sync.filesToStat.length !== 0) {
            setTimeout(function () {
                sync.statFiles(sync.filesToStat.pop(), callback)
            }, 10)
        } else if (sync.localFoldersToVisit.length !== 0) {
            setTimeout(function () {
                sync.visitlocal(sync.localFoldersToVisit.pop(), callback)

            }, 100)
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
                // console.logDebug(correctPath(sync.nextcloudRoot, i.filename));
            }
            // console.logDebug("sync.remoteFoldersToVisit.length " + sync.remoteFoldersToVisit.length)
            if (sync.remoteFoldersToVisit.length !== 0) {
                sync.visitRemote(sync.remoteFoldersToVisit.pop(), callback)
            } else
                callback()
        }).catch(function (err) {
            console.logDebug(err);
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
