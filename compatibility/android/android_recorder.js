class AndroidRecorder {


    constructor(options) {
        AndroidRecorder.instance = this;
        this.options = options;
        this.state = "none";
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
        this.state = "none";
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
    onFileReady(url) {
        this.ondataavailable(undefined, url);
    }
    onEncodingStart() {
        writer.recorder.onEncodingStart()
    }

    onEncodingEnd() {
        writer.recorder.onEncodingEnd()
    }
}