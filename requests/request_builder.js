var RequestBuilder = function (api_url = "./") {
    if (!api_url.endsWith("/"))
        api_url += "/";
    this.api_url = api_url;
    RequestBuilder.sRequestBuilder = this;
    this.canceledRequests = []
}

RequestBuilder.prototype.get = function (path, callback, xhr) {
    var requestId = Utils.generateUID()
    path = this.cleanPath(path);
    $.ajax({
        url: this.api_url + path,
        type: "GET",
        xhr: xhr,
        success: function (data) {
            if (!RequestBuilder.sRequestBuilder.isCanceled(requestId))
                callback(null, data);
        },
        fail: function () {
            if (!RequestBuilder.sRequestBuilder.isCanceled(requestId))
                callback("error", undefined);
        },
        error: function (e) {
            console.log("post error " + e);
            if (!RequestBuilder.sRequestBuilder.isCanceled(requestId))
                callback(e, undefined);
        }
    });
    return requestId;
}

RequestBuilder.prototype.isCanceled = function (id) {
    var index = this.canceledRequests.indexOf(id)
    if (index >= 0) {
        this.canceledRequest.splice(index, 1);
        return true;
    }
    return false;
}

RequestBuilder.prototype.cancelRequest = function (id) {
    this.canceledRequests.push(id)
}

RequestBuilder.prototype.delete = function (path, callback) {
    path = this.cleanPath(path);
    $.ajax({
        url: this.api_url + path,
        type: "DELETE",
        success: function (data) {
            callback(null, data);
        },
        fail: function () {
            callback("error", undefined);
        },
        error: function (e) {
            console.log("post error " + e);
            callback(e, undefined);
        }
    });
}

RequestBuilder.prototype.post = function (path, data, callback) {
    path = this.cleanPath(path);
    $.ajax({
        url: this.api_url + path,
        data: data,
        type: "POST",
        success: function (data) {
            console.log("success")
            callback(null, data);
        },
        fail: function () {
            console.log("post error");
            callback("error", undefined);
        },
        error: function (e) {
            console.log("post error " + e);
            callback(e, undefined);
        }
    });
}

RequestBuilder.prototype.postFiles = function (path, data, files, callback) {
    path = this.cleanPath(path);
    var formData = new FormData();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        // Add the file to the request.
        formData.append('media[]', file, file.name);
    }
    for (var da in data) {
        formData.append(da, data[da]);
    }
    $.ajax({
        url: this.api_url + path,
        data: formData,
        processData: false,
        contentType: false,
        type: "POST",
        success: function (data) {
            console.log("success")
            callback(null, data);
        },
        fail: function () {
            console.log("post error");
            callback("error", undefined);
        },
        error: function (e) {
            console.log("post error " + e);
            callback(e, undefined);
        }
    });
}

RequestBuilder.prototype.buildUrl = function (path) {
    return this.api_url + path;
}

RequestBuilder.prototype.cleanPath = function (path) {
    if (path.startsWith("/"))
        path = path.substr(1);
    return path;
}