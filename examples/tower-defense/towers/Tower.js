import * as THREE from 'three';
import { GameObject } from 'zortengine';

export class Tower extends GameObject {
    constructor(gameArea, config) {
        super(gameArea, 'tower');
        this.gameArea = gameArea;
        
        this.type = config.type || 'basic';
        Tower.idCounter = (Tower.idCounter || 0) + 1;
        this.id = `Tower_${this.type}_${Tower.idCounter}`;

        this.range = config.range || 5;
        this.damage = config.damage || 10;
        this.fireRate = config.fireRate || 1.0; 
        this.level = 1;
        this.baseCost = config.baseCost || 100;
        this.upgradeCost = config.upgradeCost || 50;
        this.sellValue = this.baseCost * 0.5;
        this.color = config.color || 0xffffff;
        
        this.fireCooldown = 0;
        this.target = null;

        this.buildMesh(config);
    }

    buildMesh(config) {
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.8 });
        if (config.baseGeo) {
            this.baseMesh = new THREE.Mesh(config.baseGeo, baseMat);
        } else {
            this.baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.5, 8), baseMat);
        }
        this.baseMesh.position.y = 0.25;
        this.baseMesh.castShadow = true;
        this.baseMesh.receiveShadow = true;
        this.group.add(this.baseMesh);

        this.turretGroup = new THREE.Group();
        this.turretGroup.position.y = 1;
        this.group.add(this.turretGroup);

        const turretMat = new THREE.MeshStandardMaterial({ color: this.color, metalness: 0.5, roughness: 0.2 });
        if (config.turretGeo) {
            this.turretMesh = new THREE.Mesh(config.turretGeo, turretMat);
        } else {
            this.turretMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), turretMat);
        }
        this.turretMesh.castShadow = true;
        this.turretMesh.receiveShadow = true;
        this.turretGroup.add(this.turretMesh);
    }

    upgrade() {
        this.level++;
        this.damage *= 1.4;
        this.range *= 1.1;
        this.sellValue += this.upgradeCost * 0.5;
        this.upgradeCost = Math.floor(this.upgradeCost * 1.6);
        this.turretMesh.scale.multiplyScalar(1.05);
        this.turretMesh.material.emissive.setHex(this.color);
        this.turretMesh.material.emissiveIntensity = 0.2 * this.level;
    }

    findTarget(enemies) {
        let nearestDist = Infinity;
        let p = this.group.position;
        this.target = null;

        for (let enemy of enemies) {
            if (enemy.isDead) continue;
            let d = enemy.group.position.distanceTo(p);
            if (d <= this.range && d < nearestDist) {
                nearestDist = d;
                this.target = enemy;
            }
        }
    }

    onUpdate(delta, time) {
        const enemies = this.gameArea.enemies || [];
        this.fireCooldown -= delta;
        if (this.target && this.target.isDead) this.target = null;
        
        if (!this.target) {
            this.findTarget(enemies);
            if(this.target) console.log(`[${this.id}] Locked onto new target: ${this.target.id} at dist ${this.target.group.position.distanceTo(this.group.position).toFixed(1)}`);
        } else {
            if (this.target.group.position.distanceTo(this.group.position) > this.range) {
                console.log(`[${this.id}] Target ${this.target.id} escaped out of range.`);
                this.target = null;
            } else {
                let tPos = this.target.group.position.clone();
                tPos.y = this.turretGroup.position.y + this.group.position.y;
                this.turretGroup.lookAt(tPos);
                
                if (this.fireCooldown <= 0) {
                    this.fireCooldown = this.fireRate;
                    this.shoot(this.gameArea);
                }
            }
        }
    }

    shoot(scene) {
        if (this.target) {
            this.target.takeDamage(this.damage);
            this.drawProjectile(scene);
        }
    }
    
    drawProjectile(scene) {
        // Base visuals
    }
}
