var fs = require('fs-extra');
var FolderNoteOpener = require("./folder-note-opener").FolderNoteOpener;
var ZipNoteOpener = require("./zip-note-opener").ZipNoteOpener;
var SettingsHelper = require("../settings_helper").SettingsHelper;
var settingsHelper = new SettingsHelper();
var NoteOpener = function (note, relativeNotePath) {
  this.note = note;
  this.folderNoteOpener = new FolderNoteOpener(note, relativeNotePath)
  this.zipNoteOpener = new ZipNoteOpener(note, relativeNotePath)
}

NoteOpener.prototype.getMainTextMetadataAndPreviews = function (callback) {
  var opener = this;
  this.isNoteFile((isFile) => {
    if (isFile == undefined) {
      callback(undefined, undefined)
      return
    }
    if (isFile) {
      opener.zipNoteOpener.getMainTextMetadataAndPreviews(callback)
    } else {
      opener.folderNoteOpener.getMainTextMetadataAndPreviews(callback)

    }
  })
}

const path = require('path')

NoteOpener.prototype.isNoteFile = function (callback) {
  var opener = this
  console.logDebug("isFile " + opener.isFile)

  if (this.isFile != undefined)
    callback(this.isFile)
  else {
    fs.stat(this.note.path, (err, stat) => {
      if (err) {
        callback(undefined)
        return
      }
      opener.isFile = stat.isFile()
      callback(opener.isFile)
    })
  }
}

NoteOpener.prototype.getMedia = function (media, callback) {
  var opener = this;
  this.isNoteFile((isFile) => {
    if (isFile == undefined) {
      callback(undefined, undefined)
      return
    }
    if (isFile) {
      opener.zipNoteOpener.getMedia(media, callback)
    } else {
      opener.folderNoteOpener.getMedia(media, callback)
    }
  })

}


NoteOpener.prototype.openTo = function (path, callback) {
  var opener = this;
  var opener = this;
  this.isNoteFile((isFile) => {
    if (isFile == undefined || isFile) {
      opener.zipNoteOpener.openTo(path, callback)
    } else {
      opener.folderNoteOpener.openTo(path, callback)
    }
  })
}


NoteOpener.prototype.saveFrom = function (fromPath, modifiedFiles, deletedFiles, callback) {
  var opener = this;
  this.isNoteFile((isFile) => {
    if (isFile == undefined && !settingsHelper.getUseNoteFolder() || isFile) {
      opener.zipNoteOpener.saveFrom(fromPath, modifiedFiles, deletedFiles, callback)
    }
    else {
      opener.folderNoteOpener.saveFrom(fromPath, modifiedFiles, deletedFiles, callback)
    }
  })
}


exports.NoteOpener = NoteOpener