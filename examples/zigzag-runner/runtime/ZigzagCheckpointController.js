export class ZigzagCheckpointController {
    constructor(scene, saveManager) {
        this.scene = scene;
        this.saveManager = saveManager;
    }

    save(label = 'checkpoint') {
        const snapshot = this.scene.serializeState?.();
        if (!snapshot) return;
        const payload = {
            ...snapshot,
            runState: this.scene.runState?.serialize?.(),
            label,
            timestamp: Date.now()
        };
        this.saveManager.save?.('latest', payload);
    }

    restoreLatest() {
        const data = this.saveManager.load?.('latest');
        if (!data) return false;
        this.scene.restoreState?.(data);
        if (data.runState && this.scene.runState) {
            this.scene.runState = this.scene.runState.constructor.restore?.(data.runState) ?? this.scene.runState;
        }
        return true;
    }
}
