import * as THREE from 'three';
import { GameObject } from 'zortengine';
import { createHumanoid } from '../utils/HumanoidBuilder.js';

export class Enemy extends GameObject {
    constructor(gameArea, config) {
        super(gameArea, 'enemy');
        this.gameArea = gameArea;
        
        Enemy.idCounter = (Enemy.idCounter || 0) + 1;
        this.id = `${config.type || 'Enemy'}_${Enemy.idCounter}`;

        this.speed = config.speed || 2;
        this.maxHp = config.hp || 100;
        this.hp = this.maxHp;
        this.reward = config.reward || 10;
        this.damage = config.damage || 10;
        this.slowEffect = 0;
        this.slowTimer = 0;
        
        console.log(`[Enemy Spawner] Spawned ${this.id} with ${this.hp} HP.`);
        
        this.waypoints = config.waypoints || [];
        this.currentWaypointIndex = 0;
        this.isDead = false;
        
        const cColor = config.color || new THREE.Color().setHSL(Math.random(), 0.7, 0.5).getHex();
        const hColor = config.headColor || new THREE.Color().setHSL(Math.random(), 0.5, 0.7).getHex();
        this.mesh = config.mesh || createHumanoid(cColor, hColor, true);
        this.mesh.position.y = 0.0; // sits on its bottom pivot correctly
        this.group.add(this.mesh);

        // HP Bar
        const barGeo = new THREE.BoxGeometry(1.2, 0.1, 0.1);
        const barMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.hpBar = new THREE.Mesh(barGeo, barMat);
        this.hpBar.position.y = 2.0;
        this.group.add(this.hpBar);
        
        if (this.waypoints.length > 0) {
            this.group.position.copy(this.waypoints[0]);
        }
    }

    applySlow(amount, time) {
        this.slowEffect = amount; // e.g. 0.5 multiplier
        this.slowTimer = time;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hpBar.scale.x = Math.max(0, this.hp / this.maxHp);
        
        // Safe Flash animation for entire model
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setHex(0xffffff);
                    setTimeout(() => { 
                        if (child && child.material && child.material.emissive) {
                            child.material.emissive.setHex(0x000000); 
                        }
                    }, 100);
                }
            });
        }

        if (this.hp <= 0 && !this.isDead) {
            this.isDead = true;
            this.gameArea.events.emit('enemy:killed', this);
        }
    }

    onUpdate(delta, time) {
        if (this.isDead || this.currentWaypointIndex >= this.waypoints.length) return;

        let currentSpeed = this.speed;
        if (this.slowTimer > 0) {
            this.slowTimer -= delta;
            currentSpeed *= this.slowEffect;
            // Removed buggy emissive swap on kids to keep it simple and safe
        }
        
        let target = this.waypoints[this.currentWaypointIndex];
        let dir = target.clone().sub(this.group.position);
        let dist = dir.length();
        let moveDist = currentSpeed * delta;
        
        if (moveDist >= dist) {
            this.group.position.copy(target);
            this.currentWaypointIndex++;
            console.log(`[${this.id}] Reached waypoint ${this.currentWaypointIndex}`);
            if (this.currentWaypointIndex >= this.waypoints.length) {
                this.isDead = true;
                console.log(`[${this.id}] Reached base! Dealing ${this.damage} damage.`);
                this.gameArea.events.emit('enemy:reached_base', this);
            }
        } else {
            dir.normalize();
            this.group.position.add(dir.clone().multiplyScalar(moveDist));
            
            let targetRot = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                dir
            );
            this.group.quaternion.slerp(targetRot, Math.min(1.0, delta * 12));
            
            if (this.mesh.userData && this.mesh.userData.legL) {
                const limbs = this.mesh.userData;
                const t = time * currentSpeed * 2.5 + limbs.clockOffset;
                limbs.legL.rotation.x = Math.sin(t) * 0.6;
                limbs.legR.rotation.x = -Math.sin(t) * 0.6;
                limbs.armL.rotation.x = -Math.sin(t) * 0.5;
                limbs.armR.rotation.x = Math.sin(t) * 0.4;
            }
        }

        if (this.gameArea.cameraManager) {
            this.hpBar.quaternion.copy(this.gameArea.cameraManager.getThreeCamera().quaternion);
        }
    }
}
