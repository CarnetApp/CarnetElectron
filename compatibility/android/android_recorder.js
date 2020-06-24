class AndroidRecorder {


    constructor(options) {
        AndroidRecorder.instance = this;
        this.options = options;
        this.state = "none";
        this.cantPause = true;
    }

    setState(state) {
        this.state = state;
    }

    start() {
        console.log("starting compat recorder");
        this.state = "recording";

        AndroidRecorderJava.start(this.options.channels, this.options.encoderBitRate, this.options.encoderSampleRate);
    }
    stop() {
        this.setState("none");
        AndroidRecorderJava.stop();
    }

    pause() {
        this.state = "paused";
        AndroidRecorderJava.pause();
    }
    resume() {
        this.state = "recording";
        AndroidRecorderJava.resume();
    }
    // used for JS encoder
    encodeOgg(arrayBuffer){
      var recorder = this
      this.recordedPages = [];
      this.totalLength = 0;
            this.onEncodingStart()
        var encodeWorker = new Worker(rootpath + "reader/libs/recorder/encoderWorker.min.js");
        var bufferLength = 4096;
        encodeWorker.postMessage({
          command: 'init',
          encoderSampleRate: 48000,
          bufferLength: bufferLength,
          originalSampleRate: 44100,
          wavSampleRate: 44100,
          numberOfChannels: 2,
          maxFramesPerPage: 40,
          encoderApplication: 2049,
          encoderFrameSize: 20,
          encoderComplexity: 9,
          resampleQuality: 5,
          bitRate: 192000
        });
        encodeWorker.postMessage({
          command: 'getHeaderPages'
        });
        var typedArray = new Int16Array(arrayBuffer);
  
        for (var i = 0; i < typedArray.length; i += bufferLength*2) {
          var tmpBufferList = [];
          var tmpBuffer = new Float32Array(bufferLength);
          var tmpBuffer2 = new Float32Array(bufferLength);
          var buf1 = 0
           var buf2 = 0
  
          for (var j = 0; j < bufferLength*2; j++) {
              if(j%2<1 ){
                  tmpBuffer[buf1] = typedArray[i + j] / 32768;
                  buf1++;
              }else{
                  tmpBuffer2[buf2] = typedArray[i + j] / 32768;
                  buf2++;
                  }
          }
  
          tmpBufferList.push(tmpBuffer);
          tmpBufferList.push(tmpBuffer2);
  
  
          encodeWorker.postMessage({
            command: 'encode',
            buffers: tmpBufferList
          });
        }
  
        encodeWorker.postMessage({
          command:'done'
        });
  
        encodeWorker.onmessage = function(e){
          console.log(e)
          if (e.data.message=="done") {
            var outputData = new Uint8Array( recorder.totalLength );
            recorder.recordedPages.reduce( function( offset, page ){
              outputData.set( page, offset );
              return offset + page.length;
            }, 0);
            recorder.onEncodingEnd()

            writer.recorder.recorder.ondataavailable(outputData, null)
          }
  
          else if (e.data.message=="page") {
            recorder.recordedPages.push( e.data.page);
            recorder.totalLength += e.data.page.length;
          }
        };
      }
      pauseUnavailable(){

    }
    onFileReady(url, isEncoded) {
      console.log("AndroidRecorder: isEncoded "+isEncoded)
 
      if(isEncoded){
        this.ondataavailable(undefined, url);
      }
      /* //if we use JS encoder:
        var rec = this
        var req = new XMLHttpRequest();
        req.open('GET', compatibility.addRequestToken("/api/note/open/tmpwave"), true);
        req.responseType = 'arraybuffer';
        req.onload = function () {
            rec.encodeOgg(req.response);
            
        };
        req.send();
        */
    }

    onEncodingStart() {
        writer.recorder.onEncodingStart()
    }

    onEncodingEnd() {
        writer.recorder.onEncodingEnd()
    }
}