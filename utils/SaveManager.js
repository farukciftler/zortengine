export class SaveManager {
    constructor(options = {}) {
        this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
        this.namespace = options.namespace || 'zortengine';
    }

    getKey(key) {
        return `${this.namespace}:${key}`;
    }

    save(key, value) {
        if (!this.storage) return false;
        this.storage.setItem(this.getKey(key), JSON.stringify(value));
        return true;
    }

    load(key, fallback = null) {
        if (!this.storage) return fallback;

        const raw = this.storage.getItem(this.getKey(key));
        if (!raw) return fallback;

        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    remove(key) {
        if (!this.storage) return false;
        this.storage.removeItem(this.getKey(key));
        return true;
    }

    keys() {
        if (!this.storage) return [];
        const prefix = `${this.namespace}:`;
        const keys = [];
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key?.startsWith(prefix)) {
                keys.push(key.slice(prefix.length));
            }
        }
        return keys;
    }
}
