import { LANE_DEFINITIONS } from '../data/LaneDefinitions.js';

const COLLISION_RADIUS = 0.8;

function isObstacle(obj) {
    return obj?.definitionId && obj.group && !obj.score;
}

function isCollectible(obj) {
    return obj?.score != null && obj.group && !obj.collected;
}

export class CollisionSystem {
    constructor() {
        this.scene = null;
    }

    setContext(scene) {
        this.scene = scene;
    }

    _distance(a, b) {
        const ax = a?.position?.x ?? a?.group?.position?.x ?? 0;
        const az = a?.position?.z ?? a?.group?.position?.z ?? 0;
        const bx = b?.position?.x ?? b?.group?.position?.x ?? 0;
        const bz = b?.position?.z ?? b?.group?.position?.z ?? 0;
        return Math.hypot(ax - bx, az - bz);
    }

    update(delta, time, context) {
        this.scene ??= context?.scene;
        if (!this.scene?.runState?.isAlive || this.scene.runState.isPaused) return;

        const player = this.scene.player;
        if (!player?.group) return;

        const px = player.group.position.x;
        const pz = player.group.position.z;

        for (const obj of this.scene.objects) {
            if (!obj.group || obj === player) continue;

            const dist = this._distance(player, obj);
            if (dist > COLLISION_RADIUS + 1) continue;

            if (isCollectible(obj)) {
                obj.collected = true;
                this.scene.runState.score += obj.score ?? 10;
                this.scene.threeScene.remove(obj.group);
                const idx = this.scene.objects.indexOf(obj);
                if (idx >= 0) this.scene.objects.splice(idx, 1);
            } else if (isObstacle(obj)) {
                this.scene.flowController?.gameOver?.();
            }
        }
    }
}
