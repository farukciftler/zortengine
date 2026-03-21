import { FastEnemy } from '../enemies/FastEnemy.js';
import { TankEnemy } from '../enemies/TankEnemy.js';

export class WaveSystem {
    constructor(scene, waypoints) {
        this.scene = scene;
        this.waypoints = waypoints;
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
            
            // Random chance for tank vs fast vs normal. Since we only have fast/tank:
            let isTank = Math.random() < Math.min(0.6, this.wave * 0.05);
            let Type = isTank ? TankEnemy : FastEnemy;
            
            let enemy = new Type(this.scene, this.waypoints);
            
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
