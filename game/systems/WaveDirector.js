export class WaveDirector {
    constructor(options = {}) {
        this.spawner = options.spawner;
        this.spawnPoints = options.spawnPoints || [];
        this.waves = options.waves || [];
        this.onWaveChanged = options.onWaveChanged || null;
        this.onEnemySpawned = options.onEnemySpawned || null;
        this.onEnemyDefeated = options.onEnemyDefeated || null;
        this.onCompleted = options.onCompleted || null;
        this.activeEnemies = [];
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

        this._syncActiveEnemies();

        if (this.pendingSpawns.length > 0) {
            this.spawnTimer -= delta;
            if (this.spawnTimer <= 0) {
                this._spawnNextEnemy();
            }
            return;
        }

        if (this.activeEnemies.length === 0) {
            this._startNextWave();
        }
    }

    getLivingEnemies() {
        this._syncActiveEnemies();
        return this.activeEnemies;
    }

    getAliveCount() {
        this._syncActiveEnemies();
        return this.activeEnemies.length;
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
                enemyOptions: wave.enemyOptions || {}
            });
        }
        return queue;
    }

    _spawnNextEnemy() {
        const next = this.pendingSpawns.shift();
        if (!next) return;

        const enemy = this.spawner.spawn(next.spawnPoint, next.enemyOptions);
        if (enemy) {
            this.activeEnemies.push(enemy);
            if (typeof this.onEnemySpawned === 'function') {
                this.onEnemySpawned(enemy, this.getCurrentWaveNumber());
            }
        }

        const wave = this.waves[this.currentWaveIndex];
        this.spawnTimer = wave.spawnInterval ?? 0.6;
    }

    _syncActiveEnemies() {
        const stillAlive = [];
        const defeatedEnemies = [];
        for (const enemy of this.activeEnemies) {
            if (!enemy || enemy.isDestroyed) {
                defeatedEnemies.push(enemy);
                continue;
            }
            stillAlive.push(enemy);
        }
        this.activeEnemies = stillAlive;

        if (typeof this.onEnemyDefeated === 'function') {
            for (const enemy of defeatedEnemies) {
                this.onEnemyDefeated(enemy, this.getCurrentWaveNumber());
            }
        }
    }
}
