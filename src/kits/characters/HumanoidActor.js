import * as THREE from 'three';
import { GameObject } from '../../engine/object/GameObject.js';
import { StateMachine } from '../status/StateMachine.js';

/**
 * HumanoidActor - A high-fidelty, modular character kit.
 * Provides a segmented body (Head, Torso, Arms, Legs) with built-in animation states.
 */
export class HumanoidActor extends GameObject {
    constructor(scene, x, z, options = {}) {
        super(scene, x, z, options.radius || 0.6);

        this.scale = options.scale || 1.0;
        this.colorSuit = options.colorSuit || 0x2c3e50;
        this.colorSkin = options.colorSkin || 0xffd3b6;
        this.colorDetail = options.colorDetail || 0x3498db;

        this.limbs = {};
        this.slots = {
            rightHand: null,
            leftHand: null,
            headTop: null,
            back: null
        };

        this._buildBody();
        this._setupAnimationFSM();
    }

    _buildBody() {
        this.group.scale.setScalar(this.scale);

        // Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: this.colorSkin, roughness: 0.8 });
        const suitMat = new THREE.MeshStandardMaterial({ color: this.colorSuit, roughness: 0.6, metalness: 0.2 });
        const detailMat = new THREE.MeshStandardMaterial({ color: this.colorDetail, emissive: this.colorDetail, emissiveIntensity: 0.2 });
        const darknessMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

        // Initial Limbs Group
        this.limbs = {
            torso: new THREE.Group(),
            head: new THREE.Group(),
            armL: new THREE.Group(),
            armR: new THREE.Group(),
            legL: new THREE.Group(),
            legR: new THREE.Group()
        };

        // Torso - Hexagonal/Cyber block
        const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), suitMat);
        torsoMesh.position.y = 1.05;
        torsoMesh.castShadow = true;
        this.limbs.torso.add(torsoMesh);

        // Chest detail (Reactor core)
        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), detailMat);
        core.rotation.x = Math.PI / 2;
        core.position.set(0, 1.15, 0.18);
        this.limbs.torso.add(core);

        // Head - Rounded Box / Helmet
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), skinMat);
        headMesh.position.y = 1.62;
        headMesh.castShadow = true;
        this.limbs.head.add(headMesh);

        // Visor/Eyes
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.05), darknessMat);
        visor.position.set(0, 1.68, 0.21);
        this.limbs.head.add(visor);

        // Limb Factory (Cylinders for joints)
        const createSegmentedLimb = (topW, botW, len, mat, pX, pY) => {
            const group = new THREE.Group();
            group.position.set(pX, pY, 0);
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topW, botW, len, 8), mat);
            mesh.position.y = -len / 2;
            mesh.castShadow = true;
            group.add(mesh);
            return group;
        };

        this.limbs.armL = createSegmentedLimb(0.1, 0.08, 0.7, suitMat, -0.4, 1.35);
        this.limbs.armR = createSegmentedLimb(0.1, 0.08, 0.7, suitMat, 0.4, 1.35);
        this.limbs.legL = createSegmentedLimb(0.14, 0.1, 0.75, suitMat, -0.18, 0.75);
        this.limbs.legR = createSegmentedLimb(0.14, 0.1, 0.75, suitMat, 0.18, 0.75);

        // Parent everything to the main group
        this.group.add(this.limbs.torso, this.limbs.head, this.limbs.armL, this.limbs.armR, this.limbs.legL, this.limbs.legR);
    }

    _setupAnimationFSM() {
        this.fsm = new StateMachine();

        this.fsm.addState('idle', {
            onUpdate: (delta, time) => {
                const breathing = Math.sin(time * 1.5) * 0.015;
                this.limbs.torso.position.y = breathing;
                this.limbs.head.position.y = breathing * 0.5;
                this.limbs.armL.rotation.z = Math.sin(time * 1.5) * 0.05 - 0.1;
                this.limbs.armR.rotation.z = -Math.sin(time * 1.5) * 0.05 + 0.1;
            }
        });

        this.fsm.addState('walk', {
            onUpdate: (delta, time) => {
                const s = 10; // Speed
                const range = 0.5;
                this.limbs.legL.rotation.x = Math.sin(time * s) * range;
                this.limbs.legR.rotation.x = Math.sin(time * s + Math.PI) * range;
                this.limbs.armL.rotation.x = Math.sin(time * s + Math.PI) * range * 0.8;
                this.limbs.armR.rotation.x = Math.sin(time * s) * range * 0.8;

                this.limbs.torso.position.y = Math.abs(Math.sin(time * s)) * 0.08;
                this.limbs.head.rotation.y = Math.sin(time * s) * 0.05;
            }
        });

        this.fsm.setState('idle');
    }

    update(delta, time) {
        super.update(delta, time);
        if (this.fsm) this.fsm.update(delta, time);
    }

    equip(slot, object) {
        if (!this.slots.hasOwnProperty(slot) || !object) return;
        this.unequip(slot);
        
        let anchor = this.limbs.torso; // default
        if (slot === 'rightHand') anchor = this.limbs.armR;
        if (slot === 'leftHand') anchor = this.limbs.armL;
        if (slot === 'headTop') anchor = this.limbs.head;

        anchor.add(object);
        this.slots[slot] = object;
    }

    unequip(slot) {
        const current = this.slots[slot];
        if (current) {
            current.parent.remove(current);
            this.slots[slot] = null;
        }
    }

    setAnimation(state) {
        this.fsm.setState(state);
    }
}
