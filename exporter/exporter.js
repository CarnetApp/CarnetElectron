var writer = undefined
class SingleExporter {

    constructor(notepath, listener) {
        this.notepath = notepath;
        this.listener = listener;
    }

    retrieveNote(callback) {
        console.log("SingleExporter retrieveNote")

        this.listener.onRetrievingNote();
        if (!compatibility.isElectron) {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", compatibility.addRequestToken(RequestBuilder.sRequestBuilder.api_url + RequestBuilder.sRequestBuilder.cleanPath("note/get_note?path=" + encodeURIComponent(this.notepath))), true);
            oReq.responseType = "arraybuffer";

            oReq.onload = function (oEvent) {
                var arrayBuffer = oReq.response; // Note: not oReq.responseText
                callback(arrayBuffer, false)
            };

            oReq.send(null);
        } else {
            RequestBuilder.sRequestBuilder.get("note/get_note?path=" + encodeURIComponent(this.notepath), (error, data) => {
                callback(data, true)
            })

        }

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

    exportAndDownloadAsHtml(config, share) {
        var exporter = this;
        this.exportAsHtml(config, false, (htmlElem, metadata, attachments) => {
            exporter.download(FileUtils.stripExtensionFromName(FileUtils.getFilename(exporter.notepath)) + ".html", "<!DOCTYPE html>\n<html>" + htmlElem.innerHTML + '</html>', "text/html", undefined, share)

        })
    }

    print(config) {
        this.exportAsHtml(config, false, (htmlElem, metadata, attachments) => {
            compatibility.print(htmlElem)
        }
        )
    }

    exportAsHtml(config, noImages, callback) {
        var exporter = this
        exporter.listener.onExportStarts();
        this.retrieveNote((data, base64) => {
            JSZip.loadAsync(data, { base64: base64 }).then(function (zip) {


                exporter.loadZipContent(zip, (html, metadata, attachments) => {
                    var htmlElem = document.createElement("html")
                    var head = document.createElement("head")
                    head.innerHTML = "<meta charset=\"UTF-8\">\
                    <meta name=\"viewport\" content=\"width=device-width, height=device-height, user-scalable=no\" />"
                    if (!noImages) {
                        head.innerHTML += "<style>body{max-width:1000px; margin:auto; }#media-list{white-space: nowrap; overflow-x: auto;}#media-list img{max-height:300px;margin-right:5px;} #full-media-list img{max-width:100%;} </style>"
                    }
                    var todolistStyle = "<style></style>";

                    head.innerHTML += todolistStyle
                    htmlElem.appendChild(head)
                    var body = document.createElement("body")
                    if (attachments.length > 0) {
                        if (config.displayImages) {
                            var mediaList = document.createElement("div")
                            if (!config.displayCompleteImages) {
                                mediaList.id = "media-list"
                                console.log("small iamges")
                            } else {
                                mediaList.id = "full-media-list"
                            }

                            for (var attachment of attachments) {
                                var a = document.createElement("a")
                                var base64ref = "data:" + FileUtils.geMimetypeFromExtension(FileUtils.getExtensionFromPath(attachment.name)) + ";base64," + attachment.data

                                if (FileUtils.isFileImage(attachment.name)) {
                                    var img = document.createElement("img")
                                    img.src = base64ref
                                    a.classList.add("img-link")
                                    a.appendChild(img)


                                } else {
                                    a.href = base64ref

                                }

                                mediaList.appendChild(a)
                            }
                            body.appendChild(mediaList)
                        }
                    }
                    var dateC = new Date(metadata.creation_date)
                    var dateM = new Date(metadata.last_modification_date)
                    if (config.displayTitle)
                        body.innerHTML += "<h3>" + FileUtils.stripExtensionFromName(FileUtils.getFilename(exporter.notepath)) + "<h3>"
                    if (config.displayCreationDate)
                        body.innerHTML += "<span>" + $.i18n('created') + ": " + dateC.toLocaleDateString() + " " + dateC.toLocaleTimeString() + "</span><br />";
                    if (config.displayModificationDate)
                        body.innerHTML += "<span>" + $.i18n('modified') + ": " + dateM.toLocaleDateString() + " " + dateM.toLocaleTimeString() + "</span><br />";

                    var text = document.createElement("div")
                    text.id = "whole-text"

                    text.innerHTML = "<br /><br />" + html
                    for (var todolist of metadata.todolists) {
                        var todolistContainer = text.querySelector("#" + todolist.id)
                        if (todolistContainer == undefined) {
                            todolistContainer = document.createElement("div")
                            text.querySelector("#text").appendChild(todolistContainer)
                        }
                        todolistContainer.innerHTML += "<h3>" + $.i18n('todo') + "</h3>"
                        for (var todo of todolist.todo) {
                            todolistContainer.innerHTML += "☐ " + todo + "<br />"
                        }
                        todolistContainer.innerHTML += "<h3>" + $.i18n('completed') + "</h3>"
                        for (var done of todolist.done) {
                            todolistContainer.innerHTML += "☑ " + done + "<br />"
                        }
                    }
                    body.appendChild(text)
                    body.innerHTML += "<script> \
                    for(var link of document.getElementsByClassName('img-link')){\
                     link.onclick=function(event){\
                        alert('right click on the image to download it');\
                     }\
                    }\
                    </script>\
                    "
                    htmlElem.appendChild(body)
                    exporter.listener.onExportFinished();
                    callback(htmlElem, metadata, attachments)
                })
            })
            console.log("SingleExporter retrieving: success")

        });
    }
    download(filename, text, mimetype, datauri, share) {
        this.listener.onDownloadStarts()
        if (compatibility.isAndroid) {
            compatibility.largeDownload = text
            compatibility.onDownloadFinished = this.listener.onDownloadFinished
            app.startLargeDownload(filename, mimetype, share)
        }
        else {
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
            this.listener.onDownloadFinished()
        }
    }
}

function css(a) {
    var sheets = document.styleSheets, o = {};
    for (var i in sheets) {
        var rules = sheets[i].rules || sheets[i].cssRules;
        for (var r in rules) {
            if (a.is(rules[r].selectorText)) {
                o = $.extend(o, css2json(rules[r].style), css2json(a.attr('style')));
            }
        }
    }
    return o;
}
function css2json(css) {
    var s = {};
    if (!css) return s;
    if (css instanceof CSSStyleDeclaration) {
        for (var i in css) {
            if ((css[i]).toLowerCase) {
                s[(css[i]).toLowerCase()] = (css[css[i]]);
            }
        }
    } else if (typeof css == "string") {
        css = css.split("; ");
        for (var i in css) {
            var l = css[i].split(": ");
            s[l[0].toLowerCase()] = (l[1]);
        }
    }
    return s;
}

class ExporterUI {

