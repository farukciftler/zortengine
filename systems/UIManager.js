export class UIManager {
    constructor() {
        // UI kapsayıcısını (Container) oluştur
        this.container = document.createElement('div');
        this.container.id = 'zortengine-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none'; // Tıklamalar alttaki canvasa geçsin
        this.container.style.fontFamily = 'sans-serif';
        document.body.appendChild(this.container);

        this.elements = {};
    }

    // Basit bir yazı (Skor vb.) ekler
    addText(id, text, x, y, options = {}) {
        const el = document.createElement('div');
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

    // RPG tarzı Can Barı / Yükleme Barı ekler
    addProgressBar(id, x, y, width, height, color = '#e74c3c') {
        const bg = document.createElement('div');
        bg.style.position = 'absolute';
        bg.style.left = typeof x === 'number' ? x + 'px' : x;
        bg.style.top = typeof y === 'number' ? y + 'px' : y;
        bg.style.width = width + 'px';
        bg.style.height = height + 'px';
        bg.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        bg.style.border = '2px solid white';
        bg.style.borderRadius = '5px';
        bg.style.overflow = 'hidden';

        const fill = document.createElement('div');
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
        const el = document.createElement('div');
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
}