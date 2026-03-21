import { FastEnemy } from '../enemies/FastEnemy.js';
import { TankEnemy } from '../enemies/TankEnemy.js';

export class WaveSystem {
    constructor(scene, paths) {
        this.scene = scene;
        this.paths = paths; // Array of multiple waypoint arrays
        this.wave = 1;
        this.spawning = false;
        this.enemiesLeftToSpawn = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1.0;
        this.waveData = null;
    }
    
    startWave(multiplier = 1) {
        if (this.spawning) return; // Wait until done
        this.spawning = true;
        this.enemiesLeftToSpawn = 5 + Math.floor((this.wave - 1) * 2.5);
        this.spawnInterval = Math.max(0.4, 1.5 - (this.wave * 0.08));
        this.waveData = {
            hpMod: multiplier * (1 + (this.wave - 1) * 0.4),
            speedMod: 1 + ((this.wave - 1) * 0.02)
        };
    }
    
    update(delta) {
        if (!this.spawning) return;
        
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0 && this.enemiesLeftToSpawn > 0) {
            this.spawnTimer = this.spawnInterval;
            this.enemiesLeftToSpawn--;
            
            let isTank = Math.random() < Math.min(0.6, this.wave * 0.05);
            let Type = isTank ? TankEnemy : FastEnemy;
            
            // Randomly pick one of the available paths for this base level
            let chosenPath = this.paths[Math.floor(Math.random() * this.paths.length)];
            let enemy = new Type(this.scene, chosenPath);
            
            // Apply buffs
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
