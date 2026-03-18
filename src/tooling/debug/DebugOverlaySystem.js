export class DebugOverlaySystem {
    constructor(options = {}) {
        this.ui = options.ui || null;
        this.engine = null;
        this.lastFps = 0;
        this.sampler = 0;
        this.frames = 0;
    }

    onAttach(context) {
        this.engine = context?.engine || null;
        if (!this.ui) {
            this.ui = context?.scene?.getSystem?.('ui') || null;
        }
        this.ui?.addText?.('debugOverlay', 'DEBUG', 20, 260, {
            color: '#93c5fd',
            size: 14
        });
    }

    update(delta, time, context) {
        this.sampler += delta;
        this.frames += 1;
        if (this.sampler >= 0.25) {
            this.lastFps = Math.round(this.frames / this.sampler);
            this.sampler = 0;
            this.frames = 0;
        }

        const physics = context?.scene?.getSystem?.('physics');
        const scene = context?.scene;
        const stats = this.engine?.getSimulationStats?.() || {};
        const text = [
            `DEBUG FPS:${this.lastFps}`,
            `TICK:${stats.tick ?? 0}`,
            `BODIES:${physics?.world?.bodies?.length ?? 0}`,
            `OBJECTS:${scene?.objects?.length ?? 0}`
        ].join(' | ');
        this.ui?.updateText?.('debugOverlay', text);
    }
}
