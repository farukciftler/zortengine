import * as THREE from 'three';
import { ObstacleActor } from '../actors/ObstacleActor.js';
import { ZigzagCollectibleActor } from '../actors/CollectibleActor.js';
import { LANE_DEFINITIONS } from '../data/LaneDefinitions.js';
import { TRACK_CONFIG } from '../data/TrackConfig.js';
import { OBSTACLE_DEFINITIONS } from '../data/ObstacleDefinitions.js';
import { COLLECTIBLE_DEFINITIONS } from '../data/CollectibleDefinitions.js';

export class SpawnSystem {
    constructor() {
        this.scene = null;
        this.lastSpawnPathDistance = TRACK_CONFIG.SPAWN_DISTANCE_AHEAD;
        this.spawnAccumulator = 0;
        this.prefilled = false;
    }

    setContext(scene) {
        this.scene = scene;
    }

    _prefill() {
        if (!this.scene?.pathGenerator || this.prefilled) return;
        this.prefilled = true;
        const step = TRACK_CONFIG.SPAWN_INTERVAL * 3;
        const endDist = TRACK_CONFIG.SPAWN_DISTANCE_AHEAD;
        for (let d = step; d <= endDist; d += step) {
            this.lastSpawnPathDistance = d;
            this._spawn();
        }
    }

    _pickWeighted(defs) {
        const total = defs.reduce((s, d) => s + (d.weight ?? 1), 0);
        let r = (this.scene?.rng?.float?.(0, 1) ?? Math.random()) * total;
        for (const d of defs) {
            r -= d.weight ?? 1;
            if (r <= 0) return d;
        }
        return defs[0];
    }

    _spawn() {
        if (!this.scene?.pathGenerator) return;
        const rand = () => this.scene?.rng?.float?.(0, 1) ?? Math.random();
        const lanePositions = LANE_DEFINITIONS.LANE_POSITIONS;
        const laneCount = LANE_DEFINITIONS.LANE_COUNT;
        const lane = Math.min(Math.floor(rand() * laneCount), laneCount - 1);
        const pathDistance = this.lastSpawnPathDistance;
        const pos = this.scene.pathGenerator.getPositionAtDistance(pathDistance, lanePositions[lane]);
        const info = this.scene.pathGenerator.getInfoAtDistance(pathDistance);

        const forward = new THREE.Vector3(0, 0, -1);
        const tangent = info.tangent.clone().normalize();
        const setPathRotation = (group) => {
            if (tangent.lengthSq() > 0.0001) {
                group.quaternion.setFromUnitVectors(forward, tangent);
            }
        };
        if (rand() < 0.6) {
            const def = this._pickWeighted(OBSTACLE_DEFINITIONS);
            const obj = new ObstacleActor(def.id, lane, pathDistance, this.scene);
            obj.group.position.set(pos.x, 0, pos.z);
            setPathRotation(obj.group);
            this.scene.threeScene.add(obj.group);
            this.scene.objects.push(obj);
        } else {
            const def = this._pickWeighted(COLLECTIBLE_DEFINITIONS);
            const obj = new ZigzagCollectibleActor(def.id, lane, pathDistance, this.scene);
            obj.group.position.set(pos.x, 0, pos.z);
            setPathRotation(obj.group);
            this.scene.threeScene.add(obj.group);
            this.scene.objects.push(obj);
        }
        this.lastSpawnPathDistance += TRACK_CONFIG.SPAWN_INTERVAL * 3;
    }

    update(delta, time, context) {
        this.scene ??= context?.scene;
        if (!this.scene?.runState?.isAlive || this.scene.runState.isPaused) return;

        this._prefill();

        const playerDistance = this.scene.runState?.distance ?? 0;
        const speed = this.scene.runState?.speed ?? TRACK_CONFIG.BASE_SPEED;

        this.spawnAccumulator += delta;
        if (this.spawnAccumulator >= TRACK_CONFIG.SPAWN_INTERVAL) {
            this.spawnAccumulator = 0;
            this.lastSpawnPathDistance = Math.max(this.lastSpawnPathDistance, playerDistance + TRACK_CONFIG.SPAWN_DISTANCE_AHEAD);
            this._spawn();
        }

        for (const obj of [...this.scene.objects]) {
            if (obj.group && obj !== this.scene.player && obj.pathDistance != null) {
                if (obj.pathDistance < playerDistance - 15) {
                    this.scene.threeScene.remove(obj.group);
                    const idx = this.scene.objects.indexOf(obj);
                    if (idx >= 0) this.scene.objects.splice(idx, 1);
                }
            }
        }
    }
}
