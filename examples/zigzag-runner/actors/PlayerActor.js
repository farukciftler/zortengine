import * as THREE from 'three';
import { LANE_DEFINITIONS } from '../data/LaneDefinitions.js';

const JUMP_VELOCITY = 7;
const GRAVITY = -20;

export class PlayerActor {
    constructor(scene, physics, input) {
        this.sceneRef = scene;
        this.physics = physics;
        this.input = input;
        this.targetLane = Math.floor(LANE_DEFINITIONS.LANE_COUNT / 2);
        this.currentLane = this.targetLane;
        this.laneLerp = 1;
        this.laneSpeed = 8;
        this.vy = 0;
        this._jumpListener = () => { this.jumpRequested = true; };
        this.jumpRequested = false;

        if (input) input.on('jump', this._jumpListener);

        this.group = new THREE.Group();
        this.group.position.set(
            LANE_DEFINITIONS.LANE_POSITIONS[this.currentLane],
            0,
            0
        );

        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.y = 0.5;
        this.group.add(this.mesh);
    }

    attachToScene(sceneOrHandle, sceneController) {
        const scene = sceneOrHandle?.getNativeScene?.() ?? sceneOrHandle;
        if (scene?.add) scene.add(this.group);
    }

    detachFromScene(sceneOrHandle) {
        const scene = sceneOrHandle?.getNativeScene?.() ?? sceneOrHandle;
        if (scene?.remove) scene.remove(this.group);
        if (this.input) this.input.off('jump', this._jumpListener);
    }

    getLaneX() {
        return LANE_DEFINITIONS.LANE_POSITIONS[this.currentLane];
    }

    setTargetLane(lane) {
        const clamped = Math.max(0, Math.min(LANE_DEFINITIONS.LANE_COUNT - 1, lane));
        if (clamped !== this.targetLane) {
            this.targetLane = clamped;
            this.laneLerp = 0;
        }
    }

    update(delta, time) {
        if (this.laneLerp < 1) {
            this.laneLerp = Math.min(1, this.laneLerp + this.laneSpeed * delta);
            const t = this.laneLerp * this.laneLerp * (3 - 2 * this.laneLerp);
            const from = LANE_DEFINITIONS.LANE_POSITIONS[this.currentLane];
            const to = LANE_DEFINITIONS.LANE_POSITIONS[this.targetLane];
            this.group.position.x = from + (to - from) * t;
            if (this.laneLerp >= 1) {
                this.currentLane = this.targetLane;
            }
        }

        const grounded = this.group.position.y <= 0;
        if (this.jumpRequested && grounded) {
            this.vy = JUMP_VELOCITY;
        }
        this.jumpRequested = false;

        this.vy += GRAVITY * delta;
        this.group.position.y += this.vy * delta;
        if (this.group.position.y <= 0) {
            this.group.position.y = 0;
            this.vy = 0;
        }
    }

    serialize() {
        return {
            type: 'PlayerActor',
            position: {
                x: this.group.position.x,
                y: this.group.position.y,
                z: this.group.position.z
            },
            currentLane: this.currentLane,
            targetLane: this.targetLane
        };
    }
}
