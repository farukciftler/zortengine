export class ObjectiveZoneSystem {
    constructor(options = {}) {
        this.actor = options.actor || options.gate || null;
        this.target = options.target || options.player || null;
        this.onEnter = options.onEnter || options.onExtract || null;
    }

    update() {
        if (!this.target || !this.actor || !this.actor.isActive) return;
        if (this.target.collidesWith(this.actor) && typeof this.onEnter === 'function') {
            this.onEnter(this.actor);
        }
    }
}
