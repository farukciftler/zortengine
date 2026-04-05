import { ModularCharacter } from 'zortengine/gameplay';
import * as THREE from 'three';

/**
 * Player Actor - Using the ModularCharacter structure requested from RunShowcase.
 */
export class Player extends ModularCharacter {
    constructor() {
        super(null, 0, 0, {
            colorSuit: 0xe74c3c, // Match run-showcase red
            colorSkin: 0xffe4c4,
            scale: 1.0
        });
        this.speed = 55;
        this.mass = 2.5;
    }

    update(delta, time) {
        // Ensure FSM and basic GameObject updates
        super.update(delta, time);

        const input = this.sceneController?.getSystem('input');
        if (!input) return;

        // Use the same movement mapping as RunShowcase for consistency
        const move = input.getMovementVector();

        if (move.x !== 0 || move.z !== 0) {
            // Convert input to move direction
            const moveDir = new THREE.Vector3(move.x, 0, move.z).normalize();

            // Apply Physical Velocity (Higher priority than manual position)
            if (this.body) {
                this.body.velocity.x = moveDir.x * this.speed;
                this.body.velocity.z = moveDir.z * this.speed;
                this.body.wakeUp(); // Just in case it slept
            }

            // Rotation (Visual only since body is fixedRotation)
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRotation, 0.1);

            // Set animation state
            if (this.fsm && this.fsm.currentState !== 'walk') {
                this.fsm.setState('walk');
            }
        } else {
            // Stop movement
            if (this.body) {
                this.body.velocity.x = 0;
                this.body.velocity.z = 0;
            }

            // Return to idle
            if (this.fsm && this.fsm.currentState !== 'idle') {
                this.fsm.setState('idle');
            }
        }

        // Constraints - handled by physics mostly, but we can clamp if needed
        // this.group.position.x = Math.max(-4.5, Math.min(4.5, this.group.position.x));
    }
}
