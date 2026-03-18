import { HealthComponent, ModularCharacter } from 'zortengine';

export class PlayerActor extends ModularCharacter {
    constructor(scene, x, z, options = {}) {
        super(scene, x, z, options);

        this.maxHp = options.maxHp ?? 100;
        this.hp = options.hp ?? this.maxHp;

        this.addComponent('health', new HealthComponent({
            maxHealth: this.maxHp,
            health: this.hp,
            onDamage: () => {
                const health = this.getComponent('health');
                this.hp = health.health;
                this.flashColor(0xffc7c7, 120);
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
