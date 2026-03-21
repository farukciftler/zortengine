import * as THREE from 'three';
import { Tower } from './Tower.js';

export class CannonTower extends Tower {
    constructor(gameArea) {
        // Heavy Hexagonal Base
        const baseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.8, 8);
        const turretGeo = new THREE.BoxGeometry(1.0, 0.6, 1.2);
        
        super(gameArea, {
            type: 'cannon',
            range: 8,
            damage: 60,
            fireRate: 0.5,
            baseCost: 200,
            upgradeCost: 150,
            color: 0xffa502,
            baseGeo: baseGeo,
            turretGeo: turretGeo
        });
        
        // Add double barrels
        const barrelGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.2, 8);
        barrelGeo.rotateX(Math.PI/2);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
        
        const b1 = new THREE.Mesh(barrelGeo, barrelMat); 
        b1.position.set(0.25, 0, 0.6); 
        b1.castShadow = true;
        
        const b2 = new THREE.Mesh(barrelGeo, barrelMat); 
        b2.position.set(-0.25, 0, 0.6); 
        b2.castShadow = true;
        
        this.turretGroup.add(b1, b2);
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
