import { SaveManager } from 'zortengine/persistence';

export class MetaProgression {
    constructor(storageKey = 'meta') {
        this.storageKey = storageKey;
        this.saveManager = new SaveManager({
            namespace: 'zortengine'
        });
        this.totalRuns = 0;
        this.completedRuns = 0;
        this.failedRuns = 0;
        this.bankEssence = 0;
        this.bestRelicCount = 0;
        this.bestTime = null;
        this.dailySeed = null;
        this.unlockedLoadouts = ['vanguard'];
        this.completedSeeds = [];
        this.runHistory = [];
    }

    load(storage = null) {
        const parsed = this._getStorage(storage).load(this.storageKey, null);
        if (!parsed) return this;

        this.totalRuns = parsed.totalRuns ?? 0;
        this.completedRuns = parsed.completedRuns ?? 0;
        this.failedRuns = parsed.failedRuns ?? 0;
        this.bankEssence = parsed.bankEssence ?? 0;
        this.bestRelicCount = parsed.bestRelicCount ?? 0;
        this.bestTime = parsed.bestTime ?? null;
        this.dailySeed = parsed.dailySeed ?? this.generateDailySeed();
        this.unlockedLoadouts = parsed.unlockedLoadouts ?? ['vanguard'];
        this.completedSeeds = parsed.completedSeeds ?? [];
        this.runHistory = parsed.runHistory ?? [];

        return this;
    }

    save(storage = null) {
        const target = this._getStorage(storage);
        target.save(this.storageKey, {
            totalRuns: this.totalRuns,
            completedRuns: this.completedRuns,
            failedRuns: this.failedRuns,
            bankEssence: this.bankEssence,
            bestRelicCount: this.bestRelicCount,
            bestTime: this.bestTime,
            dailySeed: this.dailySeed || this.generateDailySeed(),
            unlockedLoadouts: this.unlockedLoadouts,
            completedSeeds: this.completedSeeds,
            runHistory: this.runHistory.slice(-10)
        });
    }

    recordRun(runState, storage = null) {
        this.totalRuns += 1;
        this.bestRelicCount = Math.max(this.bestRelicCount, runState.getRelicCount());
        this.bestTime = this.bestTime === null
            ? runState.elapsedTime
            : Math.min(this.bestTime, runState.elapsedTime);

        if (runState.status === 'completed') {
            this.completedRuns += 1;
            this.bankEssence += runState.essence;
            if (runState.seed && !this.completedSeeds.includes(runState.seed)) {
                this.completedSeeds.push(runState.seed);
            }
        } else if (runState.status === 'failed') {
            this.failedRuns += 1;
        }

        this.runHistory.push(runState.getSummary());
        if (this.completedRuns >= 1 && !this.unlockedLoadouts.includes('striker')) {
            this.unlockedLoadouts.push('striker');
        }
        if (this.bankEssence >= 6 && !this.unlockedLoadouts.includes('duo-protocol')) {
            this.unlockedLoadouts.push('duo-protocol');
        }

        this.save(storage);
    }

    _getStorage(storage) {
        if (storage) {
            return new SaveManager({
                namespace: 'zortengine',
                storage
            });
        }
        return this.saveManager;
    }

    generateDailySeed(date = new Date()) {
        const yyyy = date.getUTCFullYear();
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(date.getUTCDate()).padStart(2, '0');
        return `daily-${yyyy}${mm}${dd}`;
    }
}
