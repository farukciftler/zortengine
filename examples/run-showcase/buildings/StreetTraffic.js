import * as THREE from 'three';
import { createDetailedCarGroup, LANE_DEFS, STREET_Z_HALF, lanePairAlternate } from './StreetLayout.js';

const CAR_LENGTH = 4.4;
const MIN_FOLLOW = 8;
const LANE_CHANGE_SPEED = 2.2;
const BLOCK_BEFORE_OVERTAKE = 1.4;
const LANE_WIDTH_MATCH = 2.3;
/** Oyuncu yarıçapı (yol üzerinde engel) */
const PLAYER_BLOCK_RADIUS = 0.55;
/** Fizik kutusu: genişlik, yükseklik, uzunluk */
const CAR_PHYS_W = 1.9;
const CAR_PHYS_H = 1.05;
const CAR_PHYS_L = 4.35;
const CAR_PHYS_Y = 0.52;

function laneIndexForX(x, dir) {
    let best = -1;
    let bestD = 999;
    for (let i = 0; i < LANE_DEFS.length; i++) {
        const d = LANE_DEFS[i];
        if (d.dir !== dir) continue;
        const dx = Math.abs(d.x - x);
        if (dx < bestD) {
            bestD = dx;
            best = i;
        }
    }
    return best;
}

/**
 * 4 şerit: iki +Z, iki −Z. Öndeki araç + yol üzerindeki oyuncu için durma; arkadan çarpışma yok.
 */
export class StreetTrafficManager {
    /**
     * @param {THREE.Scene} scene
     * @param {THREE.Object3D[]} environmentMeshes
     * @param {{ physics?: import('zortengine/physics').PhysicsManager; propMaterial?: object }} [options]
     */
    constructor(scene, environmentMeshes, options = {}) {
        this.scene = scene;
        this.environmentMeshes = environmentMeshes;
        this.physics = options.physics || null;
        this.propMaterial = options.propMaterial || null;
        this._quat = new THREE.Quaternion();
        this.cars = [];
        this._spawn();
    }

    _spawn() {
        const CAR_COLORS = [
            0xc0392b, 0x2980b9, 0x7f8c8d, 0xd35400, 0x8e44ad, 0x16a085,
            0x2c3e50, 0xf39c12, 0x1abc9c, 0x95a5a6
        ];
        const n = 10;
        const halfL = CAR_LENGTH * 0.5;

        for (let i = 0; i < n; i++) {
            const def = LANE_DEFS[i % LANE_DEFS.length];
            const group = createDetailedCarGroup(CAR_COLORS[i % CAR_COLORS.length]);
            const z0 = -STREET_Z_HALF + 12 + ((i * 17) % (STREET_Z_HALF * 2 - 26));
            group.position.set(def.x, 0.02, z0);
            group.rotation.y = def.dir > 0 ? 0 : Math.PI;
            this.scene.add(group);
            group.traverse(ch => {
                if (ch.isMesh) this.environmentMeshes.push(ch);
            });

            const blinkMat = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xff8800,
                emissiveIntensity: 0.9
            });
            const blinkGeo = new THREE.BoxGeometry(0.12, 0.06, 0.04);
            const blinkL = new THREE.Mesh(blinkGeo, blinkMat);
            const blinkR = blinkL.clone();
            blinkL.position.set(-0.95, 0.55, -2.0);
            blinkR.position.set(0.95, 0.55, -2.0);
            blinkL.visible = false;
            blinkR.visible = false;
            group.add(blinkL, blinkR);

            /** Kinematik olmayan statik kutu — her karede mesh ile senkron */
            let physicsBody = null;
            if (this.physics) {
                const euler = new THREE.Euler(0, group.rotation.y, 0);
                this._quat.setFromEuler(euler);
                physicsBody = this.physics.createBox(
                    CAR_PHYS_W,
                    CAR_PHYS_H,
                    CAR_PHYS_L,
                    0,
                    { x: group.position.x, y: CAR_PHYS_Y, z: group.position.z },
                    this._quat,
                    {
                        material: this.propMaterial,
                        collisionFilterGroup: 1,
                        collisionFilterMask: -1
                    }
                );
                this.physics.addBody(physicsBody, null);
            }

