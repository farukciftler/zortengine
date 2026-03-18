export class RunFlowController {
    constructor(scene) {
        this.scene = scene;
    }

    completeRun() {
        if (this.scene.runState.status !== 'active') return;
        this.scene.choiceActive = false;
        this.scene.choiceQueue = [];
        this.scene.runState.complete();
        this.scene.metaProgression.recordRun(this.scene.runState);
        this.scene.hudPresenter.presentCompletion();
        this.scene.extractionGate?.setActive(false);
        this.scene.checkpointController.save('completed');
    }

    failRun() {
        if (this.scene.runState.status !== 'active') return;
        this.scene.choiceActive = false;
        this.scene.choiceQueue = [];
        this.scene.runState.fail();
        this.scene.metaProgression.recordRun(this.scene.runState);
        this.scene.hudPresenter.presentFailure();
        this.scene.extractionGate?.setActive(false);
        this.scene.checkpointController.save('failed');
    }

    requestRestart() {
        if (this.scene.runState.status !== 'active') {
            this.scene.pendingRestart = true;
        }
    }

    consumePendingRestart() {
        if (!this.scene.pendingRestart) return false;
        this.restartRun();
        return true;
    }

    restartRun() {
        const nextOptions = {
            seed: this.scene.metaProgression.dailySeed || this.scene.metaProgression.generateDailySeed(),
            loadoutId: this.scene.loadout.id,
            network: this.scene.options.network || null
        };

        this.scene.pendingRestart = false;
        this.scene.emit('requestRestartRun', nextOptions);
    }
}
