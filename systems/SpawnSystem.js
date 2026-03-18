export class SpawnSystem {
    constructor(options = {}) {
        this.scene = options.scene;
        this.spawnFactory = options.spawnFactory || null;
    }

    spawn(spawnPoint, entityOptions = {}) {
        if (!this.spawnFactory) return null;

        const entity = this.spawnFactory(spawnPoint, entityOptions);
        if (this.scene && entity) {
            this.scene.add(entity);
        }
        return entity;
    }
}
