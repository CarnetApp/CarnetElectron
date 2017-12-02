var fs = require("fs");

var RecentDBManager = require("./recent_db_manager").RecentDBManager;

var DBMerger = function(recentFolder,appUid){
    this.recentFolder = recentFolder;
    this.appUid = appUid;
    
}

DBMerger.prototype.startMergin = function(onFinished) {
    this.onFinished = onFinished;
    var merger = this;   
    fs.readdir(this.recentFolder, (err, dir) => {
        merger.dir = dir;
        merger.pos = 0;
        merger.mergeNext();
        
    })
}
DBMerger.prototype.mergeNext = function(){
    var db = new RecentDBManager(this.recentFolder+"/"+this.appUid);
    
    var merger = this;
    if(this.pos < this.dir.length){
        db.mergeDB(merger.recentFolder+"/"+this.dir[this.pos], function(){
            merger.pos ++ ;
            merger.mergeNext();
        })
            
    }
    else this.onFinished();
}

exports.DBMerger = DBMerger;