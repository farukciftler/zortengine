export class SeededRandom {
    constructor(seed = Date.now()) {
        this.setSeed(seed);
    }

    setSeed(seed) {
        const normalized = typeof seed === 'string'
            ? this._hashString(seed)
            : Math.floor(Number(seed) || 1);
        this.initialSeed = normalized >>> 0;
        this.state = this.initialSeed || 1;
        return this.initialSeed;
    }

    next() {
        let value = this.state;
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        this.state = value >>> 0;
        return this.state / 0xffffffff;
    }

    float(min = 0, max = 1) {
        return min + (max - min) * this.next();
    }

    int(min, max) {
        if (max < min) {
            [min, max] = [max, min];
        }
        return Math.floor(this.float(min, max + 1));
    }

    chance(probability) {
        return this.next() <= probability;
    }

    pick(items = []) {
        if (!items.length) return null;
        return items[this.int(0, items.length - 1)];
    }

    snapshot() {
        return {
            initialSeed: this.initialSeed,
            state: this.state
        };
    }

    restore(snapshot = {}) {
        this.initialSeed = snapshot.initialSeed ?? this.initialSeed ?? 1;
        this.state = snapshot.state ?? this.initialSeed ?? 1;
    }

    _hashString(value) {
        let hash = 2166136261;
        for (let i = 0; i < value.length; i++) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }
}
