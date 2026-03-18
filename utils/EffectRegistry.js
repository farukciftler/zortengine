export class EffectRegistry {
    constructor() {
        this.effects = new Map();
    }

    register(id, handler) {
        if (!id || typeof handler !== 'function') return null;
        this.effects.set(id, handler);
        return handler;
    }

    apply(effect, context = {}) {
        if (!effect) return false;

        const definition = typeof effect === 'string'
            ? { type: effect }
            : effect;
        const handler = this.effects.get(definition.type);
        if (!handler) return false;

        handler(definition, context);
        return true;
    }

    applyAll(effects = [], context = {}) {
        for (const effect of effects) {
            this.apply(effect, context);
        }
    }
}
