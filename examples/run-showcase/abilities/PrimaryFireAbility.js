import * as THREE from 'three';

export function createPrimaryFireAbility(options = {}) {
    return {
        id: options.id || 'primaryFire',
        cooldown: options.cooldown ?? 0.16,
        getCooldown: () => {
            const baseCooldown = options.cooldown ?? 0.16;
            const fireRateScale = options.getFireRateScale ? options.getFireRateScale() : 1;
            return baseCooldown * fireRateScale;
        },
        execute: ({ owner, scene }) => {
            const projectileSystem = options.projectileSystem;
            const cameraManager = options.cameraManager;
            const input = options.input;
            const obstacles = options.obstacles || [];
            const cameraMode = options.getCameraMode ? options.getCameraMode() : '2.5d';
            const profile = owner?.controlProfile || 'default';

            if (!projectileSystem || !owner || !cameraManager || !input) {
                return false;
            }

            const direction = new THREE.Vector3();
            const camera = cameraManager.getThreeCamera();

            if (cameraMode === 'tps' && profile === 'default') {
                if (!input.isPointerLocked()) return false;
                camera.getWorldDirection(direction);
                direction.y = 0;
                direction.normalize();
                owner.group.rotation.y = Math.atan2(direction.x, direction.z);
            } else if (profile !== 'default') {
                const move = input.getMovementVector(profile);
                direction.set(move.x, 0, move.z);
                if (direction.lengthSq() === 0) {
                    direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), owner.group.rotation.y);
                } else {
                    direction.normalize();
                    owner.group.rotation.y = Math.atan2(direction.x, direction.z);
                }
            } else {
                const intersections = input.getRaycastIntersection(camera, obstacles);
                if (intersections.length > 0) {
                    const targetPoint = intersections[0].point.clone();
                    targetPoint.y = owner.group.position.y + 1.2;
                    direction.subVectors(targetPoint, owner.group.position).normalize();
                    owner.group.rotation.y = Math.atan2(direction.x, direction.z);
                } else {
                    direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), owner.group.rotation.y);
                }
            }

            projectileSystem.shoot(owner.group.position, direction, {
                damage: options.getDamage ? options.getDamage() : undefined
            });

            if (scene?.engine?.events) {
                scene.engine.events.emit('ability:primaryFire', { owner });
            }

            return true;
        }
    };
}
