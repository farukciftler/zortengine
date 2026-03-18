import { Enemy, HealthComponent } from 'zortengine';

export class EnemyActor extends Enemy {
    constructor(scene, x, z, playerTarget, options = {}) {
        super(scene, x, z, playerTarget);

        this.maxHp = options.maxHp ?? 100;
        this.hp = options.hp ?? this.maxHp;

        this.addComponent('health', new HealthComponent({
            maxHealth: this.maxHp,
            health: this.hp,
            onDamage: () => {
                const health = this.getComponent('health');
                this.hp = health.health;
                this.flashColor(0xff8cc6, 120);
            },
            onHeal: () => {
                const health = this.getComponent('health');
                this.hp = health.health;
            },
            onDeath: () => {
                this.isDestroyed = true;
            }
        }));
    }
}
