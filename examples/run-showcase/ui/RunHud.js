export class RunHud {
    constructor(uiManager) {
        this.ui = uiManager;
        this.choiceHandlers = [];
    }

    setup() {
        const cursor = document.createElement('div');
        cursor.id = 'game-cursor';
        cursor.style.width = '12px';
        cursor.style.height = '12px';
        cursor.style.border = '2px solid rgba(255, 255, 255, 0.9)';
        cursor.style.borderRadius = '50%';
        cursor.style.position = 'fixed';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '10000';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
        cursor.style.transition = 'width 0.15s, height 0.15s, border-color 0.15s, background 0.15s';
        document.body.appendChild(cursor);
        this._gameCursor = cursor;

        const style = document.createElement('style');
        style.innerHTML = `* { cursor: none !important; }`;
        document.head.appendChild(style);
    }

    updateCursor(x, y, mode, isLocked) {
        if (!this._gameCursor) return;
        
        if (mode === 'tps') {
            this._gameCursor.style.display = 'none';
            return;
        } else {
            this._gameCursor.style.display = 'block';
        }

        let targetX = x;
        let targetY = y;
        
        if (isLocked) {
            targetX = window.innerWidth / 2;
            targetY = window.innerHeight / 2;
            this._gameCursor.style.width = '4px';
            this._gameCursor.style.height = '4px';
            this._gameCursor.style.background = '#fff';
            this._gameCursor.style.border = '1px solid #000';
        } else {
            this._gameCursor.style.width = '14px';
            this._gameCursor.style.height = '14px';
            this._gameCursor.style.background = 'transparent';
            this._gameCursor.style.border = '2.5px solid #fff';
        }

        this._gameCursor.style.left = `${targetX}px`;
        this._gameCursor.style.top = `${targetY}px`;
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

    updateRoom(roomLabel) {
        this.ui.updateText('room', `ODA: ${roomLabel}`);
    }

    updateSeed(seed) {
        this.ui.updateText('seed', `SEED: ${seed}`);
    }

    updateInfo(text) {
        this.ui.updateText('info', text);
    }

    showChoicePanel(title, choices, onSelect) {
        const panel = this.ui.elements.choicePanel;
        const doc = this.ui.document;
        if (!panel || !doc) return;

        panel.innerHTML = '';
        const header = doc.createElement('div');
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '10px';
        header.innerText = title;
        panel.appendChild(header);

        choices.forEach((choice, index) => {
            const button = doc.createElement('button');
            button.style.display = 'block';
            button.style.width = '100%';
            button.style.marginTop = '8px';
            button.style.padding = '10px';
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
            button.style.background = 'rgba(30, 41, 59, 0.9)';
            button.style.color = '#fff';
            button.style.border = '1px solid rgba(255,255,255,0.2)';
            button.style.borderRadius = '8px';
            button.innerText = `${index + 1}. ${choice.name} - ${choice.description}`;
            button.onclick = () => {
                this.hideChoicePanel();
                onSelect(choice, index);
            };
            panel.appendChild(button);
        });

        this.ui.show('choicePanel');
    }

    hideChoicePanel() {
        const panel = this.ui.elements.choicePanel;
        if (panel) {
            panel.innerHTML = '';
        }
        this.ui.hide('choicePanel');
    }

    showSummary(summary, meta) {
        const panel = this.ui.elements.summaryPanel;
        if (!panel) return;

        panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:8px;">Run Ozeti</div>
            <div>Durum: ${summary.status}</div>
            <div>Seed: ${summary.seed}</div>
            <div>Loadout: ${summary.loadoutId}</div>
            <div>Essence: ${summary.essence}</div>
            <div>Relic: ${summary.relicCount}</div>
            <div>Sure: ${summary.elapsedTime.toFixed(1)}s</div>
            <div style="margin-top:10px;">Kalici Banka: ${meta.bankEssence}</div>
            <div>Tamamlanan Run: ${meta.completedRuns}</div>
            <div>R ile yeniden baslat.</div>
        `;
        this.ui.show('summaryPanel');
    }

    hideSummary() {
        const panel = this.ui.elements.summaryPanel;
        if (panel) {
            panel.innerHTML = '';
        }
        this.ui.hide('summaryPanel');
    }
}
