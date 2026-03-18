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
        this.ui.addText(
            'info',
            'Run demo: WASD hareket, Space ziplama, tik ates, Q dash, V kamera gecisi.',
            20,
            60,
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

    updateInfo(text) {
        this.ui.updateText('info', text);
    }
}
