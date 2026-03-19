export class ZigzagHud {
    constructor(uiSystem) {
        this.ui = uiSystem;
    }

    setup() {
        if (!this.ui?.document) return;
        this.ui.addText('zigzag-score', 'Skor: 0', 16, 16, { size: 20, color: '#fff' });
        this.ui.addText('zigzag-distance', 'Mesafe: 0', 16, 44, { size: 20, color: '#fff' });

        const goPanel = this.ui.addPanel('zigzag-gameover', 0, 0, '100%', {
            display: 'none',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            padding: '0',
            pointerEvents: 'auto'
        });
        goPanel.style.height = '100%';
        goPanel.style.left = '0';
        goPanel.style.top = '0';
        goPanel.style.flexDirection = 'column';
        goPanel.style.display = 'flex';
        goPanel.style.alignItems = 'center';
        goPanel.style.justifyContent = 'center';
        goPanel.style.gap = '1rem';
        goPanel.style.fontFamily = 'system-ui';
        goPanel.style.color = '#fff';
        goPanel.style.fontSize = '1.5rem';

        const p1 = this.ui.document.createElement('p');
        p1.textContent = 'Oyun Bitti!';
        p1.style.margin = '0';
        goPanel.appendChild(p1);

        this.finalScoreEl = this.ui.document.createElement('p');
        this.finalScoreEl.textContent = 'Skor: 0';
        this.finalScoreEl.style.margin = '0';
        goPanel.appendChild(this.finalScoreEl);

        const restartBtn = this.ui.addButton('zigzag-restart', 'Yeniden Oyna', 0, 0, {
            onClick: () => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('zigzag-restart'));
                }
            }
        });
        goPanel.appendChild(restartBtn);
        restartBtn.style.position = 'relative';
        restartBtn.style.left = '0';
        restartBtn.style.top = '0';
        restartBtn.style.transform = 'none';
    }

    updateScore(score) {
        this.ui?.updateText?.('zigzag-score', `Skor: ${score ?? 0}`);
    }

    updateDistance(distance) {
        this.ui?.updateText?.('zigzag-distance', `Mesafe: ${distance ?? 0}`);
    }

    updateAlive(isAlive) {
        const go = this.ui?.elements?.['zigzag-gameover'];
        if (go) go.style.display = isAlive ? 'none' : 'flex';
    }

    updateFinalScore(score) {
        if (this.finalScoreEl) this.finalScoreEl.textContent = `Skor: ${score}`;
    }

    setRestartHandler(fn) {
        if (typeof window !== 'undefined') {
            window.addEventListener('zigzag-restart', fn);
        }
    }
}
