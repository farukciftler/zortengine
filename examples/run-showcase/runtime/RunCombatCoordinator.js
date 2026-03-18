import * as THREE from 'three';

export class RunCombatCoordinator {
    constructor(scene) {
        this.scene = scene;
    }

    processEnemyAttacks(delta) {
        const livingEnemies = this.scene.waveDirector ? this.scene.waveDirector.getLivingEntities() : [];
        for (const enemy of livingEnemies) {
            if (!enemy || enemy.isDestroyed || enemy.fsm.getCurrentState() !== 'attack') continue;

            const target = this.getClosestPlayer(enemy.group.position);
            if (!target) continue;

            const attackProfile = enemy.getAttackProfile();
            if (attackProfile.style === 'support') {
                const ally = livingEnemies.find(candidate => candidate !== enemy && candidate.group.position.distanceTo(enemy.group.position) < 6);
                if (ally) {
                    this.scene.getSystem('damage')?.heal(ally, attackProfile.supportHeal * delta * 2, {
                        type: 'support',
                        source: enemy.entityId
                    });
                }
                continue;
            }

            this.scene.getSystem('damage')?.applyDamage(target, attackProfile.damage * delta, {
                type: attackProfile.style,
                source: enemy.entityId
            });

            if (this.scene.rng.chance(0.2)) {
                this.scene.getSystem('particles')?.emit(target.group.position, 1, {
                    color: attackProfile.style === 'ranged' ? 0xf59e0b : 0x900000,
                    speed: 3,
                    scale: 0.4,
                    life: 0.4
                });
            }
        }
    }

    processHazards(delta) {
        for (const player of this.scene.players) {
            if (player.isDestroyed) continue;
            for (const hazard of this.scene.hazards || []) {
                const flatPlayer = new THREE.Vector3(player.group.position.x, 0, player.group.position.z);
                const flatHazard = new THREE.Vector3(hazard.position.x, 0, hazard.position.z);
                if (flatPlayer.distanceTo(flatHazard) <= hazard.radius) {
                    this.scene.getSystem('damage')?.applyDamage(player, hazard.damagePerSecond * delta, {
                        type: 'hazard',
                        source: hazard.id
                    });
                }
            }
        }
    }

    getClosestPlayer(position) {
        const alivePlayers = this.scene.players.filter(player => !player.isDestroyed);
        let closest = null;
        let closestDistance = Infinity;
        for (const player of alivePlayers) {
            const distance = position.distanceTo(player.group.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closest = player;
            }
        }
        return closest;
    }
}
