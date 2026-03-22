import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createGolemMesh } from '../utils/CreatureBuilder.js';

export class GolemEnemy extends Enemy {
    constructor(scene, waypoints) {
        const hue = Math.random();
        const color = new THREE.Color().setHSL(hue, 0.4, 0.5).getHex();

        super(scene, {
            type: 'Golem',
            speed: 0.8,
            hp: 800,
            reward: 40,
            damage: 50,
            color: color,
            waypoints: waypoints,
            mesh: createGolemMesh(color)
        });

        this.mesh.scale.setScalar(1.2);
    }

    onUpdate(delta, time) {
        if (this.isDead || this.currentWaypointIndex >= this.waypoints.length) return;

        let currentSpeed = this.speed;
        if (this.slowTimer > 0) {
            this.slowTimer -= delta;
            currentSpeed *= this.slowEffect;
        }

        let target = this.waypoints[this.currentWaypointIndex];
        let dir = target.clone().sub(this.group.position);
        let dist = dir.length();
        let moveDist = currentSpeed * delta;

        if (moveDist >= dist) {
            this.group.position.copy(target);
            this.currentWaypointIndex++;
            if (this.currentWaypointIndex >= this.waypoints.length) {
                this.isDead = true;
                this.gameArea.events.emit('enemy:reached_base', this);
            }
        } else {
            dir.normalize();
            this.group.position.add(dir.clone().multiplyScalar(moveDist));
            let targetRot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
            this.group.quaternion.slerp(targetRot, Math.min(1.0, delta * 8));
        }

        // Animate golem: stomp walk, crystal core spin
        const ud = this.mesh.userData;
        if (ud.core) {
            ud.core.rotation.y += delta * 2;
            ud.core.rotation.z += delta * 1.5;
        }
        if (ud.armL && ud.armR) {
            const t = time * currentSpeed * 3 + (ud.clockOffset || 0);
            ud.armL.rotation.x = Math.sin(t) * 0.3;
            ud.armR.rotation.x = -Math.sin(t) * 0.3;
        }

        // Billboard HP bar
        if (this.gameArea.cameraManager) {
            this.hpBar.quaternion.copy(this.gameArea.cameraManager.getThreeCamera().quaternion);
        }
    }
}
