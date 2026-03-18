export class AbilitySystem {
    constructor() {
        this.owners = new Map();
        this.context = null;
    }

    onAttach(context) {
        this.context = context;
    }

    onDetach() {
        this.context = null;
    }

    grantAbility(owner, abilityId, definition) {
        if (!owner || !abilityId || !definition) return null;

        let abilities = this.owners.get(owner);
        if (!abilities) {
            abilities = new Map();
            this.owners.set(owner, abilities);
        }

        const entry = {
            id: abilityId,
            definition,
            cooldownRemaining: 0
        };

        abilities.set(abilityId, entry);
        return entry;
    }

    removeAbility(owner, abilityId) {
        const abilities = this.owners.get(owner);
        if (!abilities) return null;
        const entry = abilities.get(abilityId) || null;
        abilities.delete(abilityId);
        if (abilities.size === 0) {
            this.owners.delete(owner);
        }
        return entry;
    }

    hasAbility(owner, abilityId) {
        return this.owners.get(owner)?.has(abilityId) || false;
    }

    getAbilityState(owner, abilityId) {
        return this.owners.get(owner)?.get(abilityId) || null;
    }

    canUse(owner, abilityId, runtimeContext = {}) {
        const entry = this.getAbilityState(owner, abilityId);
        if (!entry) return false;
        if (entry.cooldownRemaining > 0) return false;

        const { definition } = entry;
        if (typeof definition.canUse === 'function') {
            return definition.canUse({
                owner,
                system: this,
                scene: this.context?.scene || null,
                engine: this.context?.engine || null,
                ...runtimeContext
            }) !== false;
        }

        return true;
    }

    useAbility(owner, abilityId, runtimeContext = {}) {
        const entry = this.getAbilityState(owner, abilityId);
        if (!entry) return false;
        if (!this.canUse(owner, abilityId, runtimeContext)) return false;

        const { definition } = entry;
        const payload = {
            owner,
            system: this,
            scene: this.context?.scene || null,
            engine: this.context?.engine || null,
            ...runtimeContext
        };

        const result = definition.execute(payload);
        if (result === false) {
            return false;
        }

        entry.cooldownRemaining = typeof definition.getCooldown === 'function'
            ? definition.getCooldown(payload)
            : (definition.cooldown ?? 0);
        this._emitLifecycleEvent('used', {
            owner,
            abilityId,
            cooldown: entry.cooldownRemaining
        });
        return true;
    }

    update(delta) {
        for (const abilities of this.owners.values()) {
            for (const entry of abilities.values()) {
                if (entry.cooldownRemaining > 0) {
                    entry.cooldownRemaining = Math.max(0, entry.cooldownRemaining - delta);
                }
            }
        }
    }

    _emitLifecycleEvent(eventName, payload) {
        if (this.context?.engine?.events) {
            this.context.engine.events.emit(`ability:${eventName}`, payload);
        }
    }
}
