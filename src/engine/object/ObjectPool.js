/**
 * ObjectPool — Generic pool for reusing object instances to reduce GC pressure.
 * Also supports onAcquire and onRelease hooks for objects.
 */
export class ObjectPool {
    /**
     * @param {Function} factory - Function that returns a new object instance.
     * @param {number|Object} initialSizeOrOptions - Initial size or options object.
     */
    constructor(factory, initialSizeOrOptions = 10) {
        this.factory = factory;
        
        let initialSize = 10;
        let maxSize = 1000;
        
        if (typeof initialSizeOrOptions === 'object') {
            initialSize = initialSizeOrOptions.initialSize ?? 10;
            maxSize = initialSizeOrOptions.maxSize ?? 1000;
        } else {
            initialSize = initialSizeOrOptions;
        }

        this.initialSize = initialSize;
        this.maxSize = maxSize;
        this.pool = [];
        this.activeCount = 0;

        for (let i = 0; i < this.initialSize; i++) {
            this.pool.push(this.factory());
        }
    }

    /**
     * Acquire an object from the pool. Creates a new one if pool is empty.
     * Alias for get() for backward compatibility.
     */
    acquire(...args) {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.factory(...args);
        }
        
        this.activeCount++;
        
        if (typeof obj.onAcquire === 'function') {
            obj.onAcquire(...args);
        }
        
        return obj;
    }

    /**
     * Alias for acquire()
     */
    get(...args) {
        return this.acquire(...args);
    }

    /**
     * Release an object back into the pool.
     */
    release(obj) {
        if (!obj) return;
        
        if (this.pool.length < this.maxSize) {
            if (typeof obj.onRelease === 'function') {
                obj.onRelease();
            }
            this.pool.push(obj);
            this.activeCount = Math.max(0, this.activeCount - 1);
        } else {
            if (typeof obj.dispose === 'function') {
                obj.dispose();
            }
        }
    }

    /**
     * Get the number of available objects in the pool.
     */
    getFreeCount() {
        return this.pool.length;
    }

    /**
     * Clear the pool.
     */
    clear() {
        while (this.pool.length > 0) {
            const obj = this.pool.pop();
            if (typeof obj.dispose === 'function') {
                obj.dispose();
            }
        }
        this.activeCount = 0;
    }

    get stats() {
        return {
            available: this.pool.length,
            active: this.activeCount,
            total: this.pool.length + this.activeCount
        };
    }
}
