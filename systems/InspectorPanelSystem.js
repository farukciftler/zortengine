export class InspectorPanelSystem {
    constructor(options = {}) {
        this.ui = options.ui || null;
        this.engine = null;
    }

    onAttach(context) {
        this.engine = context?.engine || null;
        if (!this.ui) {
            this.ui = context?.scene?.getSystem?.('ui') || null;
        }
        this.ui?.addPanel?.('inspectorPanel', 'calc(100% - 280px)', 20, 260, {
            display: 'block',
            background: 'rgba(15, 23, 42, 0.88)',
            pointerEvents: 'none'
        });
    }

    update() {
        const panel = this.ui?.elements?.inspectorPanel;
        if (!panel || !this.engine?.inspector?.snapshot) return;

        const scenes = this.engine.inspector.snapshot();
        const active = scenes[0];
        if (!active) return;

        panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:6px;">Inspector</div>
            <div style="font-size:12px;">Scene: ${active.sceneName}</div>
            <div style="font-size:12px;">Systems: ${active.systems.join(', ')}</div>
            <div style="font-size:12px;">Objects: ${active.objectCount}</div>
            ${active.objects.slice(0, 5).map(item => `<div style="font-size:12px;opacity:0.9;">${item.type} ${item.entityId}</div>`).join('')}
        `;
    }
}
