import * as THREE from 'three';
import { Tower } from './Tower.js';

export class CannonTower extends Tower {
    constructor(gameArea) {
        // ──── Materials ────
        const white = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, metalness: 0.85, roughness: 0.08 });
        const accent = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffa502, emissiveIntensity: 1.5 });
        const plateMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.9, roughness: 0.05 });

        // ──── Base ────
        const baseGeo = new THREE.CylinderGeometry(0.95, 1.1, 0.45, 8);

        // ──── Turret Assembly ────
        const tGroup = new THREE.Group();

        // Central turret body
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.65, 8), white);
        body.position.y = 0.2;
        body.castShadow = true;
        tGroup.add(body);

        // Top dome
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            white
        );
        dome.position.y = 0.52;
        dome.castShadow = true;
        tGroup.add(dome);

        // Side armor plates
        const plateGeo = new THREE.BoxGeometry(0.1, 0.45, 0.55);
        for (let side = -1; side <= 1; side += 2) {
            const plate = new THREE.Mesh(plateGeo, plateMat);
            plate.position.set(side * 0.55, 0.2, 0);
            plate.rotation.z = side * -0.12;
            plate.castShadow = true;
            tGroup.add(plate);
        }

        // ──── Single Barrel (Level 1) ────
        const barrelGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.4, 12);
        const mainBarrel = new THREE.Mesh(barrelGeo, white);
        mainBarrel.rotation.x = Math.PI / 2;
        mainBarrel.position.set(0, 0.35, 0.75);
        mainBarrel.castShadow = true;
        tGroup.add(mainBarrel);

        // Muzzle brake ring
        const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 16), accent);
        muzzle.position.set(0, 0.35, 1.45);
        tGroup.add(muzzle);

        // Ventilation fins
        const ventGeo = new THREE.BoxGeometry(0.03, 0.12, 0.2);
        for (let i = 0; i < 3; i++) {
            for (let side = -1; side <= 1; side += 2) {
                const vent = new THREE.Mesh(ventGeo, plateMat);
                vent.position.set(side * 0.53, 0.05 + i * 0.14, -0.1);
                tGroup.add(vent);
            }
        }

        super(gameArea, {
            type: 'cannon',
            range: 4,
            damage: 25,
            fireRate: 0.8,
            baseCost: 200,
            upgradeCost: 150,
            color: 0xffa502,
            baseGeo: baseGeo,
            turretGeo: new THREE.BoxGeometry(0.01, 0.01, 0.01)
        });

        this.turretGroup.remove(this.turretMesh);
        this.turretMesh = tGroup;
        this.turretGroup.add(tGroup);

        // Keep references for upgrade
        this._white = white;
        this._accent = accent;
        this._plateMat = plateMat;
        this._mainBarrel = mainBarrel;
        this._secondBarrel = null;
        this._shieldPlate = null;
    }

    onUpgradeVisual(level) {
        const tGroup = this.turretMesh;

        if (level === 2) {
            // ★ Level 2: Add second barrel
            const barrelGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.4, 12);
            
            // Move existing barrel to left
            this._mainBarrel.position.x = -0.18;
            
            // Add second barrel on right
            this._secondBarrel = new THREE.Mesh(barrelGeo, this._white);
            this._secondBarrel.rotation.x = Math.PI / 2;
            this._secondBarrel.position.set(0.18, 0.35, 0.75);
            this._secondBarrel.castShadow = true;
            tGroup.add(this._secondBarrel);

            // Second muzzle ring
            const muzzle2 = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 16), this._accent);
            muzzle2.position.set(0.18, 0.35, 1.45);
            tGroup.add(muzzle2);

            // Update existing muzzle position
            tGroup.children.forEach(c => {
                if (c.geometry && c.geometry.type === 'TorusGeometry' && c.position.x === 0 && c.position.z > 1) {
                    c.position.x = -0.18;
                }
            });

            console.log(`[${this.id}] Upgraded to TWIN BARRELS!`);
        }

        if (level === 3) {
            // ★ Level 3: Add front shield plate + thicker barrels
            this._shieldPlate = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 0.5, 0.06),
                this._plateMat
            );
            this._shieldPlate.position.set(0, 0.35, 0.2);
            tGroup.add(this._shieldPlate);

            // Make barrels thicker
            if (this._mainBarrel) this._mainBarrel.scale.set(1.3, 1, 1.3);
            if (this._secondBarrel) this._secondBarrel.scale.set(1.3, 1, 1.3);

            console.log(`[${this.id}] Upgraded with ARMOR SHIELD!`);
        }

        if (level >= 4) {
            // ★ Level 4+: Glow boost on each upgrade
            tGroup.traverse(n => {
                if (n.material && n.material.emissive) {
                    n.material.emissiveIntensity = Math.min(4, 1.5 + (level - 3) * 0.5);
                }
            });
            tGroup.scale.multiplyScalar(1.03);
        }
    }

    shoot(scene) {
        if (!this.target) return;

        const targetPos = this.target.group.position;
        const splashRadius = 2.5 + (this.level * 0.3);

        for (let enemy of scene.enemies) {
            if (enemy.isDead) continue;
            let dist = enemy.group.position.distanceTo(targetPos);
            if (dist <= splashRadius) {
                enemy.takeDamage(this.damage);
            }
        }

        this.drawProjectile(scene, targetPos);
    }

    drawProjectile(scene, targetPos) {
        const exp = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffa502, transparent: true, opacity: 0.7 })
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
