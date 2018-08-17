var Store = function(){
}

Store.prototype.get = function (key){
    var item = localStorage.getItem(key);
    if(item == null)
        return undefined;
    return item
}

Store.prototype.set = function (key, value){
    localStorage.setItem("note_cache", JSON.stringify(oldNotes));
}