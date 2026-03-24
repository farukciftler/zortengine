import { ModularCharacter } from 'zortengine/gameplay';

/**
 * Oyuncu ile aynı modüler gövde; yürüme animasyonu daha yavaş (ağır tempo).
 */
export class SidewalkNpc extends ModularCharacter {
    constructor(scene, x, z, options = {}) {
        super(scene, x, z, options);
        this.walkAnimSpeed = options.walkAnimSpeed ?? 6.2;
        this._patchWalkState();
        this.fsm.setState('walk');
        this.fsm.setState('idle');
    }

    _patchWalkState() {
        const s = this.walkAnimSpeed;
        this.fsm.addState('walk', {
            onUpdate: (delta, time) => {
                this.limbs.leftLeg.rotation.x = Math.sin(time * s) * 0.6;
                this.limbs.rightLeg.rotation.x = Math.sin(time * s + Math.PI) * 0.6;
                this.limbs.leftArm.rotation.x = Math.sin(time * s + Math.PI) * 0.5;
                this.limbs.rightArm.rotation.x = Math.sin(time * s) * 0.5;
                this.limbs.torso.rotation.y = Math.sin(time * s) * 0.1;
                this.limbs.torso.position.y = Math.abs(Math.sin(time * s)) * 0.05;
                this.limbs.head.rotation.y = Math.sin(time * s + Math.PI / 2) * 0.05;
            }
        });

        this.fsm.addState('idle', {
            onEnter: () => this.resetPose(),
            onUpdate: (delta, time) => {
                const slow = 1.15;
                this.limbs.torso.position.y = Math.sin(time * slow) * 0.02;
                this.limbs.rightArm.rotation.z = Math.sin(time * slow) * 0.02 + 0.1;
                this.limbs.leftArm.rotation.z = -Math.sin(time * slow) * 0.02 - 0.1;
            }
        });
    }
}
