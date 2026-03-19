export class ZigzagFlowController {
    constructor(scene) {
        this.scene = scene;
    }

    start() {
        this.scene.runState.isAlive = true;
        this.scene.runState.isPaused = false;
    }

    gameOver() {
        this.scene.runState.isAlive = false;
        this.scene.emit('gameOver', { score: this.scene.runState.score, distance: this.scene.runState.distance });
    }

    pause() {
        this.scene.runState.isPaused = true;
    }

    resume() {
        this.scene.runState.isPaused = false;
    }

    requestRestart() {
        this.scene.emit('requestRestartRun', {});
    }

    requestMenu() {
        this.scene.emit('requestOpenMenu');
    }
}
