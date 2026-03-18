export class RunHud {
    constructor(uiManager) {
        this.ui = uiManager;
    }

    setup() {
        this.ui.addProgressBar('hp', 'calc(50% - 100px)', 20, 200, 25, '#e74c3c');
        this.ui.addText('score', 'HAVUZ: 20/20', 20, 20, {
            color: '#ffffff',
            size: 20
        });
        this.ui.addText('wave', 'DALGA: 1/1', 20, 100, {
            color: '#f8e16c',
            size: 18
        });
        this.ui.addText('meta', 'ESSENCE: 0 | RELIC: 0', 20, 130, {
            color: '#7dd3fc',
            size: 16
        });
        this.ui.addText('status', 'DURUM: AKTIF', 20, 160, {
            color: '#cbd5e1',
            size: 16
        });
        this.ui.addText('metaProgress', 'KALICI: 0 ESSENCE | TAMAM: 0 | FAIL: 0', 20, 190, {
            color: '#c084fc',
            size: 15
        });
        this.ui.addText(
            'info',
            'Run demo: WASD hareket, Space ziplama, tik ates, Q dash, V kamera gecisi.',
            20,
            225,
            { color: '#bdc3c7', size: 16 }
        );
    }

    updateAmmo(freeCount, totalCount = 20) {
        this.ui.updateText('score', `HAVUZ: ${freeCount}/${totalCount}`);
    }

    updateHealth(health) {
        this.ui.updateProgressBar('hp', health);
    }

    updateWave(currentWave, totalWaves, aliveEnemies = 0) {
        this.ui.updateText('wave', `DALGA: ${currentWave}/${totalWaves} | DUSMAN: ${aliveEnemies}`);
    }

    updateRunState(essence, relicCount) {
        this.ui.updateText('meta', `ESSENCE: ${essence} | RELIC: ${relicCount}`);
    }

    updateStatus(status) {
        this.ui.updateText('status', `DURUM: ${status}`);
    }

    updateMetaProgress(bankEssence, completedRuns, failedRuns) {
        this.ui.updateText(
            'metaProgress',
            `KALICI: ${bankEssence} ESSENCE | TAMAM: ${completedRuns} | FAIL: ${failedRuns}`
        );
    }

    updateInfo(text) {
        this.ui.updateText('info', text);
    }
}
