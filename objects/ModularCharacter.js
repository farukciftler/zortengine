import * as THREE from 'three';
import { GameObject } from './GameObject.js';
import { StateMachine } from '../utils/StateMachine.js';

export class ModularCharacter extends GameObject {
    constructor(scene, x, z, options = {}) {
        super(scene, x, z, options.radius || 0.6);
        
        this.scale = options.scale || 1.0;
        this.colorSuit = options.colorSuit || 0x2980b9;
        this.colorSkin = options.colorSkin || 0xffe4c4;
        
        // Physics / Movement base properties
        this.yVelocity = 0;
        this.isGrounded = true;
        this.speed = options.speed || 8;
        
        // Slot attachment points
        this.slots = {
            rightHand: null,
            leftHand: null,
            head: null,
            back: null
        };
        
        // Create mesh hierarchy
        this.buildMesh();

        // Initialize State Machine
        this.fsm = new StateMachine();
        this._setupStates();
        this.fsm.setState('idle');
    }

    _setupStates() {
        this.fsm.addState('idle', {
            onEnter: () => this.resetPose(),
            onUpdate: (delta, time) => {
                this.limbs.torso.position.y = Math.sin(time * 2) * 0.02;
                this.limbs.rightArm.rotation.z = Math.sin(time * 2) * 0.02 + 0.1;
                this.limbs.leftArm.rotation.z = -Math.sin(time * 2) * 0.02 - 0.1;
            }
        });

        this.fsm.addState('walk', {
            onUpdate: (delta, time) => {
                const speed = 15; // Animation speed multiplier
                this.limbs.leftLeg.rotation.x = Math.sin(time * speed) * 0.6;
                this.limbs.rightLeg.rotation.x = Math.sin(time * speed + Math.PI) * 0.6;
                this.limbs.leftArm.rotation.x = Math.sin(time * speed + Math.PI) * 0.5;
                this.limbs.rightArm.rotation.x = Math.sin(time * speed) * 0.5;
                
                this.limbs.torso.rotation.y = Math.sin(time * speed) * 0.1;
                this.limbs.torso.position.y = Math.abs(Math.sin(time * speed)) * 0.05;
                this.limbs.head.rotation.y = Math.sin(time * speed + Math.PI / 2) * 0.05;
            }
        });
    }

    // Called automatically if added to engine.objects
    update(delta, time) {
        super.update(delta, time);
        if (this.fsm) {
            this.fsm.update(delta, time);
        }
    }

    buildMesh() {
        this.group.scale.set(this.scale, this.scale, this.scale);
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.colorSkin });
        const clothMat = new THREE.MeshStandardMaterial({ color: this.colorSuit });

        this.limbs = {
            rightArm: new THREE.Group(),
            leftArm: new THREE.Group(),
            rightLeg: new THREE.Group(),
            leftLeg: new THREE.Group(),
            torso: new THREE.Group(),
            head: new THREE.Group()
        };

        // Torso
        const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), clothMat);
        torsoMesh.position.y = 1.05;
        torsoMesh.castShadow = true;
        this.limbs.torso.add(torsoMesh);

        // Head
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), bodyMat);
        headMesh.position.y = 1.6;
        headMesh.castShadow = true;
        this.limbs.head.add(headMesh);

        // Limbs geometry
        const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        const legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);

        const ra = new THREE.Mesh(armGeo, clothMat); ra.position.y = -0.3; ra.castShadow = true; this.limbs.rightArm.add(ra);
        const la = new THREE.Mesh(armGeo, clothMat); la.position.y = -0.3; la.castShadow = true; this.limbs.leftArm.add(la);
        const rl = new THREE.Mesh(legGeo, clothMat); rl.position.y = -0.35; rl.castShadow = true; this.limbs.rightLeg.add(rl);
        const ll = new THREE.Mesh(legGeo, clothMat); ll.position.y = -0.35; ll.castShadow = true; this.limbs.leftLeg.add(ll);

        // Position limbs relative to center
        this.limbs.rightArm.position.set(-0.35, 1.3, 0);
        this.limbs.leftArm.position.set(0.35, 1.3, 0);
        this.limbs.rightLeg.position.set(-0.15, 0.7, 0);
        this.limbs.leftLeg.position.set(0.15, 0.7, 0);

        this.group.add(
            this.limbs.rightArm, 
            this.limbs.leftArm, 
            this.limbs.rightLeg, 
            this.limbs.leftLeg, 
            this.limbs.torso, 
            this.limbs.head
        );
    }

    equip(slotName, meshObject) {
        if (!this.slots.hasOwnProperty(slotName)) {
            console.warn(`Slot ${slotName} does not exist on ModularCharacter.`);
            return;
        }
        
        this.unequip(slotName);
        
        let parentGroup;
        if (slotName === 'rightHand') parentGroup = this.limbs.rightArm;
        else if (slotName === 'leftHand') parentGroup = this.limbs.leftArm;
        else if (slotName === 'head') parentGroup = this.limbs.head;
        else if (slotName === 'back') parentGroup = this.limbs.torso;
        
        if (parentGroup && meshObject) {
            parentGroup.add(meshObject);
            this.slots[slotName] = meshObject;
        }
    }

    unequip(slotName) {
        const item = this.slots[slotName];
        if (item) {
            let parentGroup;
            if (slotName === 'rightHand') parentGroup = this.limbs.rightArm;
            else if (slotName === 'leftHand') parentGroup = this.limbs.leftArm;
            else if (slotName === 'head') parentGroup = this.limbs.head;
            else if (slotName === 'back') parentGroup = this.limbs.torso;
            
            if (parentGroup) {
                parentGroup.remove(item);
            }
            this.slots[slotName] = null;
        }
    }

    resetPose() {
        this.limbs.leftLeg.rotation.x = 0; 
        this.limbs.rightLeg.rotation.x = 0; 
        this.limbs.leftArm.rotation.x = 0; 
        this.limbs.rightArm.rotation.x = 0;
        this.limbs.leftArm.rotation.z = 0;
        this.limbs.rightArm.rotation.z = 0;
        this.limbs.torso.rotation.y = 0; 
        this.limbs.torso.position.y = 0; 
        this.limbs.head.rotation.y = 0;
    }
}
