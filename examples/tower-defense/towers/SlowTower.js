import * as THREE from 'three';
import { Tower } from './Tower.js';

export class SlowTower extends Tower {
    constructor(scene) {
        super(scene, {
            type: 'slow',
            range: 10,
            damage: 5,
            fireRate: 0.8,
            baseCost: 150,
            upgradeCost: 100,
            color: 0x1e90ff,
            turretGeo: new THREE.TorusGeometry(1, 0.3, 8, 16)
        });
        this.turretMesh.rotation.x = Math.PI / 2;
    }

    shoot(scene) {
        if (!this.target) return;
        const targetPos = this.target.group.position;
        const slowRadius = 6 + (this.level * 0.5);
        
        for (let enemy of scene.enemies) {
            if (enemy.isDead) continue;
            let dist = enemy.group.position.distanceTo(targetPos);
            if (dist <= slowRadius) {
                enemy.takeDamage(this.damage);
                enemy.applySlow(0.4, 3.0);
            }
        }
        
        console.log(`[${this.id}] Emitted freezing wave focused on ${this.target.id} (Dealt ${this.damage} dmg and 40% slow).`);
        
        this.drawProjectile(scene, targetPos);
    }
    
    drawProjectile(scene, targetPos) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.1, 0.5, 32),
            new THREE.MeshBasicMaterial({ color: 0x1e90ff, side: THREE.DoubleSide, transparent: true })
        );
        ring.rotation.x = -Math.PI/2;
        ring.position.copy(targetPos);
        ring.position.y += 0.5;
        scene.threeScene.add(ring);
        
        let s = 1;
        const animate = () => {
            s += 0.3;
            ring.scale.setScalar(s);
            ring.material.opacity -= 0.05;
            if(ring.material.opacity <= 0) {
                scene.threeScene.remove(ring);
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    onUpdate(delta, time) {
        super.onUpdate(delta, time);
        // Spin effect
        this.turretMesh.rotation.z += delta * 2;
    }
}
