export class ZigzagHudPresenter {
    constructor(scene, hud) {
        this.scene = scene;
        this.hud = hud;
    }

    initialize() {
        this.hud.setup?.();
        this.hud.setRestartHandler?.(() => this.scene.flowController?.requestRestart?.());
        this.scene.on?.('gameOver', ({ score }) => {
            this.hud.updateFinalScore?.(score);
        });
    }

    update() {
        const state = this.scene.runState;
        if (!state) return;
        this.hud.updateScore?.(state.score);
        this.hud.updateDistance?.(Math.floor(state.distance));
        this.hud.updateAlive?.(state.isAlive);
    }

    dispose() {}
}
