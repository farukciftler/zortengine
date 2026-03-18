export class SystemManager {
    constructor() {
        this.entries = [];
        this.registry = new Map();
        this.context = null;
    }

    register(name, system, options = {}) {
        const existing = this.registry.get(name);
        if (existing) {
            this.unregister(name);
        }

        const entry = {
            name,
            system,
            priority: options.priority || 0
        };

        this.entries.push(entry);
        this.registry.set(name, entry);
        this.entries.sort((a, b) => a.priority - b.priority);

        if (this.context) {
            this._attachEntry(entry);
        }

        return system;
    }

    unregister(name) {
        const entry = this.registry.get(name);
        if (!entry) return null;

        if (this.context) {
            this._detachEntry(entry);
        }

        this.entries = this.entries.filter(item => item !== entry);
        this.registry.delete(name);
        return entry.system;
    }

    get(name) {
        return this.registry.get(name)?.system || null;
    }

    has(name) {
        return this.registry.has(name);
    }

    setContext(context) {
        if (this.context) {
            this.clearContext();
        }

        this.context = context;
        this.entries.forEach(entry => this._attachEntry(entry));
    }

    clearContext() {
        if (!this.context) return;

        [...this.entries].reverse().forEach(entry => this._detachEntry(entry));
        this.context = null;
    }

    update(delta, time) {
        this.entries.forEach(({ system }) => {
            if (system && system.enabled === false) return;
            if (system && typeof system.update === 'function') {
                system.update(delta, time, this.context);
            }
        });
    }

    onResize(width, height, aspect) {
        this.entries.forEach(({ system }) => {
            if (system && typeof system.onResize === 'function') {
                system.onResize(width, height, aspect, this.context);
            }
        });
    }

    dispose() {
        this.clearContext();
        this.entries.forEach(({ system }) => {
            if (system && typeof system.dispose === 'function') {
                system.dispose();
            }
        });
        this.entries = [];
        this.registry.clear();
    }

    _attachEntry(entry) {
        const { system } = entry;
        if (!system) return;

        if (typeof system.onRegister === 'function') {
            system.onRegister(this.context);
        }

        if (typeof system.onAttach === 'function') {
            system.onAttach(this.context);
        }
    }

    _detachEntry(entry) {
        const { system } = entry;
        if (system && typeof system.onDetach === 'function') {
            system.onDetach(this.context);
        }
    }
}
