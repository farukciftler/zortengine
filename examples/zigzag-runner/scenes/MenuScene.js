import { GameScene } from 'zortengine';
import { UIManager } from 'zortengine/browser';

export class MenuScene extends GameScene {
    constructor() {
        super({ name: 'zigzag-menu' });
    }

    setup() {
        const platform = this.engine.platform;
        const ui = this.registerSystem('ui', new UIManager({
            platform,
            parent: this.engine.container
        }), { priority: 200 });

        this._buildMenu(ui);
    }

    onEnter() {
        const ui = this.getSystem('ui');
        if (ui?.container) {
            ui.container.style.display = 'block';
        }
    }

    onExit() {
        const ui = this.getSystem('ui');
        if (ui?.container) {
            ui.container.style.display = 'none';
        }
    }

    _buildMenu(ui) {
        if (!ui?.container) return;
        const panel = ui.addPanel('zigzag-menu', 0, 0, '100%', {
            display: 'block',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            padding: '0',
            pointerEvents: 'auto'
        });
        panel.style.height = '100%';
        panel.style.left = '0';
        panel.style.top = '0';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.alignItems = 'center';
        panel.style.justifyContent = 'center';
        panel.style.gap = '1.5rem';
        panel.style.fontFamily = 'system-ui';
        panel.style.color = '#e0e0e0';

        const title = ui.document.createElement('h1');
        title.textContent = 'Zigzag Runner';
        title.style.margin = '0';
        title.style.fontSize = '2.5rem';
        title.style.color = '#fff';
        panel.appendChild(title);

        const hint = ui.document.createElement('p');
        hint.textContent = 'TPS kamera • Sol/Sağ ok veya A/D ile şerit değiştir';
        hint.style.opacity = '0.8';
        hint.style.margin = '0';
        panel.appendChild(hint);

        const btn = ui.addButton('zigzag-play', 'Oyna', 0, 0, {
            onClick: () => this.emit('requestStartRun', {})
        });
        panel.appendChild(btn);
        btn.style.position = 'relative';
        btn.style.left = '0';
        btn.style.top = '0';
        btn.style.transform = 'none';
        btn.style.padding = '12px 32px';
        btn.style.fontSize = '1.2rem';
        btn.style.background = '#27ae60';
    }
}
