export class RunState {
    constructor() {
        this.essence = 0;
        this.relics = [];
        this.status = 'active';
        this.extractionUnlocked = false;
        this.modifiers = {
            projectileDamageBonus: 0,
            jumpBonus: 0,
            dashCooldownScale: 1,
            fireRateScale: 1
        };
    }

    addEssence(amount = 1) {
        this.essence += amount;
        return this.essence;
    }

    addRelic(relic) {
        if (!relic) return null;
        this.relics.push(relic.id);
        if (typeof relic.apply === 'function') {
            relic.apply(this);
        }
        return relic;
    }

    getRelicCount() {
        return this.relics.length;
    }

    unlockExtraction() {
        this.extractionUnlocked = true;
    }

    complete() {
        this.status = 'completed';
    }

    fail() {
        this.status = 'failed';
    }
}
