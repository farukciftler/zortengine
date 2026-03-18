export class RunCheckpointController {
    constructor(scene, saveManager) {
        this.scene = scene;
        this.saveManager = saveManager;
    }

    save(reason) {
        return this.saveManager.save('last-checkpoint', {
            reason,
            snapshot: this.scene.engine.snapshot(),
            runState: this.scene.runState.serialize(),
            roomId: this.scene.currentRoom?.id || null
        });
    }

    restoreLatest() {
        const saved = this.saveManager.load('last-checkpoint', null);
        if (!saved?.snapshot?.scene) return false;
        this.scene.restoreState(saved.snapshot.scene);
        return true;
    }
}
