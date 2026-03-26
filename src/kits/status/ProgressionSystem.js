import { SaveManager } from '../../engine/snapshot/SaveManager.js';

/**
 * ProgressionSystem — Handles persistent player stats, unlocks, and meta-data.
 */
export class ProgressionSystem {
    /**
     * @param {string} storageKey The key used in local/session storage
     * @param {object} options Configuration for storage
     */
    constructor(storageKey = 'zort_progression', options = {}) {
        this.storageKey = storageKey;
        this.saveManager = new SaveManager({
            namespace: options.namespace || 'zortengine'
        });
        
        // Internal state (defaults)
        this.data = {
            totalPlayTime: 0,
            unlocks: [],
            stats: {},
            lastUpdated: Date.now(),
            ...options.defaults
        };
    }

    /**
     * Load state from persistence.
     */
    load() {
        const loaded = this.saveManager.load(this.storageKey, null);
        if (loaded) {
            this.data = { ...this.data, ...loaded };
        }
        return this.data;
    }

    /**
     * Save current state to persistence.
     */
    save() {
        this.data.lastUpdated = Date.now();
        this.saveManager.save(this.storageKey, this.data);
    }

    /**
     * Set a specific stat or data point.
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        this.data[key] = value;
    }

    /**
     * Get a specific stat or data point.
     * @param {string} key 
     * @param {any} defaultValue 
     */
    get(key, defaultValue = null) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    }

    /**
     * Increment a numeric stat.
     * @param {string} key 
     * @param {number} amount 
     */
    increment(key, amount = 1) {
        if (typeof this.data[key] !== 'number') this.data[key] = 0;
        this.data[key] += amount;
    }

    /**
     * Add an item to an unlocks array.
     * @param {string} unlockId 
     */
    unlock(unlockId) {
        if (!this.data.unlocks) this.data.unlocks = [];
        if (!this.data.unlocks.includes(unlockId)) {
            this.data.unlocks.push(unlockId);
        }
    }

    /**
     * Check if something is unlocked.
     * @param {string} unlockId 
     */
    isUnlocked(unlockId) {
        return this.data.unlocks?.includes(unlockId) || false;
    }
}
