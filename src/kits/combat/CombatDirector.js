import * as THREE from 'three';

/**
 * CombatDirector — A high-level system that coordinates interactions between 
 * entities, hazards, and combat events in a scene.
 */
export class CombatDirector {
    constructor(scene) {
        this.scene = scene;
        this.hazards = [];
    }

    addHazard(hazard) {
        this.hazards.push(hazard);
    }

    removeHazard(id) {
        this.hazards = this.hazards.filter(h => h.id !== id);
    }

    /**
     * Process all environmental hazards (e.g., area-of-effect damage).
     * @param {number} delta 
     * @param {Array} targets Entities to check against hazards
     */
    processHazards(delta, targets) {
        const damageSystem = this.scene.getSystem?.('damage');
        if (!damageSystem || this.hazards.length === 0) return;

        for (const target of targets) {
            if (!target || target.isDead || target.isDestroyed) continue;
            
            for (const hazard of this.hazards) {
                const flatTarget = new THREE.Vector3(target.group.position.x, 0, target.group.position.z);
                const flatHazard = new THREE.Vector3(hazard.position.x, 0, hazard.position.z);
                
                if (flatTarget.distanceTo(flatHazard) <= (hazard.radius || 1)) {
                    damageSystem.applyDamage(target, (hazard.damagePerSecond || 0) * delta, {
                        type: 'hazard',
                        source: hazard.id
                    });
                }
            }
        }
    }

    /**
     * Process basic AI attack logic by coordinating between AI state and Damage system.
     */
    processAICombat(delta, attackers, defenders) {
        const damageSystem = this.scene.getSystem?.('damage');
        if (!damageSystem) return;

        for (const attacker of attackers) {
            if (!attacker || attacker.isDead || attacker.fsm?.getCurrentState() !== 'attack') continue;

            const target = this._findBestTarget(attacker, defenders);
            if (!target) continue;

            const combatStats = attacker.getCombatStats?.() || { damage: 1, range: 2 };
            
            // Check range
            if (attacker.group.position.distanceTo(target.group.position) <= combatStats.range) {
                damageSystem.applyDamage(target, combatStats.damage * delta, {
                    type: combatStats.type || 'direct',
                    source: attacker.entityId || attacker.id
                });

                // Optional: visual feedback trigger
                this._emitVFX(target, combatStats.type);
            }
        }
    }

    _findBestTarget(attacker, defenders) {
        // Default to nearest
        let nearest = null;
        let minDist = Infinity;
        for (const defender of defenders) {
            if (!defender || defender.isDead) continue;
            const d = attacker.group.position.distanceTo(defender.group.position);
            if (d < minDist) {
                minDist = d;
                nearest = defender;
            }
        }
        return nearest;
    }

    _emitVFX(target, type) {
        const particles = this.scene.getSystem?.('particles');
        if (particles) {
            particles.emit(target.group.position, 1, {
                color: type === 'ranged' ? 0xffaa00 : 0xaa0000,
                scale: 0.3
            });
        }
    }
}
