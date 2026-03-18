export class CollectibleSystem {
    constructor(options = {}) {
        this.collector = options.collector || options.player || null;
        this.getCollectibles = options.getCollectibles || options.getPickups || (() => []);
        this.onCollect = options.onCollect || options.onPickup || null;
    }

    update() {
        if (!this.collector) return;

        const collectibles = this.getCollectibles() || [];
        for (const collectible of collectibles) {
            if (!collectible || collectible.isDestroyed) continue;
            if (this.collector.collidesWith(collectible)) {
                collectible.isDestroyed = true;
                if (typeof this.onCollect === 'function') {
                    this.onCollect(collectible);
                }
            }
        }
    }
}
