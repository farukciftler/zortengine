import * as THREE from 'three';
import { CityKit } from './CityKit.js';

/**
 * TrafficSystem — Manages autonomous vehicle agents on a defined lane system.
 */
export class TrafficSystem {
    constructor(options = {}) {
        this.context = null;
        this.cars = [];
        this.laneDefs = options.laneDefs || [
            { x: -6.75, dir: 1 },
            { x: -2.25, dir: 1 },
            { x: 2.25, dir: -1 },
            { x: 6.75, dir: -1 }
        ];
        this.streetZHalf = options.streetZHalf || 70;
        this.carCount = options.carCount || 10;
        this.minFollowDistance = options.minFollowDistance || 8;
        this.laneChangeSpeed = options.laneChangeSpeed || 2.5;
        
        this.carColors = [
            0xc0392b, 0x2980b9, 0x7f8c8d, 0xd35400, 0x8e44ad, 
            0x16a085, 0x2c3e50, 0xf39c12, 0x1abc9c, 0x95a5a6
        ];
    }

    onAttach(context) {
        this.context = context;
        this._spawn();
    }

    _spawn() {
        const scene = this.context.scene.getRenderScene();
        for (let i = 0; i < this.carCount; i++) {
            const laneIndex = i % this.laneDefs.length;
            const def = this.laneDefs[laneIndex];
            const color = this.carColors[i % this.carColors.length];
            const mesh = CityKit.createVehicleMesh(color);
            
            // Random distribution
            const z = -this.streetZHalf + (i * (this.streetZHalf * 2 / this.carCount));
            mesh.position.set(def.x, 0.02, z);
            mesh.rotation.y = def.dir > 0 ? 0 : Math.PI;
            scene.add(mesh);

            this.cars.push({
                mesh,
                dir: def.dir,
                speed: 5 + Math.random() * 2,
                maxSpeed: 7 + Math.random() * 3,
                targetLaneX: def.x,
                blocked: 0,
                halfLen: 2.2
            });
        }
    }

    update(delta) {
        const playerPos = this.context.scene.player?.position || this.context.scene.player?.group?.position;
        
        for (const car of this.cars) {
            const m = car.mesh;
            const myX = m.position.x;
            const myZ = m.position.z;

            let minGap = 999;
            let leadSpeed = car.maxSpeed;

            // Check other cars for gaps
            for (const o of this.cars) {
                if (o === car) continue;
                if (Math.abs(o.mesh.position.x - myX) > 2) continue;
                if (o.dir !== car.dir) continue;
                
                const oz = o.mesh.position.z;
                const dz = (oz - myZ) * car.dir;
                if (dz <= 0.1) continue;
                
                const gap = dz - 4.5;
                if (gap < minGap) {
                    minGap = gap;
                    leadSpeed = o.speed;
                }
            }

            // Simple obstacle avoidance for player
            if (playerPos) {
                const dz = (playerPos.z - myZ) * car.dir;
                if (Math.abs(playerPos.x - myX) < 2.5 && dz > 0 && dz < 15) {
                    const gap = dz - 1.5;
                    if (gap < minGap) {
                        minGap = gap;
                        leadSpeed = 0;
                    }
                }
            }

            // Adjust speed
            if (minGap < this.minFollowDistance) {
                const cap = Math.max(0, (minGap - 1) * 0.8);
                car.speed = Math.min(car.speed, Math.min(leadSpeed, cap));
            } else {
                car.speed = Math.min(car.maxSpeed, car.speed + 3 * delta);
            }

            // Move the car
            m.position.z += car.dir * car.speed * delta;

            // Loop around world
            if (m.position.z > this.streetZHalf) m.position.z = -this.streetZHalf;
            if (m.position.z < -this.streetZHalf) m.position.z = this.streetZHalf;
            
            // Lateral movement for lane changes (simple version)
            const dx = car.targetLaneX - m.position.x;
            if (Math.abs(dx) > 0.05) {
                m.position.x += Math.sign(dx) * this.laneChangeSpeed * delta;
            } else {
                m.position.x = car.targetLaneX;
            }
        }
    }
}
