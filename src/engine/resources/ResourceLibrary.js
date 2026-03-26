import * as THREE from 'three';

/**
 * ResourceLibrary — A centralized cache for shared geometries and materials.
 * Reduces memory usage and draw calls by reusing Three.js objects across scenes.
 */
class ResourceLibrary {
    constructor() {
        this.geometries = new Map();
        this.materials = new Map();
        this.refCounts = new Map(); // Track usage by key
    }

    /**
     * Increment reference count for a resource key.
     */
    addRef(key) {
        const count = this.refCounts.get(key) || 0;
        this.refCounts.set(key, count + 1);
    }

    /**
     * Decrement reference count; if 0, mark as potentially disposable.
     */
    release(key) {
        const count = (this.refCounts.get(key) || 0) - 1;
        if (count <= 0) {
            this.refCounts.delete(key);
            // Optionally auto-dispose if needed, but usually better to wait for a clean phase
        } else {
            this.refCounts.set(key, count);
        }
    }

    /**
     * Get a shared material by key.
     */
    getMaterial(key, factory) {
        this.addRef(key);
        if (this.materials.has(key)) return this.materials.get(key);
        const mat = factory();
        mat.name = key;
        mat._isShared = true; // Tag for safe disposal logic
        this.materials.set(key, mat);
        return mat;
    }

    /**
     * Get a shared BoxGeometry by dimensions.
     */
    getBox(w, h, d) {
        const key = `box_${w}_${h}_${d}`;
        this.addRef(key);
        if (this.geometries.has(key)) return this.geometries.get(key);
        const geo = new THREE.BoxGeometry(w, h, d);
        geo._isShared = true; // Tag for safe disposal logic
        this.geometries.set(key, geo);
        return geo;
    }

    /**
     * Get a shared PlaneGeometry by dimensions.
     */
    getPlane(w, h) {
        const key = `plane_${w}_${h}`;
        this.addRef(key);
        if (this.geometries.has(key)) return this.geometries.get(key);
        const geo = new THREE.PlaneGeometry(w, h);
        geo._isShared = true; // Tag for safe disposal logic
        this.geometries.set(key, geo);
        return geo;
    }

    /**
     * Get a shared CylinderGeometry.
     */
    getCylinder(rt, rb, h, segs = 12) {
        const key = `cyl_${rt}_${rb}_${h}_${segs}`;
        this.addRef(key);
        if (this.geometries.has(key)) return this.geometries.get(key);
        const geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        geo._isShared = true; // Tag for safe disposal logic
        this.geometries.set(key, geo);
        return geo;
    }

    /**
     * Clear resources that have 0 references.
     */
    disposeUnused() {
        // Find keys with 0 ref (not in refCounts) but in maps
        this.geometries.forEach((g, key) => {
            if (!this.refCounts.has(key)) {
                g.dispose();
                this.geometries.delete(key);
            }
        });
        this.materials.forEach((m, key) => {
            if (!this.refCounts.has(key)) {
                m.dispose();
                this.materials.delete(key);
            }
        });
    }

    /**
     * Clear all cached resources.
     */
    dispose() {
        this.geometries.forEach(g => g.dispose());
        this.materials.forEach(m => m.dispose());
        this.geometries.clear();
        this.materials.clear();
        this.refCounts.clear();
    }
}

export const resources = new ResourceLibrary();
export { ResourceLibrary };
