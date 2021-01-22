class CarnetConverter {
    constructor(importer) {
        this.importer = importer;
        this.removeRoot = undefined;
    }

    getDestPath() {
        return "/";
    }


    importFilesToZip = function (notePath, currentZip, destZip, files, callback) {
        if (files == undefined || files.length <= 0) {
            callback()
            return;
        }
        var importer = this;
        var file = files.pop()
        console.log("importing " + file)

        currentZip.files[notePath + file].async("base64")
            .then(function (data) {
                destZip.file(file, data, { base64: true });
                importer.importFilesToZip(notePath, currentZip, destZip, files, callback)
            })
    }

    convertNoteToSQD(currentZip, notePath, destFolder, callback) {
        console.log("convertNoteToSQD " + notePath)

        var fileName = notePath.endsWith("/") ? FileUtils.getFilename(notePath.substring(0, notePath.length - 1)) : FileUtils.getFilename(notePath);
        var converter = this;
        var dest = FileUtils.getParentFolderFromPath(notePath)

        //detect if root path(for example in nextcloud we don't want to keep QuickNote root folder)
        if (this.importer.archiveName.indexOf("no_root") < 0) {
            if (this.removeRoot == undefined) {
                //check if all notes have same root
                if (this.pathList.length > 0) {
                    var sameRoot = true;
                    var root = undefined
                    for (var path of this.pathList) {
                        var splitPath = path.split("/")
                        var thisRoot = undefined;
                        if (splitPath.length > 0) {
                            thisRoot = splitPath[0]
                            if (thisRoot == "" || thisRoot == undefined) {
                                thisRoot = undefined
                                if (splitPath.length > 1)
                                    thisRoot = splitPath[1]
                            }
                        }
                        if (root == undefined)
                            root = thisRoot
                        console.log("current root " + root)
                        if (root != thisRoot) {
                            sameRoot = false
                            break;
                        }
                    }
                    if (sameRoot && root != undefined) {
                        this.removeRoot = root
                    }
                } else this.removeRoot = false
            }
            if (this.removeRoot) {
                var toRemove = this.removeRoot.length
                if (dest.indexOf("/") === 0) {
                    toRemove++;
                }
                dest = dest.substring(toRemove)
            }
        }
        if (notePath.endsWith("/")) { // is folder note, need to create a directory
            var filesToImportToZip = []
            var zip = new JSZip();

            currentZip.folder(notePath).forEach(function (relativePath, zipEntry) {
                console.log(relativePath)
                filesToImportToZip.push(relativePath)
            })
            converter.importFilesToZip(notePath, currentZip, zip, filesToImportToZip, function () {
                zip.generateAsync({ type: "blob" }).then(function (noteBlob) {
                    currentZip.files[notePath + "metadata.json"].async('string').then(function (metadata) {
                        callback(noteBlob, metadata, fileName, metadata.isPinned, dest)
                    });


                })
            })

        }
        else {
            currentZip.files[notePath].async('blob').then(function (noteBlob) {
                console.log("blob loaded " + noteBlob)

                noteBlob.arrayBuffer().then(buffer => {
                    console.log("buffer loaded " + buffer)

                    JSZip.loadAsync(buffer).then(function (noteZip) {
                        console.log("noteZip loaded " + noteZip)
                        if (noteZip.files["metadata.json"] != undefined)
                            noteZip.files["metadata.json"].async('string').then(function (metadata) {
                                console.log("metadata loaded ")

                                callback(noteBlob, metadata, fileName, metadata.isPinned, dest)
                            })
                        else callback(undefined)

                    }, function (e) {
                        console.log("error " + e)
                        callback(undefined)

                    });
                });

            })
        }

    }

    getListOfNotesFromZip(zip, callback) {
        var list = []
        zip.forEach(function (relativePath, zipEntry) {
            console.log("note " + relativePath)
            if (relativePath.endsWith(".sqd") || relativePath.endsWith(".sqd/")) {
                list.push(relativePath)

            }
        });
        this.pathList = list;
        callback(list)
    }

    hasRecentDB() {
        return true;
    }
}