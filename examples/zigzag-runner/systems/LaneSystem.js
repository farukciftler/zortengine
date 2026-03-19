import { LANE_DEFINITIONS } from '../data/LaneDefinitions.js';

export class LaneSystem {
    constructor() {
        this.player = null;
    }

    setPlayer(player) {
        this.player = player;
    }

    onAttach(context) {
        this.context = context;
        const input = context?.scene?.getSystem?.('input');
        if (!input) return;
        input.on('left', () => this.player?.setTargetLane?.((this.player.targetLane ?? 0) + 1));
        input.on('right', () => this.player?.setTargetLane?.((this.player.targetLane ?? 0) - 1));
    }

    update(delta, time, context) {
        // Lane switching is event-based only (input.on('left'/'right'))
    }
}
