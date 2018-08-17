var RequestBuilder = function (root_url) {
    RequestBuilder.sRequestBuilder = this;
}

RequestBuilder.prototype.get = function (path, callback) {
    $.ajax({
        url: root_url + path,
        type: "GET",
        success: function (data) {
            callback(null, data);
        },
        fail: function () {
            callback("error", undefined);
        }
    });
}

RequestBuilder.prototype.post = function (path, data, callback) {
    $.ajax({
        url: root_url + path,
        data: data,
        type: "POST",
        success: function (data) {
            callback(null, data);
        },
        fail: function () {
            callback("error", undefined);
        }
    });
}