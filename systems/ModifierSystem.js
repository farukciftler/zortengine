export class ModifierSystem {
    constructor() {
        this.entries = new Map();
        this.context = null;
    }

    onAttach(context) {
        this.context = context;
    }

    addModifier(owner, modifier) {
        if (!owner || !modifier?.stat) return null;
        if (!this.entries.has(owner)) {
            this.entries.set(owner, []);
        }
        this.entries.get(owner).push({
            stat: modifier.stat,
            op: modifier.op || 'add',
            value: modifier.value ?? 0,
            source: modifier.source || 'unknown'
        });
        return modifier;
    }

    removeSource(owner, source) {
        if (!this.entries.has(owner)) return;
        this.entries.set(owner, this.entries.get(owner).filter(entry => entry.source !== source));
    }

    getStat(owner, stat, baseValue = 0) {
        const modifiers = this.entries.get(owner) || [];
        let value = baseValue;
        let multiplier = 1;

        for (const modifier of modifiers) {
            if (modifier.stat !== stat) continue;
            if (modifier.op === 'mul') {
                multiplier *= modifier.value;
            } else {
                value += modifier.value;
            }
        }

        return value * multiplier;
    }

    snapshot(owner) {
        return (this.entries.get(owner) || []).map(entry => ({ ...entry }));
    }
}
