import * as THREE from 'three';
import { Component } from 'zortengine';

const ISO_FORWARD = new THREE.Vector3(-1, 0, -1).normalize();
const ISO_RIGHT = new THREE.Vector3(1, 0, -1).normalize();

export class PlayerMovementController extends Component {
    constructor(options = {}) {
        super();
        this.input = options.input;
        this.body = options.body;
        this.physics = options.physics || null;
        this.particleManager = options.particleManager;
        this.cameraManager = options.cameraManager || null;
        this.speed = options.speed || 12;
        this.mode = options.mode || 'isometric';
        this.jumpVelocity = options.jumpVelocity || 9;
        this.jumpCooldown = options.jumpCooldown || 0.15;
        this.jumpRequested = false;
        this.jumpCooldownTimer = 0;
        this._jumpListener = () => {
            this.jumpRequested = true;
        };
    }

    onAttach(owner) {
        super.onAttach(owner);

        if (this.input) {
            this.input.on('jump', this._jumpListener);
        }
    }

    onDetach() {
        if (this.input) {
            this.input.off('jump', this._jumpListener);
        }

        super.onDetach();
    }

    update(delta = 1 / 60) {
        if (!this.owner || !this.input || !this.body) return;

        if (this.jumpCooldownTimer > 0) {
            this.jumpCooldownTimer = Math.max(0, this.jumpCooldownTimer - delta);
        }

        const isGrounded = this.physics
            ? this.physics.isBodyGrounded(this.body, 0.18)
            : false;

        if (this.jumpRequested && isGrounded && this.jumpCooldownTimer <= 0) {
            this.body.velocity.y = this.jumpVelocity;
            this.jumpCooldownTimer = this.jumpCooldown;
        }

        this.jumpRequested = false;

        const move = this.input.getMovementVector();
        const moveDir = this.mode === 'tps'
            ? this._getThirdPersonMoveDirection(move)
            : this._getIsometricMoveDirection(move);

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

    setMode(mode) {
        this.mode = mode;
    }

    _getIsometricMoveDirection(move) {
        const moveDir = new THREE.Vector3();

        if (move.z !== 0) {
            moveDir.addScaledVector(ISO_FORWARD, -move.z);
        }

        if (move.x !== 0) {
            moveDir.addScaledVector(ISO_RIGHT, move.x);
        }

        return moveDir;
    }

    _getThirdPersonMoveDirection(move) {
        const moveDir = new THREE.Vector3();
        const camera = this.cameraManager?.getThreeCamera();
        if (!camera) return moveDir;

        const camForward = new THREE.Vector3();
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        camForward.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

        if (move.z !== 0) {
            moveDir.addScaledVector(camForward, -move.z);
        }

        if (move.x !== 0) {
            moveDir.addScaledVector(camRight, move.x);
        }

        return moveDir;
    }
}
