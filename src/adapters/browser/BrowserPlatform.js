export class BrowserPlatform {
    constructor(options = {}) {
        this.window = options.windowRef || (typeof window !== 'undefined' ? window : null);
        this.document = options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    getWindow() {
        return this.window;
    }

    getDocument() {
        return this.document;
    }

    getBody() {
        return this.document ? this.document.body : null;
    }

    getViewportSize() {
        return {
            width: this.window ? this.window.innerWidth : 1,
            height: this.window ? this.window.innerHeight : 1
        };
    }

    requestAnimationFrame(callback) {
        if (this.window && typeof this.window.requestAnimationFrame === 'function') {
            return this.window.requestAnimationFrame(callback);
        }

        return setTimeout(callback, 16);
    }

    addEventListener(target, eventName, handler, options) {
        const eventTarget = this._resolveTarget(target);
        if (!eventTarget || typeof eventTarget.addEventListener !== 'function') {
            return () => {};
        }
        eventTarget.addEventListener(eventName, handler, options);
        return () => eventTarget.removeEventListener(eventName, handler, options);
    }

    getPointerLockElement() {
        return this.document ? this.document.pointerLockElement : null;
    }

    requestPointerLock(element = this.getBody()) {
        if (element && typeof element.requestPointerLock === 'function') {
            element.requestPointerLock();
        }
    }

    exitPointerLock() {
        if (this.document && typeof this.document.exitPointerLock === 'function') {
            this.document.exitPointerLock();
        }
    }

    _resolveTarget(target) {
        if (!target || target === 'document') return this.document;
        if (target === 'window') return this.window;
        if (target === 'body') return this.getBody();
        return target;
    }
}
