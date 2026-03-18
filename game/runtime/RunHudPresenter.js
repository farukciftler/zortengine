export class RunHudPresenter {
    constructor(scene, hud) {
        this.scene = scene;
        this.hud = hud;
    }

    initialize() {
        this.hud.setup();
        this.hud.hideChoicePanel();
        this.hud.hideSummary();
        this.hud.updateSeed(this.scene.seed);
        this.hud.updateHealth(100);
        this.hud.updateRunState(this.scene.runState.essence, this.scene.runState.getRelicCount());
        this.syncMetaProgress();
        this.hud.updateStatus('AKTIF');
        this.hud.updateInfo('Run showcase aktif. WASD + mouse temel oyuncu, JIKL + Enter ikinci oyuncu (varsa).');
    }

    syncMetaProgress() {
        this.hud.updateMetaProgress(
            this.scene.metaProgression.bankEssence,
            this.scene.metaProgression.completedRuns,
            this.scene.metaProgression.failedRuns
        );
    }

    syncSnapshotState() {
        this.hud.updateSeed(this.scene.seed);
        this.hud.updateRunState(this.scene.runState.essence, this.scene.runState.getRelicCount());
        this.hud.updateRoom(this.scene.currentRoom?.label || 'Unknown');
    }

    presentCompletion() {
        this.hud.hideChoicePanel();
        this.hud.updateStatus('TAMAMLANDI');
        this.syncMetaProgress();
        this.hud.updateInfo('Run tamamlandi. R ile yeni seeded run baslat.');
        this.hud.showSummary(this.scene.runState.getSummary(), this.scene.metaProgression);
    }

    presentFailure() {
        this.hud.hideChoicePanel();
        this.hud.updateStatus('BASARISIZ');
        this.syncMetaProgress();
        this.hud.updateInfo('Takim dustu. R ile runi yeniden baslat.');
        this.hud.showSummary(this.scene.runState.getSummary(), this.scene.metaProgression);
    }

    dispose() {
        this.hud?.hideChoicePanel();
        this.hud?.hideSummary();
    }
}
