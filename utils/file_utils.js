var FileUtils = function(){}
FileUtils.base64MimeType = function(encoded) {
    var result = null;
  
    if (typeof encoded !== 'string') {
      return result;
    }
  
    var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  
    if (mime && mime.length) {
      result = mime[1];
    }
  
    return result;
  }

  FileUtils.getExtensionFromMimetype = function(mimetype){
      switch(mimetype){
          case "audio/3gpp":
            return "3gpp"
      
      }
  }

  exports.FileUtils = FileUtils;