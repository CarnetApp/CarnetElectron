var RequestBuilder = function () {
    this.api_url = "./";
    RequestBuilder.sRequestBuilder = this;
}

RequestBuilder.prototype.get = function (path, callback) {
    $.ajax({
        url: this.api_url + path,
        type: "GET",
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