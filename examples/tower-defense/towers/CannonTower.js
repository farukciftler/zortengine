import * as THREE from 'three';
import { Tower } from './Tower.js';

export class CannonTower extends Tower {
    constructor(scene) {
        super(scene, {
            type: 'cannon',
            range: 8,
            damage: 60,
            fireRate: 0.5,
            baseCost: 200,
            upgradeCost: 150,
            color: 0xffa502,
            turretGeo: new THREE.SphereGeometry(1, 16, 16)
        });
        
        // Add a cannon barrel
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.8;
        this.turretGroup.add(barrel);
    }

    shoot(scene) {
        if (!this.target) return;
        
        // Splash damage logic
        const targetPos = this.target.group.position;
        const splashRadius = 4 + (this.level * 0.5); // scales with level
        
        for (let enemy of scene.enemies) {
            if (enemy.isDead) continue;
            let dist = enemy.group.position.distanceTo(targetPos);
            if (dist <= splashRadius) {
                enemy.takeDamage(this.damage);
            }
        }
        
        console.log(`[${this.id}] Fired heavy cannon blast centered on ${this.target.id} for ${this.damage} area damage.`);
        
        this.drawProjectile(scene, targetPos);
    }

    drawProjectile(scene, targetPos) {
        // Visual splash (Explosion sphere)
        const exp = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffa502, transparent: true, opacity: 0.8 })
        );
        exp.position.copy(targetPos);
        scene.threeScene.add(exp);
        
        let scale = 1;
        const animate = () => {
            scale += 0.2;
            exp.scale.setScalar(scale);
            exp.material.opacity -= 0.1;
            if (exp.material.opacity <= 0) {
                scene.threeScene.remove(exp);
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
}
