/**
 * WaveSystem — Manages wave-based spawning logic and difficulty scaling.
 */
export class WaveSystem {
    /**
     * @param {object} scene The game scene
     * @param {Array} paths Available spawn paths (points or splines)
     * @param {object} options Configuration for spawning
     */
    constructor(scene, paths = [], options = {}) {
        this.scene = scene;
        this.paths = paths;
        this.wave = options.startWave || 1;
        this.spawning = false;
        this.enemiesLeftToSpawn = 0;
        this.spawnTimer = 0;
        this.spawnInterval = options.spawnInterval || 1.0;
        this.waveData = null;
        this.enemyRegistry = options.enemyRegistry || {}; // Map of { typeKey: EnemyClass }
        this.tierLogic = options.tierLogic || this._defaultTierLogic;
    }

    /**
     * Start a new wave.
     * @param {number} difficultyMultiplier Base difficulty multiplier
     */
    startWave(difficultyMultiplier = 1) {
        if (this.spawning) return;
        this.spawning = true;
        
        // Scale enemy count and interval by wave number
        this.enemiesLeftToSpawn = 5 + Math.floor((this.wave - 1) * 2.5);
        this.spawnInterval = Math.max(0.4, 1.5 - (this.wave * 0.1));
        
        this.waveData = {
            hpMod: difficultyMultiplier * (1 + (this.wave - 1) * 0.5),
            speedMod: 1 + ((this.wave - 1) * 0.05)
        };

        if (this.scene.events) {
            this.scene.events.emit('wave:started', { wave: this.wave, count: this.enemiesLeftToSpawn });
        }
    }

    _defaultTierLogic(wave) {
        // Simple logic if no registry is provided, or as a template
        // Returns a key from the registry
        const keys = Object.keys(this.enemyRegistry);
        if (keys.length === 0) return null;
        
        const roll = Math.random();
        // Just pick a random one if no complex logic is provided
        return keys[Math.floor(roll * keys.length)];
    }

    update(delta) {
        if (!this.spawning) return;

        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0 && this.enemiesLeftToSpawn > 0) {
            this.spawnTimer = this.spawnInterval;
            this.enemiesLeftToSpawn--;

            const typeKey = this.tierLogic(this.wave);
            const EnemyClass = this.enemyRegistry[typeKey];

            if (EnemyClass && this.paths.length > 0) {
                const chosenPath = this.paths[Math.floor(Math.random() * this.paths.length)];
                const enemy = new EnemyClass(this.scene, chosenPath);

                // Apply dynamic buffs
                if (enemy.maxHp !== undefined) {
                    enemy.maxHp *= this.waveData.hpMod;
                    enemy.hp = enemy.maxHp;
                }
                if (enemy.speed !== undefined) {
                    enemy.speed *= this.waveData.speedMod;
                }

                // Scene should implement spawnEnemy
                if (typeof this.scene.spawnEnemy === 'function') {
                    this.scene.spawnEnemy(enemy);
                } else if (this.scene.addObject) {
                    this.scene.addObject(enemy);
                }
            }

            if (this.enemiesLeftToSpawn <= 0) {
                const currentWave = this.wave;
                this.spawning = false;
                this.wave++;
                
                if (this.scene.events) {
                    this.scene.events.emit('wave:ended', { wave: currentWave });
                }
                if (typeof this.scene.onWaveEnded === 'function') {
                    this.scene.onWaveEnded(currentWave);
                }
            }
        }
    }
}
