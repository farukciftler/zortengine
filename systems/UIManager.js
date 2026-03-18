import { BrowserPlatform } from '../core/BrowserPlatform.js';

export class UIManager {
    constructor(options = {}) {
        this.platform = options.platform || new BrowserPlatform();
        this.document = this.platform.getDocument();
        this.parent = options.parent || this.platform.getBody();
        this.elements = {};

        this.container = null;
        if (this.document) {
            this.container = this.document.createElement('div');
            this.container.id = 'zortengine-ui';
            this.container.style.position = 'absolute';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            this.container.style.pointerEvents = 'none'; // Tıklamalar alttaki canvasa geçsin
            this.container.style.fontFamily = 'sans-serif';
            if (this.parent) {
                this.parent.appendChild(this.container);
            }
        }
    }

    // Basit bir yazı (Skor vb.) ekler
    addText(id, text, x, y, options = {}) {
        if (!this.document || !this.container) {
            this.elements[id] = { innerText: text, style: {} };
            return;
        }
        const el = this.document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = typeof x === 'number' ? x + 'px' : x;
        el.style.top = typeof y === 'number' ? y + 'px' : y;
        el.style.color = options.color || 'white';
        el.style.fontSize = (options.size || 24) + 'px';
        el.style.fontWeight = 'bold';
        el.style.textShadow = '2px 2px 0 #000';
        el.innerText = text;
        
        this.container.appendChild(el);
        this.elements[id] = el;
    }

    updateText(id, text) {
        if (this.elements[id]) {
            this.elements[id].innerText = text;
        }
    }

    addPanel(id, x, y, width, options = {}) {
        if (!this.document || !this.container) {
            this.elements[id] = { innerHTML: '', style: { display: options.display || 'none' } };
            return this.elements[id];
        }
        const panel = this.document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.left = typeof x === 'number' ? x + 'px' : x;
        panel.style.top = typeof y === 'number' ? y + 'px' : y;
        panel.style.width = typeof width === 'number' ? width + 'px' : width;
        panel.style.padding = options.padding || '12px 14px';
        panel.style.border = options.border || '1px solid rgba(255,255,255,0.25)';
        panel.style.borderRadius = options.radius || '10px';
        panel.style.background = options.background || 'rgba(15, 23, 42, 0.86)';
        panel.style.backdropFilter = 'blur(6px)';
        panel.style.display = options.display || 'none';
        panel.style.pointerEvents = options.pointerEvents || 'auto';
        panel.style.color = options.color || '#fff';
        panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';
        this.container.appendChild(panel);
        this.elements[id] = panel;
        return panel;
    }

    addButton(id, label, x, y, options = {}) {
        if (!this.document || !this.container) {
            this.elements[id] = { innerText: label, style: {} };
            return this.elements[id];
        }
        const button = this.document.createElement('button');
        button.style.position = 'absolute';
        button.style.left = typeof x === 'number' ? x + 'px' : x;
        button.style.top = typeof y === 'number' ? y + 'px' : y;
        button.style.pointerEvents = 'auto';
        button.style.padding = options.padding || '8px 12px';
        button.style.borderRadius = options.radius || '8px';
        button.style.border = options.border || '1px solid rgba(255,255,255,0.25)';
        button.style.background = options.background || 'rgba(30,41,59,0.9)';
        button.style.color = options.color || '#fff';
        button.style.cursor = 'pointer';
        button.innerText = label;
        if (typeof options.onClick === 'function') {
            button.addEventListener('click', options.onClick);
        }
        this.container.appendChild(button);
        this.elements[id] = button;
        return button;
    }

    addInput(id, value, x, y, options = {}) {
        if (!this.document || !this.container) {
            this.elements[id] = { value, style: {} };
            return this.elements[id];
        }
        const input = this.document.createElement('input');
        input.type = options.type || 'text';
        input.value = value || '';
        input.placeholder = options.placeholder || '';
        input.style.position = 'absolute';
        input.style.left = typeof x === 'number' ? x + 'px' : x;
        input.style.top = typeof y === 'number' ? y + 'px' : y;
        input.style.width = typeof options.width === 'number' ? `${options.width}px` : (options.width || '220px');
        input.style.padding = options.padding || '8px 10px';
        input.style.borderRadius = options.radius || '8px';
        input.style.border = options.border || '1px solid rgba(255,255,255,0.25)';
        input.style.background = options.background || 'rgba(15,23,42,0.95)';
        input.style.color = options.color || '#fff';
        input.style.pointerEvents = 'auto';
        this.container.appendChild(input);
        this.elements[id] = input;
        return input;
    }

    updateHTML(id, html) {
        if (this.elements[id]) {
            this.elements[id].innerHTML = html;
        }
    }

    show(id, display = 'block') {
        if (this.elements[id]) {
            this.elements[id].style.display = display;
        }
    }

    hide(id) {
        this.show(id, 'none');
    }

    remove(id) {
        const element = this.elements[id];
        if (element?.parentNode) {
            element.parentNode.removeChild(element);
        }
        delete this.elements[id];
    }

    // RPG tarzı Can Barı / Yükleme Barı ekler
    addProgressBar(id, x, y, width, height, color = '#e74c3c') {
        if (!this.document || !this.container) {
            this.elements[id] = { style: { width: '100%' } };
            return;
        }
        const bg = this.document.createElement('div');
        bg.style.position = 'absolute';
        bg.style.left = typeof x === 'number' ? x + 'px' : x;
        bg.style.top = typeof y === 'number' ? y + 'px' : y;
        bg.style.width = width + 'px';
        bg.style.height = height + 'px';
        bg.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        bg.style.border = '2px solid white';
        bg.style.borderRadius = '5px';
        bg.style.overflow = 'hidden';

        const fill = this.document.createElement('div');
        fill.style.width = '100%';
        fill.style.height = '100%';
        fill.style.backgroundColor = color;
        fill.style.transition = 'width 0.2s';

        bg.appendChild(fill);
        this.container.appendChild(bg);
        
        // Element referansını dolum çubuğu olarak sakla ki width'ini güncelleyebilelim
        this.elements[id] = fill;
    }

    updateProgressBar(id, percentage) {
        if (this.elements[id]) {
            const p = Math.max(0, Math.min(100, percentage));
            this.elements[id].style.width = p + '%';
        }
    }

    // FPS / TPS oyunları için ekranın tam ortasına nişangah ekler
    addCrosshair(id = 'crosshair') {
        if (!this.document || !this.container) {
            this.elements[id] = { style: { display: 'block' } };
            return;
        }
        const el = this.document.createElement('div');
        el.style.position = 'absolute';
        el.style.top = '50%';
        el.style.left = '50%';
        el.style.width = '6px';
        el.style.height = '6px';
        el.style.backgroundColor = 'white';
        el.style.border = '2px solid rgba(0,0,0,0.5)';
        el.style.borderRadius = '50%';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.pointerEvents = 'none'; // Fare tıklamalarını engellemesin
        this.container.appendChild(el);
        this.elements[id] = el;
    }

    dispose() {
        this.elements = {};
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}