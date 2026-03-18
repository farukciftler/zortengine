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
            '2.5D izometrik demo: WASD ile hareket et, V ile TPS/izometrik gecis yap.',
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

    updateInfo(text) {
        this.ui.updateText('info', text);
    }

    setCrosshairVisible(visible) {
        const crosshair = this.ui.elements['crosshair'];
        if (crosshair) {
            crosshair.style.display = visible ? 'block' : 'none';
        }
    }
}
