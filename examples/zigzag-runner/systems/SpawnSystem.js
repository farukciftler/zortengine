import { ObstacleActor } from '../actors/ObstacleActor.js';
import { ZigzagCollectibleActor } from '../actors/CollectibleActor.js';
import { LANE_DEFINITIONS } from '../data/LaneDefinitions.js';
import { TRACK_CONFIG } from '../data/TrackConfig.js';
import { OBSTACLE_DEFINITIONS } from '../data/ObstacleDefinitions.js';
import { COLLECTIBLE_DEFINITIONS } from '../data/CollectibleDefinitions.js';

export class SpawnSystem {
    constructor() {
        this.scene = null;
        this.lastSpawnZ = TRACK_CONFIG.SPAWN_DISTANCE_AHEAD;
        this.spawnAccumulator = 0;
    }

    setContext(scene) {
        this.scene = scene;
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
        if (!this.scene) return;
        const rng = this.scene.rng?.float?.(0, 1) ?? Math.random();
        const lanePositions = LANE_DEFINITIONS.LANE_POSITIONS;
        const laneCount = LANE_DEFINITIONS.LANE_COUNT
        const lane = Math.floor((rng * laneCount) % laneCount);

        if (rng < 0.6) {
            const def = this._pickWeighted(OBSTACLE_DEFINITIONS);
            const obj = new ObstacleActor(def.id, lane, this.lastSpawnZ, lanePositions);
            this.scene.threeScene.add(obj.group);
            this.scene.objects.push(obj);
        } else {
            const def = this._pickWeighted(COLLECTIBLE_DEFINITIONS);
            const obj = new ZigzagCollectibleActor(def.id, lane, this.lastSpawnZ, lanePositions);
            this.scene.threeScene.add(obj.group);
            this.scene.objects.push(obj);
        }
        this.lastSpawnZ += TRACK_CONFIG.SPAWN_INTERVAL * 3;
    }

    update(delta, time, context) {
        this.scene ??= context?.scene;
        if (!this.scene?.runState?.isAlive || this.scene.runState.isPaused) return;

        const playerZ = this.scene.player?.group?.position?.z ?? 0;
        const speed = this.scene.runState?.speed ?? TRACK_CONFIG.BASE_SPEED;

        this.spawnAccumulator += delta;
        if (this.spawnAccumulator >= TRACK_CONFIG.SPAWN_INTERVAL) {
            this.spawnAccumulator = 0;
            this.lastSpawnZ = Math.max(this.lastSpawnZ, playerZ + TRACK_CONFIG.SPAWN_DISTANCE_AHEAD);
            this._spawn();
        }

        for (const obj of [...this.scene.objects]) {
            if (obj.group && obj !== this.scene.player) {
                obj.group.position.z -= speed * delta;
                if (obj.group.position.z < playerZ - 15) {
                    this.scene.threeScene.remove(obj.group);
                    const idx = this.scene.objects.indexOf(obj);
                    if (idx >= 0) this.scene.objects.splice(idx, 1);
                }
            }
        }
    }
}
