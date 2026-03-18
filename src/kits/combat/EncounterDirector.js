export class EncounterDirector {
    constructor(options = {}) {
        this.spawner = options.spawner;
        this.spawnPoints = options.spawnPoints || [];
        this.waves = options.waves || [];
        this.onWaveChanged = options.onWaveChanged || null;
        this.onEntitySpawned = options.onEntitySpawned || null;
        this.onEntityDefeated = options.onEntityDefeated || null;
        this.onCompleted = options.onCompleted || null;
        this.activeEntities = [];
        this.pendingSpawns = [];
        this.currentWaveIndex = -1;
        this.spawnTimer = 0;
        this.completed = false;
    }

    start() {
        this._startNextWave();
    }

    update(delta) {
        if (this.completed) return;

        this._syncActiveEntities();

        if (this.pendingSpawns.length > 0) {
            this.spawnTimer -= delta;
            if (this.spawnTimer <= 0) {
                this._spawnNextEntity();
            }
            return;
        }

        if (this.activeEntities.length === 0) {
            this._startNextWave();
        }
    }

    getLivingEntities() {
        this._syncActiveEntities();
        return this.activeEntities;
    }

    getAliveCount() {
        this._syncActiveEntities();
        return this.activeEntities.length;
    }

    getCurrentWaveNumber() {
        return this.currentWaveIndex + 1;
    }

    getTotalWaves() {
        return this.waves.length;
    }

    _startNextWave() {
        this.currentWaveIndex += 1;
        if (this.currentWaveIndex >= this.waves.length) {
            this.completed = true;
            if (typeof this.onCompleted === 'function') {
                this.onCompleted();
            }
            return;
        }

        const wave = this.waves[this.currentWaveIndex];
        this.pendingSpawns = this._buildSpawnQueue(wave);
        this.spawnTimer = 0;

        if (typeof this.onWaveChanged === 'function') {
            this.onWaveChanged({
                waveNumber: this.getCurrentWaveNumber(),
                totalWaves: this.getTotalWaves(),
                pendingCount: this.pendingSpawns.length
            });
        }
    }

    _buildSpawnQueue(wave) {
        const queue = [];
        const count = wave.count || 1;
        for (let i = 0; i < count; i++) {
            queue.push({
                spawnPoint: this.spawnPoints[i % this.spawnPoints.length],
                entityOptions: wave.entityOptions || wave.enemyOptions || {}
            });
        }
        return queue;
    }

    _spawnNextEntity() {
        const next = this.pendingSpawns.shift();
        if (!next) return;

        const entity = this.spawner.spawn(next.spawnPoint, next.entityOptions);
        if (entity) {
            this.activeEntities.push(entity);
            if (typeof this.onEntitySpawned === 'function') {
                this.onEntitySpawned(entity, this.getCurrentWaveNumber());
            }
        }

        const wave = this.waves[this.currentWaveIndex];
        this.spawnTimer = wave.spawnInterval ?? 0.6;
    }

    _syncActiveEntities() {
        const stillAlive = [];
        const defeated = [];
        for (const entity of this.activeEntities) {
            if (!entity || entity.isDestroyed) {
                defeated.push(entity);
                continue;
            }
            stillAlive.push(entity);
        }
        this.activeEntities = stillAlive;

        if (typeof this.onEntityDefeated === 'function') {
            for (const entity of defeated) {
                this.onEntityDefeated(entity, this.getCurrentWaveNumber());
            }
        }
    }
}
