import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createSpiderMesh } from '../utils/CreatureBuilder.js';

export class SpiderEnemy extends Enemy {
    constructor(scene, waypoints) {
        const hue = Math.random();
        const color = new THREE.Color().setHSL(hue, 0.5, 0.4).getHex();

        super(scene, {
            type: 'Spider',
            speed: 2.5,
            hp: 180,
            reward: 15,
            damage: 12,
            color: color,
            waypoints: waypoints,
            mesh: createSpiderMesh(color)
        });
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
            this.group.quaternion.slerp(targetRot, Math.min(1.0, delta * 12));
        }

        // Animate spider legs
        const ud = this.mesh.userData;
        if (ud.legs) {
            const t = time * currentSpeed * 2.0 + (ud.clockOffset || 0);
            ud.legs.forEach((leg, i) => {
                leg.rotation.x = Math.sin(t + i * 1.0) * 0.3;
                leg.rotation.z += Math.sin(t + i * 0.5) * 0.01;
            });
        }

        // Billboard HP bar
        if (this.gameArea.cameraManager) {
            this.hpBar.quaternion.copy(this.gameArea.cameraManager.getThreeCamera().quaternion);
        }
    }
}