    constructor() {
        var exporterUI = this;
        var path = Utils.getParameterByName("path");
        this.exporter = new SingleExporter(path, this)
        this.downloadButton = document.getElementById("download")
        this.sendButton = document.getElementById("send");
        this.printButton = document.getElementById("print")
        this.loadingView = document.getElementById("loading")
        document.getElementById("photos-checkbox").onchange = function () {
            exporterUI.sendButton.disabled = document.getElementById("photos-checkbox").checked

        }
        this.downloadButton.onclick = function () {
            console.log("download")
            exporterUI.setButtonDisable(true);
            var config = exporterUI.getConfig();
            exporterUI.exporter.exportAndDownloadAsHtml(config, false)

        }
        this.printButton.onclick = function () {
            var config = exporterUI.getConfig();
            config.displayCompleteImages = true
            exporterUI.setButtonDisable(true);
            exporterUI.exporter.print(config)

        }

        this.sendButton.onclick = function () {
            console.log("download")
            exporterUI.setButtonDisable(true);
            var config = exporterUI.getConfig();
            exporterUI.exporter.exportAndDownloadAsHtml(config, true)

        }
        if (!compatibility.isAndroid) {
            this.sendButton.style.display = "none"
        }
        compatibility.loadLang(function () {
            $('body').i18n();
        })
        $.i18n().locale = navigator.language;
    }

    setLoadingViewVisibility(show) {
        if (show)
            $(this.loadingView).show()
        else
            $(this.loadingView).hide()
    }

    setButtonDisable(disabled) {
        this.downloadButton.disabled = disabled;
        this.printButton.disabled = disabled;
        if (!disabled)
            this.sendButton.disabled = document.getElementById("photos-checkbox").checked
        else
            this.sendButton.disabled = disabled;
    }

    getConfig() {
        var config = {}
        config.displayTitle = document.getElementById("title-checkbox").checked
        config.displayModificationDate = document.getElementById("mod-checkbox").checked
        config.displayCreationDate = document.getElementById("creation-checkbox").checked
        config.displayImages = document.getElementById("photos-checkbox").checked
        return config

    }

    onError(error) {
        this.setLoadingViewVisibility(false)


    }

    onRetrievingNote() {
        this.setLoadingViewVisibility(true)
    }

    onDownloadStarts() {
        //this.setLoadingViewVisibility(true)
    }

    onDownloadFinished() {
        this.setLoadingViewVisibility(false)
    }

    onExportFinished() {
        this.setLoadingViewVisibility(false)
        this.setButtonDisable(false)
    }

    onExportStarts() {
        this.setLoadingViewVisibility(true)

    }
}

new RequestBuilder((compatibility.isAndroid ? "../" : "") + Utils.getParameterByName("api_path"));
new ExporterUI()

