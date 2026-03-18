export class DamageSystem {
    applyDamage(target, amount, metadata = {}) {
        const health = this._resolveHealthComponent(target);
        if (!health) return null;
        return health.applyDamage(amount, metadata);
    }

    heal(target, amount, metadata = {}) {
        const health = this._resolveHealthComponent(target);
        if (!health) return null;
        return health.heal(amount, metadata);
    }

    isAlive(target) {
        const health = this._resolveHealthComponent(target);
        return health ? health.isAlive() : false;
    }

    _resolveHealthComponent(target) {
        if (!target) return null;
        if (typeof target.getComponent === 'function') {
            return target.getComponent('health');
        }
        return null;
    }
}
