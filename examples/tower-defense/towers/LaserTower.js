import * as THREE from 'three';
import { Tower } from './Tower.js';

export class LaserTower extends Tower {
    constructor(gameArea) {
        // ──── Materials ────
        const white = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, metalness: 0.85, roughness: 0.08 });
        const accent = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff4757, emissiveIntensity: 1.8 });
        const glass = new THREE.MeshStandardMaterial({
            color: 0xffffff, emissive: 0xff4757, emissiveIntensity: 0.6,
            transparent: true, opacity: 0.5, metalness: 1.0, roughness: 0.0
        });

        // ──── Base ────
        const baseGeo = new THREE.CylinderGeometry(0.85, 1.0, 0.35, 8);

        // ──── Turret Assembly ────
        const tGroup = new THREE.Group();

        // Pedestal ring
        const pedGeo = new THREE.TorusGeometry(0.65, 0.06, 8, 32);
        const pedestal = new THREE.Mesh(pedGeo, white);
        pedestal.rotation.x = Math.PI / 2;
        pedestal.position.y = 0.15;
        tGroup.add(pedestal);

        // Central column (slim cylinder)
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.8, 8), white);
        col.position.y = 1.5;
        col.castShadow = true;
        tGroup.add(col);

        // 4 vertical fin supports
        const finGeo = new THREE.BoxGeometry(0.04, 2.2, 0.25);
        for (let i = 0; i < 4; i++) {
            const a = (Math.PI / 2) * i + Math.PI / 4;
            const fin = new THREE.Mesh(finGeo, white);
            fin.position.set(Math.cos(a) * 0.3, 1.3, Math.sin(a) * 0.3);
            fin.rotation.y = a;
            fin.castShadow = true;
            tGroup.add(fin);
        }

        // 3 floating halo rings at different heights
        for (let i = 0; i < 3; i++) {
            const r = new THREE.Mesh(
                new THREE.TorusGeometry(0.45 - i * 0.06, 0.02, 8, 48),
                accent
            );
            r.rotation.x = Math.PI / 2;
            r.position.y = 1.6 + i * 0.6;
            r.userData.haloRing = true;
            tGroup.add(r);
        }

        // Glass energy capsule near the top
        const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.5, 8, 16), glass);
        capsule.position.y = 2.5;
        tGroup.add(capsule);

        // Top emitter sphere
        const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), accent);
        emitter.position.y = 3.1;
        tGroup.add(emitter);

        // ──── Super ────
        super(gameArea, {
            type: 'laser',
            range: 5,
            damage: 3,
            fireRate: 0.15,
            baseCost: 120,
            color: 0xff4757,
            baseGeo: baseGeo,
            turretGeo: new THREE.BoxGeometry(0.01, 0.01, 0.01)
        });

        // Swap default turret for our custom group
        this.turretGroup.remove(this.turretMesh);
        this.turretMesh = tGroup;
        this.turretGroup.add(tGroup);

        this.gameArea = gameArea;

        // Keep material references for upgrades
        this._accent = accent;
        this._white = white;

        // Collect glow parts
        this.glowParts = [];
        tGroup.traverse(n => { if (n.material && n.material.emissive) this.glowParts.push(n); });

        // ──── Laser Beam (thin!) ────
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xff4757, transparent: true, opacity: 0.7 });
        this.laserBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), laserMat);
        this.gameArea.threeScene.add(this.laserBeam);
        this.laserBeam.visible = false;

        // Impact flare (small)
        const flareMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        this.flare = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), flareMat);
        this.gameArea.threeScene.add(this.flare);
        this.flare.visible = false;

        this.laserTimeout = null;
    }

    onUpgradeVisual(level) {
        const tGroup = this.turretMesh;

        if (level === 2) {
            // ★ Level 2: Add 4 amplifier fins around column
            const finGeo = new THREE.BoxGeometry(0.5, 0.06, 0.08);
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i;
                const fin = new THREE.Mesh(finGeo, this._white);
                fin.position.set(Math.cos(a) * 0.15, 2.5, Math.sin(a) * 0.15);
                fin.rotation.y = a;
                tGroup.add(fin);
            }
            console.log(`[${this.id}] Upgraded: AMPLIFIER FINS`);
        }

        if (level === 3) {
            // ★ Level 3: Second emitter orb + extra halo
            const emitter2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), this._accent);
            emitter2.position.y = 2.85;
            tGroup.add(emitter2);

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.55, 0.025, 8, 48),
                this._accent
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 2.9;
            ring.userData.haloRing = true;
            tGroup.add(ring);

            // Refresh glow parts
            this.glowParts = [];
            tGroup.traverse(n => { if (n.material && n.material.emissive) this.glowParts.push(n); });

            console.log(`[${this.id}] Upgraded: DUAL EMITTER`);
        }

        if (level >= 4) {
            // ★ Level 4+: Glow boost
            this.glowParts.forEach(n => {
                n.material.emissiveIntensity = Math.min(5, 1.8 + (level - 3) * 0.6);
            });
            tGroup.scale.multiplyScalar(1.03);
        }
    }

    onUpdate(delta, time) {
        super.onUpdate(delta, time);

        // Energy pulse
        if (this.glowParts) {
            this.glowParts.forEach(n => {
                n.material.emissiveIntensity = 1.2 + Math.sin(time * 8) * 0.8;
            });
        }

        // Spin halo rings
        if (this.turretMesh) {
            this.turretMesh.children.forEach(c => {
                if (c.userData && c.userData.haloRing) {
                    c.rotation.z = time * 1.5 + c.position.y; // staggered
                }
            });
        }
    }

    shoot(scene) {
        if (!this.target) return;

        const start = new THREE.Vector3();
        this.turretGroup.getWorldPosition(start);
        start.y += 3.1; // fire from emitter

        const end = new THREE.Vector3();
        this.target.group.getWorldPosition(end);
        end.y += 0.5;

        const dist = start.distanceTo(end);
        const thickness = 0.04 + this.level * 0.01;
        this.laserBeam.scale.set(thickness / 0.04, dist, thickness / 0.04);
        this.laserBeam.position.lerpVectors(start, end, 0.5);
        this.laserBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());

        this.laserBeam.visible = true;
        this.flare.position.copy(end);
        this.flare.rotation.set(Math.random() * 6, Math.random() * 6, 0);
        this.flare.scale.setScalar(0.3 + Math.random() * 0.3);
        this.flare.visible = true;

        if (this.laserTimeout) clearTimeout(this.laserTimeout);
        this.laserTimeout = setTimeout(() => {
            this.laserBeam.visible = false;
            this.flare.visible = false;
        }, 120);

        // Burn line
        const line = new THREE.Line3(start, end);
        const radiusSq = 1.5 * 1.5;

        this.target.takeDamage(this.damage);

        // Impact Sparks
        if (this.gameArea.createImpactSparks) {
            this.gameArea.createImpactSparks(end.clone(), 0xff4757);
        }

        for (let enemy of scene.enemies) {
            if (enemy === this.target || enemy.isDead) continue;
            let closest = new THREE.Vector3();
            line.closestPointToPoint(enemy.group.position, true, closest);
            if (closest.distanceToSquared(enemy.group.position) <= radiusSq) {
                enemy.takeDamage(this.damage * 0.6);
            }
        }
    }

    onRemove() {
        if (this.laserBeam) this.gameArea.threeScene.remove(this.laserBeam);
        if (this.flare) this.gameArea.threeScene.remove(this.flare);
    }
}
