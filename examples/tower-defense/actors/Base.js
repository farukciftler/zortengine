import { GameObject } from 'zortengine';

export class BaseEntity extends GameObject {
    constructor(scene, totalHp) {
        super(scene, 'player-base');
        this.hp = totalHp;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.scene.events.emit('base:destroyed');
        }
        this.scene.events.emit('base:dmg', this.hp);
    }
}
