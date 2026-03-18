export class ReplayRecorder {
    constructor() {
        this.frames = [];
        this.isRecording = false;
    }

    start() {
        this.frames = [];
        this.isRecording = true;
    }

    stop() {
        this.isRecording = false;
        return this.frames.slice();
    }

    capture(frame) {
        if (!this.isRecording) return;
        this.frames.push(JSON.parse(JSON.stringify(frame)));
    }

    serialize() {
        return {
            frames: this.frames.slice()
        };
    }
}
