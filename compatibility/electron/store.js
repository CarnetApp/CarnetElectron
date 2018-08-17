var Store = function(){
    const Store = require('electron-store');
    this.store = new Store();
}

Store.prototype.get = function (key){
    return this.store.get(key)
}

Store.prototypes.set = function (key, value){
    store.set("note_cache", JSON.stringify(oldNotes));
}