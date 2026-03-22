import { FastEnemy } from '../enemies/FastEnemy.js';
import { TankEnemy } from '../enemies/TankEnemy.js';
import { DroneEnemy } from '../enemies/DroneEnemy.js';
import { SpiderEnemy } from '../enemies/SpiderEnemy.js';
import { GolemEnemy } from '../enemies/GolemEnemy.js';

/**
 * Wave composition by difficulty tier:
 * Wave 1-2:  FastEnemy only (intro)
 * Wave 3-4:  FastEnemy + DroneEnemy (aerial threat)
 * Wave 5-6:  FastEnemy + DroneEnemy + SpiderEnemy (crawlers appear)
 * Wave 7-8:  All types + TankEnemy (heavy ground)
 * Wave 9-10: All types + GolemEnemy boss units
 */

export class WaveSystem {
    constructor(scene, paths) {
        this.scene = scene;
        this.paths = paths;
        this.wave = 1;
        this.spawning = false;
        this.enemiesLeftToSpawn = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1.0;
        this.waveData = null;
    }
    
    startWave(multiplier = 1) {
        if (this.spawning) return;
        this.spawning = true;
        this.enemiesLeftToSpawn = 6 + Math.floor((this.wave - 1) * 3);
        this.spawnInterval = Math.max(0.35, 1.3 - (this.wave * 0.08));
        this.waveData = {
            hpMod: multiplier * (1 + (this.wave - 1) * 0.55),
            speedMod: 1 + ((this.wave - 1) * 0.03)
        };
    }

    _pickEnemyType() {
        const w = this.wave;
        const roll = Math.random();

        if (w <= 2) {
            // Only fast enemies
            return FastEnemy;
        } else if (w <= 4) {
            // Fast + Drones
            if (roll < 0.4) return DroneEnemy;
            return FastEnemy;
        } else if (w <= 6) {
            // Fast + Drone + Spider
            if (roll < 0.25) return DroneEnemy;
            if (roll < 0.5) return SpiderEnemy;
            return FastEnemy;
        } else if (w <= 8) {
            // All + Tanks
            if (roll < 0.15) return DroneEnemy;
            if (roll < 0.35) return SpiderEnemy;
            if (roll < 0.55) return TankEnemy;
            return FastEnemy;
        } else {
            // Endgame: All + Golem bosses
            if (roll < 0.1) return GolemEnemy;
            if (roll < 0.25) return DroneEnemy;
            if (roll < 0.45) return SpiderEnemy;
            if (roll < 0.65) return TankEnemy;
            return FastEnemy;
        }
    }
    
    update(delta) {
        if (!this.spawning) return;
        
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0 && this.enemiesLeftToSpawn > 0) {
            this.spawnTimer = this.spawnInterval;
            this.enemiesLeftToSpawn--;
            
            const Type = this._pickEnemyType();
            
            // Randomly pick one of the available paths
            let chosenPath = this.paths[Math.floor(Math.random() * this.paths.length)];
            let enemy = new Type(this.scene, chosenPath);
            
            // Apply wave difficulty buffs
            enemy.maxHp *= this.waveData.hpMod;
            enemy.hp = enemy.maxHp;
            enemy.speed *= this.waveData.speedMod;
            
            this.scene.spawnEnemy(enemy);
            
            if (this.enemiesLeftToSpawn <= 0) {
                this.spawning = false;
                this.wave++;
                this.scene.onWaveEnded();
            }
        }
    }
}
