import * as THREE from 'three';
import { Tower } from './Tower.js';

export class SlowTower extends Tower {
    constructor(gameArea) {
        // ──── Materials ────
        const white = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, metalness: 0.85, roughness: 0.08 });
        const iceGlow = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x1e90ff, emissiveIntensity: 2.0 });
        const glass = new THREE.MeshStandardMaterial({
            color: 0xcaf0f8, emissive: 0x00b4d8, emissiveIntensity: 0.3,
            transparent: true, opacity: 0.4, metalness: 0.9, roughness: 0.0
        });

        // ──── Base ────
        const baseGeo = new THREE.CylinderGeometry(0.85, 1.0, 0.35, 6);

        // ──── Turret Assembly ────
        const tGroup = new THREE.Group();

        // Hexagonal pedestal
        const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.3, 6), white);
        ped.position.y = 0.1;
        ped.castShadow = true;
        tGroup.add(ped);

        // Central antenna mast
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.0, 6), white);
        mast.position.y = 1.2;
        mast.castShadow = true;
        tGroup.add(mast);

        // 3 angled struts 
        for (let i = 0; i < 3; i++) {
            const a = (Math.PI * 2 / 3) * i;
            const strut = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.04, 1.2, 6),
                white
            );
            strut.position.set(Math.cos(a) * 0.3, 0.8, Math.sin(a) * 0.3);
            strut.rotation.z = Math.cos(a) * 0.3;
            strut.rotation.x = Math.sin(a) * 0.3;
            tGroup.add(strut);
        }

        // Dish / Emitter Disc at top
        const dish = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.35, 0.12, 16),
            white
        );
        dish.position.y = 2.1;
        dish.castShadow = true;
        tGroup.add(dish);

        // Glow ring around dish
        const dishRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.03, 8, 32),
            iceGlow
        );
        dishRing.rotation.x = Math.PI / 2;
        dishRing.position.y = 2.1;
        tGroup.add(dishRing);

        // Central energy orb above dish
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), iceGlow);
        orb.position.y = 2.4;
        tGroup.add(orb);

        super(gameArea, {
            type: 'slow',
            range: 5,
            damage: 2,
            fireRate: 1.0,
            baseCost: 150,
            upgradeCost: 100,
            color: 0x1e90ff,
            baseGeo: baseGeo,
            turretGeo: new THREE.BoxGeometry(0.01, 0.01, 0.01)
        });

        this.turretGroup.remove(this.turretMesh);
        this.turretMesh = tGroup;
        this.turretGroup.add(tGroup);

        // References
        this._white = white;
        this._iceGlow = iceGlow;
        this._glass = glass;
        this._orb = orb;
        this._dish = dish;
        this._dishRing = dishRing;
        this._extraRings = [];
    }

    onUpgradeVisual(level) {
        const tGroup = this.turretMesh;

        if (level === 2) {
            // ★ Level 2: Add glass capsule shield around orb + bigger orb
            this._orb.scale.setScalar(1.5);

            const capsule = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 16, 16),
                this._glass
            );
            capsule.position.y = 2.4;
            tGroup.add(capsule);

            // Add a second orbit ring
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.4, 0.02, 8, 48),
                this._iceGlow
            );
            ring.position.y = 2.4;
            ring.userData.orbitRing = true;
            tGroup.add(ring);
            this._extraRings.push(ring);

            console.log(`[${this.id}] Upgraded: FROST CAPSULE`);
        }

        if (level === 3) {
            // ★ Level 3: Dish gets bigger + second dish layer + more rings
            this._dish.scale.set(1.3, 1, 1.3);
            this._dishRing.scale.setScalar(1.3);

            // Second dish plate underneath
            const dish2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.45, 0.3, 0.1, 16),
                this._white
            );
            dish2.position.y = 1.95;
            dish2.castShadow = true;
            tGroup.add(dish2);

            const ring2 = new THREE.Mesh(
                new THREE.TorusGeometry(0.55, 0.02, 8, 48),
                this._iceGlow
            );
            ring2.position.y = 2.4;
            ring2.userData.orbitRing = true;
            tGroup.add(ring2);
            this._extraRings.push(ring2);

            console.log(`[${this.id}] Upgraded: DUAL DISH`);
        }

        if (level >= 4) {
            // ★ Level 4+: Intensify glow
            tGroup.traverse(n => {
                if (n.material && n.material.emissive) {
                    n.material.emissiveIntensity = Math.min(5, 2.0 + (level - 3) * 0.6);
                }
            });
            this._orb.scale.multiplyScalar(1.1);
        }
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

        this.drawProjectile(scene, targetPos);
    }

    drawProjectile(scene, targetPos) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.1, 0.4, 32),
            new THREE.MeshBasicMaterial({ color: 0x1e90ff, side: THREE.DoubleSide, transparent: true })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(targetPos);
        ring.position.y += 0.5;
        scene.threeScene.add(ring);

        let s = 1;
        const animate = () => {
            s += 0.3;
            ring.scale.setScalar(s);
            ring.material.opacity -= 0.05;
            if (ring.material.opacity <= 0) {
                scene.threeScene.remove(ring);
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    onUpdate(delta, time) {
        super.onUpdate(delta, time);

        // Pulse the orb
        if (this._orb) {
            this._orb.material.emissiveIntensity = 1.5 + Math.sin(time * 6) * 1.0;
        }

        // Orbit extra rings
        this._extraRings.forEach((ring, i) => {
            const speed = 2 + i * 0.8;
            ring.rotation.x = Math.sin(time * speed) * 0.8;
            ring.rotation.z = time * speed * 0.6;
        });
    }
}
