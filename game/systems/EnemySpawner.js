import { EnemyActor } from '../actors/EnemyActor.js';

export class EnemySpawner {
    constructor(options = {}) {
        this.scene = options.scene;
        this.player = options.player;
        this.enemyFactory = options.enemyFactory || ((spawnPoint, enemyOptions) => {
            return new EnemyActor(null, spawnPoint.x, spawnPoint.z, this.player, enemyOptions);
        });
    }

    spawn(spawnPoint, enemyOptions = {}) {
        const enemy = this.enemyFactory(spawnPoint, enemyOptions);
        if (this.scene && enemy) {
            this.scene.add(enemy);
        }
        return enemy;
    }
}
