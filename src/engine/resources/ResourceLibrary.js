import * as THREE from 'three';

/**
 * ResourceLibrary — A centralized cache for shared geometries and materials.
 * Reduces memory usage and draw calls by reusing Three.js objects across scenes.
 */
class ResourceLibrary {
    constructor() {
        this.geometries = new Map();
        this.materials = new Map();
        this._boxGeo = new THREE.BoxGeometry(1, 1, 1);
        this._planeGeo = new THREE.PlaneGeometry(1, 1);
        this._sphereGeo = new THREE.SphereGeometry(1, 16, 16);
    }

    /**
     * Get a shared material by key. If it doesn't exist, it will be created using the factory.
     */
    getMaterial(key, factory) {
        if (this.materials.has(key)) return this.materials.get(key);
        const mat = factory();
        mat.name = key;
        this.materials.set(key, mat);
        return mat;
    }

    /**
     * Get a shared BoxGeometry by dimensions.
     */
    getBox(w, h, d) {
        const key = `box_${w}_${h}_${d}`;
        if (this.geometries.has(key)) return this.geometries.get(key);
        const geo = new THREE.BoxGeometry(w, h, d);
        this.geometries.set(key, geo);
        return geo;
    }

    /**
     * Get a shared PlaneGeometry by dimensions.
     */
    getPlane(w, h) {
        const key = `plane_${w}_${h}`;
        if (this.geometries.has(key)) return this.geometries.get(key);
        const geo = new THREE.PlaneGeometry(w, h);
        this.geometries.set(key, geo);
        return geo;
    }

    /**
     * Get a shared CylinderGeometry.
     */
    getCylinder(rt, rb, h, segs = 12) {
        const key = `cyl_${rt}_${rb}_${h}_${segs}`;
        if (this.geometries.has(key)) return this.geometries.get(key);
        const geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        this.geometries.set(key, geo);
        return geo;
    }

    /**
     * Clear all cached resources.
     */
    dispose() {
        this.geometries.forEach(g => g.dispose());
        this.materials.forEach(m => m.dispose());
        this.geometries.clear();
        this.materials.clear();
    }
}

export const resources = new ResourceLibrary();
export { ResourceLibrary };
