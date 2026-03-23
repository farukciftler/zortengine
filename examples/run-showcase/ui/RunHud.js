export class RunHud {
    constructor(uiManager) {
        this.ui = uiManager;
        this.choiceHandlers = [];
    }

    setup() {
        /*
        this.ui.addProgressBar('hp', 'calc(50% - 100px)', 20, 200, 25, '#e74c3c');
        ... (rest commented out effectively by making it an empty setup or commenting it)
        */
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
