import * as THREE from 'three';

export function createDashAbility(options = {}) {
    return {
        id: options.id || 'dash',
        cooldown: options.cooldown ?? 1.2,
        getCooldown: () => {
            const baseCooldown = options.cooldown ?? 1.2;
            const scale = options.getCooldownScale ? options.getCooldownScale() : 1;
            return baseCooldown * scale;
        },
        canUse: ({ owner }) => {
            const movement = owner?.getComponent?.('movement');
            return !!movement;
        },
        execute: ({ owner }) => {
            const movement = owner?.getComponent?.('movement');
            if (!movement || !owner) return false;
            const profile = owner.controlProfile || 'default';

            const direction = movement.mode === 'tps'
                ? movement._getThirdPersonMoveDirection(options.input.getMovementVector(profile))
                : movement._getIsometricMoveDirection(options.input.getMovementVector(profile));

            if (direction.lengthSq() === 0) {
                direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), owner.group.rotation.y);
            } else {
                direction.normalize();
            }

            const dashStrength = options.dashStrength ?? 14;
            const dashDuration = options.dashDuration ?? 0.14;
            movement.triggerDash(direction, dashStrength, dashDuration);

            if (options.particleManager) {
                options.particleManager.emit(owner.group.position, 8, {
                    color: 0x7dd3fc,
                    speed: 4,
                    scale: 0.35,
                    life: 0.35
                });
            }

            return true;
        }
    };
}
