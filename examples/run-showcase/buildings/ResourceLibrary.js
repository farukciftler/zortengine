import * as THREE from 'three';

/**
 * ResourceLibrary
 * A centralized pool for sharing geometries and materials across buildings.
 * This significantly reduces RAM and GPU memory usage by avoiding thousands
 * of redundant instances.
 */
class ResourceLibrary {
    constructor() {
        this.geometries = new Map();
        this.materials = new Map();
    }

    /**
     * Get or create a shared BoxGeometry
     */
    getBox(w, h, d) {
        // We use a 1x1x1 base box and scale the mesh instead for maximum reuse?
        // Actually, scaling the geometry parameters is better for physics-to-mesh alignment 
        // in some cases, but for simple decorations, a shared 1x1x1 box is best.
        // For this showcase, we'll cache by dimensions to keep it simple for now.
        const key = `box_${w}_${h}_${d}`;
        if (!this.geometries.has(key)) {
            this.geometries.set(key, new THREE.BoxGeometry(w, h, d));
        }
        return this.geometries.get(key);
    }

    /**
     * Get or create a shared CylinderGeometry
     */
    getCylinder(rTop, rBot, h, seg) {
        const key = `cyl_${rTop}_${rBot}_${h}_${seg}`;
        if (!this.geometries.has(key)) {
            this.geometries.set(key, new THREE.CylinderGeometry(rTop, rBot, h, seg));
        }
        return this.geometries.get(key);
    }

    /**
     * Get or create a shared PlaneGeometry
     */
    getPlane(w, h) {
        const key = `plane_${w}_${h}`;
        if (!this.geometries.has(key)) {
            this.geometries.set(key, new THREE.PlaneGeometry(w, h));
        }
        return this.geometries.get(key);
    }

    /**
     * Get or create a shared material
     */
    getMaterial(id, factory) {
        if (!this.materials.has(id)) {
            this.materials.set(id, factory());
        }
        return this.materials.get(id);
    }

    dispose() {
        this.geometries.forEach(g => g.dispose());
        this.materials.forEach(m => m.dispose());
        this.geometries.clear();
        this.materials.clear();
    }
}

export const resources = new ResourceLibrary();
