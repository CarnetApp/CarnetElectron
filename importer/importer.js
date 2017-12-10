var Importer = function(){

}

Importer.prototype.importNote = function(keepNotePath, destFolder){
    var fs = require("fs");
    var FileUtils = require("../utils/file_utils.js").FileUtils
    console.log(keepNotePath)
    
    fs.readFile(keepNotePath,'base64', function (err, data) {
        console.log(err)
        var content = decodeURIComponent(escape(atob(data)))
        var container = document.createElement("div");
        container.innerHTML = content
        var title = container.querySelector("title").innerHTML;
        console.log("title "+title)
        var text = container.querySelector(".content").innerHTML;
        console.log("text "+text)
        var labels = container.getElementsByClassName("label");
        var noteLabels = [];
        if(labels != undefined){
            for(var label of labels){
                noteLabels.push(label.innerHTML)
                console.log("label "+label.innerHTML)
                
            }
        }
        //attachments
        var attachments = container.querySelector(".attachments");
        if(attachments!= undefined){
            var base64Files = []
            
            var audioFiles = attachments.getElementsByClassName("audio");
            if(audioFiles != undefined){
                for(var audioFile of audioFiles){
                    base64Files.push(audioFile.getAttribute("href"))
                }
            }

            var imgFiles = attachments.getElementsByTagName("image");
            if(imgFiles != undefined){
                for(var imageFile of imgFiles){
                    base64Files.push(imageFile.getAttribute("src"))                    
                }
            }

            console.log("attachments "+base64Files.length)
            for(var base64File of base64Files){
                console.log("mime "+FileUtils.getExtensionFromMimetype(FileUtils.base64MimeType(base64File)))                 
                
            }
        }
    });

}


exports.Importer = Importer;