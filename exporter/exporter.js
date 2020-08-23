class SingleExporter {

    constructor(notepath, listener) {
        this.notepath = notepath;
        this.listener = listener;
    }

    retrieveNote(callback) {
        console.log("SingleExporter retrieveNote")

        this.listener.onRetrievingNote();

        var oReq = new XMLHttpRequest();
        oReq.open("GET", RequestBuilder.sRequestBuilder.api_url + RequestBuilder.sRequestBuilder.cleanPath("note/get_note?path=" + encodeURIComponent(this.notepath)), true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response; // Note: not oReq.responseText
            callback(arrayBuffer)
        };

        oReq.send(null);

    }

    loadZipContent(zip, callback) {
        var exporter = this
        this.currentZip = zip
        this.files = Object.keys(zip.files);
        this.html = ""
        this.metadata = {}
        this.attachments = []
        this.loadNextZipFile(this.files.pop(), () => {
            callback(exporter.html, exporter.metadata, exporter.attachments)
        })
    }

    loadNextZipFile(path, callback) {
        if (path == undefined) {
            callback()
            return
        }
        console.log("extracting path " + path + path.indexOf("data/"))
        var exporter = this
        if (path.indexOf("data/") == 0 && path.indexOf("data/preview_") != 0 && path != "data/") {
            this.currentZip.file(path).async("base64").then(function (data) {
                var attachment = {}
                attachment['name'] = FileUtils.getFilename(path)
                attachment['data'] = data
                exporter.attachments.push(attachment)

                exporter.loadNextZipFile(exporter.files.pop(), callback)
            })
        } else if (path == "index.html") {
            this.currentZip.file(path).async("string").then(function (data) {
                console.log("index " + data)
                exporter.html = data;
                exporter.loadNextZipFile(exporter.files.pop(), callback)

            })
        } else if (path == "metadata.json") {
            this.currentZip.file(path).async("string").then(function (data) {
                console.log("metadata " + data)
                exporter.metadata = JSON.parse(data)
                exporter.loadNextZipFile(exporter.files.pop(), callback)

            })
        } else {
            console.log("else")
            exporter.loadNextZipFile(exporter.files.pop(), callback)
        }
    }

    exportAsPDF(callback) {
        var exporter = this
        this.exportAsHtml(false, false, (html, metadata, attachments) => {
            var doc = new jspdf.jsPDF({ orientation: 'p', format: 'a4' });
            var specialElementHandlers = {
                '#editor': function (element, renderer) {
                    return true;
                }
            };
            html.id = "editor"
            var elementHTML = $(html).html();
            document.body.appendChild(html)
            doc.html(html, {
                callback: function (doc) {
                    //   doc.addImage(attachments[0].data)
                    doc.output('datauri');
                    download(FileUtils.stripExtensionFromName(FileUtils.getFilename(exporter.notepath)) + ".pdf", undefined, undefined, doc.output('datauri'))

                }
            });
        })

    }

    exportAndDownloadAsHtml() {
        var exporter = this;
        this.exportAsHtml(false, (htmlElem, metadata, attachments) => {
            exporter.download(FileUtils.stripExtensionFromName(FileUtils.getFilename(exporter.notepath)) + ".html", "<!DOCTYPE html>\n<html>" + htmlElem.innerHTML + '</html>', "text/html")

        })
    }

    exportAsHtml(noImages, callback) {
        var exporter = this
        this.retrieveNote(data => {
            JSZip.loadAsync(data).then(function (zip) {


                exporter.loadZipContent(zip, (html, metadata, attachments) => {
                    var htmlElem = document.createElement("html")
                    var head = document.createElement("head")
                    head.innerHTML = ""
                    if (!noImages) {
                        head.innerHTML += "<style>body{max-width:500px;}#media-list{white-space: nowrap; overflow-x: auto;}#media-list img{max-height:300px;margin-right:5px;} </style>"
                    }
                    htmlElem.appendChild(head)
                    var body = document.createElement("body")
                    if (attachments.length > 0) {
                        if (!noImages) {
                            var mediaList = document.createElement("div")
                            mediaList.id = "media-list"
                            for (var attachment of attachments) {
                                var a = document.createElement("a")
                                var base64ref = "data:" + FileUtils.geMimetypeFromExtension(FileUtils.getExtensionFromPath(attachment.name)) + ";base64," + attachment.data
                                a.href = base64ref
                                if (FileUtils.isFileImage(attachment.name)) {
                                    var img = document.createElement("img")
                                    img.src = base64ref
                                    a.appendChild(img)
                                }
                                mediaList.appendChild(a)
                            }
                            body.appendChild(mediaList)
                        }
                    }
                    var text = document.createElement("div")
                    text.id = "text"
                    text.innerHTML = html
                    body.appendChild(text)

                    htmlElem.appendChild(body)
                    callback(htmlElem, metadata, attachments)
                })
            })
            console.log("SingleExporter retrieving: success")

        });
    }
    download(filename, text, mimetype, datauri) {
        var element = document.createElement('a');
        if (datauri == undefined)
            element.setAttribute('href', 'data:' + mimetype + ';charset=utf-8,' + encodeURIComponent(text));
        else
            element.setAttribute('href', datauri);

        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
}

