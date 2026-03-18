export class ReplayRecorder {
    constructor() {
        this.frames = [];
        this.isRecording = false;
        this.playbackIndex = 0;
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

    load(serialized = {}) {
        this.frames = serialized.frames ? serialized.frames.slice() : [];
        this.playbackIndex = 0;
    }

    resetPlayback() {
        this.playbackIndex = 0;
    }

    nextFrame() {
        if (this.playbackIndex >= this.frames.length) return null;
        return this.frames[this.playbackIndex++];
    }
}
