
class SearchEngine {
    constructor() {

    }
    oldSearchInNotes(searching) {
        resetGrid(false)
        notes = [];
        document.getElementById("note-loading-view").style.display = "inline";

        RequestBuilder.sRequestBuilder.get("/notes/search?path=." + "&query=" + encodeURIComponent(searching), function (error, data) {
            if (!error) {
                console.log("listing")
                list("search://", true);
            }
        });

    }
    sendSearchQuery() {
        var self = this;
        lastListingRequestId = RequestBuilder.sRequestBuilder.get("/notes/search?path=." + "&query=" + encodeURIComponent(this.query) + "&from=" + this.from, function (error, data) {
            if (!error) {
                if (data['end'] || data['files'].length > 0) {
                    document.getElementById("page-content").style.display = "block";
                    document.getElementById("note-loading-view").style.display = "none";
                    if (data['files'].length > 0) {
                        var hasChanged = false;
                        for (let node of data['files']) {
                            if (node.path == "quickdoc")
                                continue;
                            file = new File(node.path, !node.isDir, node.name);
                            var isIn = false
                            for (let fileIn of self.result) {
                                if (fileIn.path == node.path) {
                                    isIn = true;
                                    break;
                                }

                            }
                            if (!isIn) {
                                self.result.push(file)
                                hasChanged = true;
                            }
                        }
                        var callbackFiles = []
                        callbackFiles = callbackFiles.concat(self.result)
                        if (hasChanged)
                            onListEnd("search://", callbackFiles, undefined, true);

                    }
                }
                self.from = data['next']
                if (!data['end'])
                    refreshTimeout = setTimeout(function () {
                        self.sendSearchQuery();
                    }, 500)

            }
        });
    }

    searchInNotes(query) {
        if (compatibility.isElectron) {
            searchEngine.oldSearchInNotes(query)
            return;
        }
        if (refreshTimeout !== undefined)
            clearTimeout(refreshTimeout)
        if (lastListingRequestId != undefined) {
            RequestBuilder.sRequestBuilder.cancelRequest(lastListingRequestId)
        }
        this.result = []
        oldFiles = []
        this.query = query;
        resetGrid(false)
        notes = [];
        document.getElementById("note-loading-view").style.display = "inline";
        this.from = 0;
        this.sendSearchQuery();
    }
}
var searchEngine = undefined;

document.getElementById("search-input").onkeydown = function (event) {
    if (event.key === 'Enter') {
        if (searchEngine == undefined)
            searchEngine = new SearchEngine();
        searchEngine.searchInNotes(this.value)

    }
}


document.getElementById("search-button").onclick = function () {
    var value = document.getElementById("search-input").value;
    if (value.length > 0) {
        if (searchEngine == undefined)
            searchEngine = new SearchEngine();
        searchEngine.searchInNotes(value)
    }
}