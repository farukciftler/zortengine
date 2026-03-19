/**
 * React Native platform adapter — PlatformContract uyumlu
 * window/document yerine Dimensions ve RN API'leri kullanır.
 */

function getDimensions() {
    if (typeof require !== 'undefined') {
        try {
            const rn = require('react-native');
            return rn?.Dimensions ?? null;
        } catch {
            return null;
        }
    }
    return null;
}

export class RNPlatform {
    constructor(options = {}) {
        this._containerRef = options.containerRef ?? null;
        this._dimensions = options.dimensions ?? getDimensions();
        this._removeResizeListener = null;
    }

    getViewportSize() {
        const D = this._dimensions;
        if (D && typeof D.get === 'function') {
            const { width, height } = D.get('window');
            return { width: width || 1, height: height || 1 };
        }
        return { width: 1, height: 1 };
    }

    getBody() {
        return this._containerRef;
    }

    setContainerRef(ref) {
        this._containerRef = ref;
    }

    requestAnimationFrame(callback) {
        if (typeof global !== 'undefined' && typeof global.requestAnimationFrame === 'function') {
            return global.requestAnimationFrame(callback);
        }
        return setTimeout(callback, 16);
    }

    addEventListener(target, eventName, handler, options) {
        const D = this._dimensions;
        if (target === 'window' && eventName === 'resize' && D && typeof D.addEventListener === 'function') {
            const subscription = D.addEventListener('change', handler);
            return () => {
                if (subscription?.remove) subscription.remove();
            };
        }
        return () => {};
    }

    getPointerLockElement() {
        return null;
    }

    requestPointerLock() {
        // Mobilde pointer lock yok
    }

    exitPointerLock() {
        // Mobilde pointer lock yok
    }
}
