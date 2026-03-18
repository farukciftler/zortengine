import * as THREE from 'three';

export function createPrimaryFireAbility(options = {}) {
    return {
        id: options.id || 'primaryFire',
        cooldown: options.cooldown ?? 0.16,
        execute: ({ owner, scene }) => {
            const projectileSystem = options.projectileSystem;
            const cameraManager = options.cameraManager;
            const input = options.input;
            const obstacles = options.obstacles || [];
            const cameraMode = options.getCameraMode ? options.getCameraMode() : '2.5d';

            if (!projectileSystem || !owner || !cameraManager || !input) {
                return false;
            }

            const direction = new THREE.Vector3();
            const camera = cameraManager.getThreeCamera();

            if (cameraMode === 'tps') {
                if (!input.isPointerLocked()) return false;
                camera.getWorldDirection(direction);
                direction.y = 0;
                direction.normalize();
                owner.group.rotation.y = Math.atan2(direction.x, direction.z);
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

            projectileSystem.shoot(owner.group.position, direction);

            if (scene?.engine?.events) {
                scene.engine.events.emit('ability:primaryFire', { owner });
            }

            return true;
        }
    };
}
