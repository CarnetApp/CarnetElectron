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

    exportAsHtml() {
        var exporter = this
        this.retrieveNote(data => {
            console.log("blabla " + JSZipUtils)
            JSZip.loadAsync(data).then(function (zip) {


                exporter.loadZipContent(zip, (html, metadata, attachments) => {
                    var htmlElem = document.createElement("html")
                    var head = document.createElement("head")
                    head.innerHTML = ""
                    htmlElem.appendChild(head)
                    var body = document.createElement("body")
                    body.innerHTML = html
                    htmlElem.appendChild(body)
                    download(FileUtils.stripExtensionFromName(FileUtils.getFilename(exporter.notepath)) + ".html", htmlElem.innerHTML, "text/html")
                })



            })

            console.log("SingleExporter retrieving: success")


        });
    }
}

function download(filename, text, mimetype) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:' + mimetype + ';charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}