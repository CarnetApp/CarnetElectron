
var RecentDBManager = require('./recent/local_recent_db_manager').LocalRecentDBManager;
var SettingsHelper = require("../settings/settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();

var startListening = function(){
    var express = require('express');
    var app = express();
    //get my recent db
    app.get('/recentdb', function(req, res) {
        new RecentDBManager(settingsHelper.getNotePath()+"/quickdoc/recentdb/"+settingsHelper.getAppUid()).getFullDB(function(err,data){
            res.setHeader('Content-Type', 'application/json');
            res.send(data)});
    });
    //update recentdb with a new one (full)
    app.patch('/recentdb', function(req, res) {
    });
    //get a list of recent dbs
    app.get('/recentdb/list', function(req, res) {
    });
    //get a specific db
    app.get('/recentdb/:id', function(req, res) {
    });
    //add to my recent db
    app.get('/recentdb/add', function(req, res) {
    });

    //add to my recent db
    app.put('/recentdb/item', function(req, res) {
    });
        
    //delete from my recent db
    app.delete('/recentdb/item', function(req, res) {
    });    
    app.listen(8080);

    
}

exports.startListening = startListening;