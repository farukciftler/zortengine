import * as THREE from 'three';
import { Tower } from './Tower.js';

export class LaserTower extends Tower {
    constructor(gameArea) {
        const baseGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.6, 6);
        const turretGeo = new THREE.TorusGeometry(0.5, 0.15, 8, 24);
        
        super(gameArea, {
            type: 'laser',
            range: 12,
            damage: 0.8,
            fireRate: 0.1,
            baseCost: 100,
            color: 0xff4757,
            baseGeo: baseGeo,
            turretGeo: turretGeo
        });

        // Add floating inner core
        const coreGeo = new THREE.OctahedronGeometry(0.35);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff4757, emissiveIntensity: 2.0 });
        this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
        this.coreMesh.castShadow = true;
        this.turretGroup.add(this.coreMesh);
        
        if (this.turretMesh) {
            this.turretMesh.rotation.x = Math.PI/2;
            this.turretMesh.material.metalness = 0.8;
        }
        this.gameArea = gameArea;
        
        // High quality cylindrical laser beam
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xff4757, transparent: true, opacity: 0.8 });
        this.laserBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 8), laserMat);
        this.gameArea.threeScene.add(this.laserBeam);
        this.laserBeam.visible = false;
        
        // Impact flare
        const flareMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
        this.flare = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), flareMat);
        this.gameArea.threeScene.add(this.flare);
        this.flare.visible = false;

        this.laserTimeout = null;
    }

    onUpdate(delta, time) {
        super.onUpdate(delta, time); // Handles finding target and cooldown
        
        if (this.coreMesh) {
            this.coreMesh.rotation.y += delta * 2;
            this.coreMesh.rotation.z += delta * 1;
            this.coreMesh.position.y = Math.sin(time * 5) * 0.1;
        }
    }

    shoot(scene) {
        if (!this.target) return;

        const start = new THREE.Vector3();
        this.turretGroup.getWorldPosition(start);
        const end = new THREE.Vector3();
        this.target.group.getWorldPosition(end);
        end.y += 0.5; // Aim at chest
        
        // Position laser
        const dist = start.distanceTo(end);
        this.laserBeam.scale.set(this.level * 0.8, dist, this.level * 0.8);
        this.laserBeam.position.lerpVectors(start, end, 0.5);
        this.laserBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
        
        this.laserBeam.visible = true;
        this.flare.position.copy(end);
        this.flare.rotation.x += Math.random();
        this.flare.rotation.y += Math.random();
        this.flare.scale.setScalar(0.5 + Math.random() * 0.8);
        this.flare.visible = true;
        
        if (this.laserTimeout) clearTimeout(this.laserTimeout);
        this.laserTimeout = setTimeout(() => {
            this.laserBeam.visible = false;
            this.flare.visible = false;
        }, 150);

        // Advanced Laser Collision logic (Burn everything in path)
        const line = new THREE.Line3(start, end);
        const radiusSq = 2.0 * 2.0; // 2 units wide burn radius
        
        // Guarantee target
        this.target.takeDamage(this.damage);
        console.log(`[${this.id}] Blasted thick laser beam at ${this.target.id} for ${this.damage} damage!`);
        
        for (let enemy of scene.enemies) {
            if (enemy === this.target || enemy.isDead) continue;
            
            let closest = new THREE.Vector3();
            line.closestPointToPoint(enemy.group.position, true, closest);
            
            // Check if enemy is intersecting the laser beam
            if (closest.distanceToSquared(enemy.group.position) <= radiusSq) {
                enemy.takeDamage(this.damage * 0.6);
            }
        }
    }
    
    // Cleanup meshes when sold
    onRemove() {
        if(this.laserBeam) this.gameArea.threeScene.remove(this.laserBeam);
        if(this.flare) this.gameArea.threeScene.remove(this.flare);
    }
}
