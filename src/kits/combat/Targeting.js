import * as THREE from 'three';

/**
 * Targeting — Utilities for spatial target acquisition.
 */
export class Targeting {
    /**
     * Find the nearest target to an origin point within a given range.
     * @param {THREE.Vector3} origin The point to search from
     * @param {Array} entities List of potential target entities (should have .group.position)
     * @param {number} range Maximum search distance
     * @returns {object|null} The nearest entity, or null if none in range
     */
    static findNearest(origin, entities, range = Infinity) {
        let nearestDist = Infinity;
        let target = null;

        for (const entity of entities) {
            if (!entity || entity.isDead || entity.isDestroyed) continue;
            
            const dist = entity.group.position.distanceTo(origin);
            if (dist <= range && dist < nearestDist) {
                nearestDist = dist;
                target = entity;
            }
        }
        return target;
    }

    /**
     * Find targets within a cone/view frustum (useful for AI perception).
     * @param {THREE.Vector3} origin 
     * @param {THREE.Vector3} direction Look direction
     * @param {Array} entities 
     * @param {number} range 
     * @param {number} angle Cone angle in radians
     */
    static findInCone(origin, direction, entities, range, angle) {
        const results = [];
        const normDir = direction.clone().normalize();
        const halfAngle = angle / 2;

        for (const entity of entities) {
            if (!entity || entity.isDead || entity.isDestroyed) continue;

            const toEntity = entity.group.position.clone().sub(origin);
            const dist = toEntity.length();
            if (dist > range) continue;

            toEntity.normalize();
            const dot = toEntity.dot(normDir);
            if (Math.acos(dot) <= halfAngle) {
                results.push({ entity, dist });
            }
        }
        return results.sort((a, b) => a.dist - b.dist);
    }
}
