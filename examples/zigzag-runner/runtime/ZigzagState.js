export class ZigzagState {
    constructor(options = {}) {
        this.seed = options.seed || 'zigzag';
        this.laneCount = options.laneCount ?? 3;
        this.currentLane = Math.floor(this.laneCount / 2);
        this.score = 0;
        this.distance = 0;
        this.speed = options.baseSpeed ?? 8;
        this.isAlive = true;
        this.isPaused = false;
    }

    serialize() {
        return {
            seed: this.seed,
            laneCount: this.laneCount,
            currentLane: this.currentLane,
            score: this.score,
            distance: this.distance,
            speed: this.speed,
            isAlive: this.isAlive
        };
    }

    static restore(data) {
        const state = new ZigzagState({ seed: data.seed, laneCount: data.laneCount });
        state.currentLane = data.currentLane ?? state.currentLane;
        state.score = data.score ?? 0;
        state.distance = data.distance ?? 0;
        state.speed = data.speed ?? state.speed;
        state.isAlive = data.isAlive ?? true;
        return state;
    }
}
