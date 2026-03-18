export class DemoHud {
    constructor(uiManager) {
        this.ui = uiManager;
    }

    setup() {
        this.ui.addProgressBar('hp', 'calc(50% - 100px)', 20, 200, 25, '#e74c3c');
        this.ui.addText('score', 'HAVUZ: 20/20', 20, 20, {
            color: '#ffffff',
            size: 20
        });
        this.ui.addText(
            'info',
            '2.5D izometrik demo: WASD ile hareket et, tıklayarak veya Space ile ateş et.',
            20,
            60,
            { color: '#bdc3c7', size: 16 }
        );
        this.ui.addCrosshair('crosshair');
    }

    updateAmmo(freeCount, totalCount = 20) {
        this.ui.updateText('score', `HAVUZ: ${freeCount}/${totalCount}`);
    }

    updateHealth(health) {
        this.ui.updateProgressBar('hp', health);
    }
}
