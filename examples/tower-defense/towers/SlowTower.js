import * as THREE from 'three';
import { Tower } from './Tower.js';

export class SlowTower extends Tower {
    constructor(gameArea) {
        const baseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
        const turretGeo = new THREE.SphereGeometry(0.6, 16, 16);
        
        super(gameArea, {
            type: 'slow',
            range: 10,
            damage: 5,
            fireRate: 0.8,
            baseCost: 150,
            upgradeCost: 100,
            color: 0x1e90ff,
            baseGeo: baseGeo,
            turretGeo: turretGeo
        });
        
        if (this.turretMesh) {
            this.turretMesh.material.transparent = true;
            this.turretMesh.material.opacity = 0.8;
            this.turretMesh.material.emissive.setHex(0x1e90ff);
            this.turretMesh.material.emissiveIntensity = 0.5;
        }

        // Add spinning halo rings
        const ringGeo = new THREE.TorusGeometry(0.9, 0.05, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f2fe });
        
        this.halo1 = new THREE.Mesh(ringGeo, ringMat); this.halo1.rotation.x = Math.PI/2;
        this.halo2 = new THREE.Mesh(ringGeo, ringMat); this.halo2.rotation.x = Math.PI/2;
        
        this.turretGroup.add(this.halo1, this.halo2);
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
        if (this.halo1) {
            this.halo1.position.y = Math.sin(time * 3) * 0.2;
            this.halo1.rotation.z += delta * 2;
        }
        if (this.halo2) {
            this.halo2.position.y = Math.sin(time * 2 + Math.PI) * 0.2;
            this.halo2.rotation.z -= delta * 1.5;
        }
    }
}
