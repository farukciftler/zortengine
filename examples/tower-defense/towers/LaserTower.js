import * as THREE from 'three';
import { Tower } from './Tower.js';

export class LaserTower extends Tower {
    constructor(gameArea) {
        super(gameArea, {
            type: 'laser',
            range: 12,
            damage: 25,
            fireRate: 2.5,
            baseCost: 100,
            upgradeCost: 75,
            color: 0xff4757,
            turretGeo: new THREE.CylinderGeometry(0.4, 0.8, 1.5, 4)
        });
        this.gameArea = gameArea;
        this.turretMesh.rotation.x = Math.PI / 2; // point forward
        
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
