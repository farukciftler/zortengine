import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createDroneMesh } from '../utils/CreatureBuilder.js';

export class DroneEnemy extends Enemy {
    constructor(scene, waypoints) {
        const hue = Math.random();
        const color = new THREE.Color().setHSL(hue, 0.8, 0.6).getHex();

        super(scene, {
            type: 'Drone',
            speed: 5,
            hp: 35,
            reward: 8,
            damage: 5,
            color: color,
            waypoints: waypoints,
            mesh: createDroneMesh(color)
        });

        this.mesh.scale.setScalar(0.8);
    }

    onUpdate(delta, time) {
        if (this.isDead || this.currentWaypointIndex >= this.waypoints.length) return;

        // Standard movement
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

        // Drone hover bobbing
        this.group.position.y = 1.0 + Math.sin(time * 4 + (this.mesh.userData.clockOffset || 0)) * 0.3;

        // Spin propellers
        this.mesh.traverse(child => {
            if (child.userData && child.userData.propeller) {
                child.rotation.y += delta * 30;
            }
        });

        // Billboard HP bar
        if (this.gameArea.cameraManager) {
            this.hpBar.quaternion.copy(this.gameArea.cameraManager.getThreeCamera().quaternion);
        }
    }
}
