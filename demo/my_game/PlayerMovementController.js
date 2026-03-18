import * as THREE from 'three';
import { Component } from 'zortengine';

const ISO_FORWARD = new THREE.Vector3(-1, 0, -1).normalize();
const ISO_RIGHT = new THREE.Vector3(1, 0, -1).normalize();

export class PlayerMovementController extends Component {
    constructor(options = {}) {
        super();
        this.input = options.input;
        this.body = options.body;
        this.particleManager = options.particleManager;
        this.speed = options.speed || 12;
    }

    update() {
        if (!this.owner || !this.input || !this.body) return;

        const move = this.input.getMovementVector();
        const moveDir = new THREE.Vector3();

        if (move.z !== 0) {
            moveDir.addScaledVector(ISO_FORWARD, -move.z);
        }

        if (move.x !== 0) {
            moveDir.addScaledVector(ISO_RIGHT, move.x);
        }

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
        }

        this.body.velocity.x = moveDir.x * this.speed;
        this.body.velocity.z = moveDir.z * this.speed;

        if (moveDir.lengthSq() > 0) {
            this.owner.group.rotation.y = Math.atan2(moveDir.x, moveDir.z);
            if (this.owner.fsm) {
                this.owner.fsm.setState('walk');
            }

            if (this.particleManager && Math.random() > 0.7) {
                this.particleManager.emit(
                    new THREE.Vector3(this.owner.group.position.x, 0.1, this.owner.group.position.z),
                    1,
                    { color: 0x7f8c8d, speed: 2, scale: 0.3, life: 0.5 }
                );
            }
        } else if (this.owner.fsm) {
            this.owner.fsm.setState('idle');
        }
    }
}
