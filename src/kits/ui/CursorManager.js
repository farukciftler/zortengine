/**
 * CursorManager — Handles custom in-game cursors and their visibility states.
 * Adapts appearance based on camera mode (TPS vs Isometric) and pointer lock.
 */
export class CursorManager {
    constructor(engine) {
        this.engine = engine;
        this._cursorEl = null;
        this._active = false;
        this._mode = '2.5d';
        this._isLocked = false;
    }

    setup() {
        if (typeof document === 'undefined') return;

        this._cursorEl = document.createElement('div');
        this._cursorEl.id = 'zort-game-cursor';
        Object.assign(this._cursorEl.style, {
            width: '12px',
            height: '12px',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: '10000',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 5px rgba(0,0,0,0.5)',
            transition: 'width 0.15s, height 0.15s, border-color 0.15s, background 0.15s',
            display: 'none'
        });

        document.body.appendChild(this._cursorEl);

        const style = document.createElement('style');
        style.id = 'zort-cursor-styles';
        style.innerHTML = `
            .zort-hide-native-cursor * { cursor: none !important; }
        `;
        document.head.appendChild(style);
        
        this._active = true;
        document.body.classList.add('zort-hide-native-cursor');
    }

    update(x, y, mode, isLocked) {
        if (!this._cursorEl) return;

        this._mode = mode;
        this._isLocked = isLocked;

        if (mode === 'tps') {
            this._cursorEl.style.display = 'none';
            return;
        }

        this._cursorEl.style.display = 'block';

        let targetX = x;
        let targetY = y;

        if (isLocked) {
            targetX = window.innerWidth / 2;
            targetY = window.innerHeight / 2;
            Object.assign(this._cursorEl.style, {
                width: '4px',
                height: '4px',
                background: '#fff',
                border: '1px solid #000'
            });
        } else {
            Object.assign(this._cursorEl.style, {
                width: '14px',
                height: '14px',
                background: 'transparent',
                border: '2.5px solid #fff'
            });
        }

        this._cursorEl.style.left = `${targetX}px`;
        this._cursorEl.style.top = `${targetY}px`;
    }

    setVisibility(visible) {
        if (!this._cursorEl) return;
        this._cursorEl.style.display = visible ? (this._mode === 'tps' ? 'none' : 'block') : 'none';
        if (visible) {
            document.body.classList.add('zort-hide-native-cursor');
        } else {
            document.body.classList.remove('zort-hide-native-cursor');
        }
    }

    destroy() {
        if (this._cursorEl) {
            this._cursorEl.remove();
            this._cursorEl = null;
        }
        document.body.classList.remove('zort-hide-native-cursor');
        const style = document.getElementById('zort-cursor-styles');
        if (style) style.remove();
    }
}
