import { System } from 'zortengine';

export class InteractionSystem extends System {
    constructor() {
        super();
        this.pushForce = 1.2;
    }

    onAttach(context) {
        this.scene = context.scene;
    }

    update(delta, time) {
        const scene = this.scene;
        const player = scene.player;
        if (!player) return;

        scene.objects.forEach(obj => {
            if (obj.isBlock) {
                const dist = player.group.position.distanceTo(obj.group.position);
                if (dist < 1.2) {
                    // Push block away from player
                    const dir = obj.group.position.clone().sub(player.group.position).normalize();
                    dir.y = 0; // Only horizontal push
                    
                    obj.group.position.add(dir.multiplyScalar(this.pushForce * delta));
                    
                    // Clamp to platform
                    obj.group.position.x = Math.max(-4.8, Math.min(4.8, obj.group.position.x));
                    obj.group.position.z = Math.max(-19.8, Math.min(19.8, obj.group.position.z));
                }
            }
        });
    }
}
