import { Component } from './Component.js';

export class HealthComponent extends Component {
    constructor(options = {}) {
        super();
        this.maxHealth = options.maxHealth ?? 100;
        this.health = options.health ?? this.maxHealth;
        this.invulnerable = options.invulnerable ?? false;
        this.onDamage = options.onDamage || null;
        this.onHeal = options.onHeal || null;
        this.onDeath = options.onDeath || null;
    }

    setHealth(value) {
        this.health = Math.max(0, Math.min(this.maxHealth, value));
        return this.health;
    }

    applyDamage(amount, metadata = {}) {
        if (this.invulnerable || amount <= 0 || this.health <= 0) {
            return this.health;
        }

        this.setHealth(this.health - amount);

        if (typeof this.onDamage === 'function') {
            this.onDamage(this.owner, amount, metadata, this);
        }

        this._emitLifecycleEvent('damage', { amount, metadata });

        if (this.health <= 0) {
            if (typeof this.onDeath === 'function') {
                this.onDeath(this.owner, metadata, this);
            }
            this._emitLifecycleEvent('death', { metadata });
        }

        return this.health;
    }

    heal(amount, metadata = {}) {
        if (amount <= 0 || this.health <= 0) {
            return this.health;
        }

        const previous = this.health;
        this.setHealth(this.health + amount);
        const applied = this.health - previous;

        if (applied > 0 && typeof this.onHeal === 'function') {
            this.onHeal(this.owner, applied, metadata, this);
        }

        if (applied > 0) {
            this._emitLifecycleEvent('heal', { amount: applied, metadata });
        }

        return this.health;
    }

    isAlive() {
        return this.health > 0;
    }

    _emitLifecycleEvent(eventName, payload) {
        const engineEvents = this.owner?.sceneController?.engine?.events;
        if (engineEvents) {
            engineEvents.emit(`health:${eventName}`, {
                owner: this.owner,
                component: this,
                ...payload
            });
        }
    }
}
