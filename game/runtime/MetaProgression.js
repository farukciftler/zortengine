export class MetaProgression {
    constructor(storageKey = 'zortengine-meta-v1') {
        this.storageKey = storageKey;
        this.totalRuns = 0;
        this.completedRuns = 0;
        this.failedRuns = 0;
        this.bankEssence = 0;
        this.bestRelicCount = 0;
    }

    load(storage = null) {
        const raw = this._getStorage(storage)?.getItem(this.storageKey);
        if (!raw) return this;

        try {
            const parsed = JSON.parse(raw);
            this.totalRuns = parsed.totalRuns ?? 0;
            this.completedRuns = parsed.completedRuns ?? 0;
            this.failedRuns = parsed.failedRuns ?? 0;
            this.bankEssence = parsed.bankEssence ?? 0;
            this.bestRelicCount = parsed.bestRelicCount ?? 0;
        } catch {
            // ignore corrupted save data
        }

        return this;
    }

    save(storage = null) {
        const target = this._getStorage(storage);
        if (!target) return;

        target.setItem(this.storageKey, JSON.stringify({
            totalRuns: this.totalRuns,
            completedRuns: this.completedRuns,
            failedRuns: this.failedRuns,
            bankEssence: this.bankEssence,
            bestRelicCount: this.bestRelicCount
        }));
    }

    recordRun(runState, storage = null) {
        this.totalRuns += 1;
        this.bestRelicCount = Math.max(this.bestRelicCount, runState.getRelicCount());

        if (runState.status === 'completed') {
            this.completedRuns += 1;
            this.bankEssence += runState.essence;
        } else if (runState.status === 'failed') {
            this.failedRuns += 1;
        }

        this.save(storage);
    }

    _getStorage(storage) {
        if (storage) return storage;
        if (typeof localStorage !== 'undefined') return localStorage;
        return null;
    }
}
