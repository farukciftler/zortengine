export class PrefabFactory {
    constructor() {
        this.registry = new Map();
    }

    register(id, creator) {
        if (!id || typeof creator !== 'function') return null;
        this.registry.set(id, creator);
        return creator;
    }

    create(id, context = {}) {
        const creator = this.registry.get(id);
        if (!creator) {
            throw new Error(`Prefab '${id}' is not registered.`);
        }
        return creator(context);
    }

    has(id) {
        return this.registry.has(id);
    }
}