            this.cars.push({
                mesh: group,
                dir: def.dir,
                speed: 5 + (i % 4) * 1.8,
                maxSpeed: 6.2 + (i % 5) * 1.4,
                blocked: 0,
                targetLaneX: def.x,
                laneChangeDir: 0,
                blinkL,
                blinkR,
                physicsBody,
                halfLen: halfL
            });
        }
    }

    /**
     * Fizik adımından önce çağrılmalı (mesh konumu güncel olsun).
     * @param {number} delta
     * @param {{ x: number; z: number } | import('three').Vector3 | null} playerPos
     */
    update(delta, playerPos) {
        const cars = this.cars;
        const px = playerPos?.x;
        const pz = playerPos?.z;
        const usePlayer = px !== undefined && pz !== undefined && !Number.isNaN(px) && !Number.isNaN(pz);

        for (const car of cars) {
            const m = car.mesh;
            const myX = m.position.x;
            const myZ = m.position.z;
            const half = car.halfLen;

            let minGap = 999;
            let leadSpeed = car.maxSpeed;

            for (const o of cars) {
                if (o === car) continue;
                if (Math.abs(o.mesh.position.x - myX) > LANE_WIDTH_MATCH) continue;
                if (o.dir !== car.dir) continue;
                const oz = o.mesh.position.z;
                const dz = (oz - myZ) * car.dir;
                if (dz <= 0.1) continue;
                const gap = dz - CAR_LENGTH;
                if (gap < minGap) {
                    minGap = gap;
                    leadSpeed = o.speed;
                }
            }

            if (usePlayer) {
                const pg = this._gapToPlayer(car, px, pz, half);
                if (pg < minGap) {
                    minGap = pg;
                    leadSpeed = 0;
                }
            }

            if (minGap < MIN_FOLLOW) {
                car.blocked += delta;
                const cap = Math.max(0, (minGap - 1) * 0.85);
                car.speed = Math.min(car.speed, Math.min(leadSpeed, cap));
                if (car.speed < 0.15) car.speed = 0;
            } else {
                car.blocked = 0;
                car.speed = Math.min(car.maxSpeed, car.speed + 2.8 * delta);
            }

            if (car.blocked > BLOCK_BEFORE_OVERTAKE && minGap < MIN_FOLLOW - 0.5) {
                const idx = laneIndexForX(car.targetLaneX, car.dir);
                if (idx >= 0) {
                    const alt = lanePairAlternate(idx);
                    if (alt != null) {
                        const altX = LANE_DEFS[alt].x;
                        if (this._laneChangeClear(car, altX, myZ)) {
                            car.targetLaneX = altX;
                            car.laneChangeDir = Math.sign(altX - myX) || 1;
                            car.blocked = 0;
                        }
                    }
                }
            }

            const dx = car.targetLaneX - myX;
            if (Math.abs(dx) > 0.04) {
                m.position.x += Math.sign(dx) * Math.min(Math.abs(dx), LANE_CHANGE_SPEED * delta);
                const right = car.laneChangeDir > 0;
                car.blinkL.visible = !right;
                car.blinkR.visible = right;
            } else {
                m.position.x = car.targetLaneX;
                car.blinkL.visible = false;
                car.blinkR.visible = false;
                car.laneChangeDir = 0;
            }

            m.position.z += car.dir * car.speed * delta;
            const zMin = -STREET_Z_HALF;
            const zMax = STREET_Z_HALF;
            if (m.position.z > zMax) m.position.z = zMin + 4;
            if (m.position.z < zMin) m.position.z = zMax - 4;
        }

        this.syncCarPhysics();
    }

    /**
     * @param {typeof this.cars[0]} car
     * @param {number} px
     * @param {number} pz
     * @param {number} half
     */
    _gapToPlayer(car, px, pz, half) {
        const m = car.mesh.position;
        const myX = m.x;
        const myZ = m.z;
        const pr = PLAYER_BLOCK_RADIUS;

        if (Math.abs(px - myX) > LANE_WIDTH_MATCH + 1.1) return 999;

        if (car.dir > 0) {
            if (pz < myZ - half) return 999;
            return pz - myZ - half - pr;
        }
        if (pz > myZ + half) return 999;
        return myZ - half - pr - pz;
    }

    syncCarPhysics() {
        if (!this.physics) return;
        for (const car of this.cars) {
            const b = car.physicsBody;
            if (!b) continue;
            const m = car.mesh;
            b.position.set(m.position.x, CAR_PHYS_Y, m.position.z);
            this._quat.setFromEuler(new THREE.Euler(0, m.rotation.y, 0));
            b.quaternion.set(
                this._quat.x,
                this._quat.y,
                this._quat.z,
                this._quat.w
            );
        }
    }

    /**
     * @param {typeof this.cars[0]} car
     * @param {number} targetX
     * @param {number} myZ
     */
    _laneChangeClear(car, targetX, myZ) {
        for (const o of this.cars) {
            if (o === car) continue;
            if (Math.abs(o.mesh.position.x - targetX) > LANE_WIDTH_MATCH) continue;
            const dz = Math.abs(o.mesh.position.z - myZ);
            if (dz < CAR_LENGTH * 2.2) return false;
        }
        return true;
    }
}
