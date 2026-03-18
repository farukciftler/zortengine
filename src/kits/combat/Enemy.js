import * as THREE from 'three';
import { GameObject } from '../../engine/object/GameObject.js';
import { StateMachine } from '../status/StateMachine.js';

export class Enemy extends GameObject {
    constructor(scene, x, z, playerTarget, options = {}) {
        super(scene, x, z, 1.0);
        this.player = playerTarget;
        this.profile = {
            color: options.color ?? 0x8e44ad,
            speed: options.speed ?? 3.5,
            attackRange: options.attackRange ?? 2.0,
            chaseRange: options.chaseRange ?? 15.0,
            attackDamage: options.attackDamage ?? 20,
            attackStyle: options.attackStyle || 'melee',
            supportHeal: options.supportHeal ?? 0,
            elite: options.elite ?? false,
            boss: options.boss ?? false
        };
        this.speed = this.profile.speed;
        this.attackRange = this.profile.attackRange;
        this.chaseRange = this.profile.chaseRange;
        this.attackDamage = this.profile.attackDamage;
        this.attackStyle = this.profile.attackStyle;
        this.supportHeal = this.profile.supportHeal;

        this.buildMesh(options);

        this.fsm = new StateMachine();
        this._setupAI();
        this.fsm.setState('idle');
    }

    buildMesh(options = {}) {
        const baseScale = this.profile.boss ? 1.7 : (this.profile.elite ? 1.25 : 1);
        const geo = this.attackStyle === 'ranged'
            ? new THREE.CylinderGeometry(0.45 * baseScale, 0.55 * baseScale, 1.2 * baseScale, 8)
            : new THREE.BoxGeometry(1 * baseScale, 1 * baseScale, 1 * baseScale);
        const mat = new THREE.MeshStandardMaterial({ color: this.profile.color });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.y = 0.5 * baseScale;
        this.mesh.castShadow = true;
        this.group.add(this.mesh);
    }

    _setupAI() {
        this.fsm.addState('idle', {
            onUpdate: () => {
                this.mesh.rotation.y += 0.02;

                if (this.distanceToPlayer() < this.chaseRange) {
                    this.fsm.setState('chase');
                }
            }
        });

        this.fsm.addState('chase', {
            onEnter: () => {
                this.mesh.material.color.setHex(this.profile.boss ? 0xffffff : 0xe74c3c);
            },
            onUpdate: (delta) => {
                const dist = this.distanceToPlayer();

                if (dist > this.chaseRange) {
                    this.fsm.setState('idle');
                    return;
                }

                if (dist <= this.attackRange) {
                    this.fsm.setState('attack');
                    return;
                }

                if (this.attackStyle === 'ranged' && dist <= this.attackRange * 1.4) {
                    this.fsm.setState('attack');
                    return;
                }

                const dir = new THREE.Vector3().subVectors(this.player.group.position, this.group.position).normalize();
                this.group.position.addScaledVector(dir, this.speed * delta);
                this.group.lookAt(this.player.group.position);
            },
            onExit: () => {
                this.mesh.material.color.setHex(0x8e44ad);
            }
        });

        this.fsm.addState('attack', {
            onEnter: () => {
                const attackScale = this.profile.boss ? 1.9 : (this.profile.elite ? 1.65 : 1.5);
                this.mesh.scale.set(attackScale, attackScale, attackScale);
                this.attackTimer = 0;
            },
            onUpdate: (delta) => {
                this.attackTimer += delta;
                if (this.attackTimer > 0.5) {
                    if (this.distanceToPlayer() > this.attackRange) {
                        this.fsm.setState('chase');
                    } else {
                        this.attackTimer = 0;
                    }
                }
            },
            onExit: () => {
                this.mesh.scale.set(1, 1, 1);
            }
        });
    }

    distanceToPlayer() {
        return this.group.position.distanceTo(this.player.group.position);
    }

    getAttackProfile() {
        return {
            damage: this.attackDamage,
            style: this.attackStyle,
            supportHeal: this.supportHeal,
            elite: this.profile.elite,
            boss: this.profile.boss
        };
    }

    update(delta, time) {
        super.update(delta, time);
        this.fsm.update(delta, time);

        if (this.fsm.getCurrentState() !== 'attack') {
            this.mesh.scale.y = 1 + Math.sin(time * 5) * 0.1;
        }
    }

    serialize() {
        return {
            ...super.serialize(),
            profile: { ...this.profile },
            attackProfile: this.getAttackProfile(),
            state: this.fsm.getCurrentState()
        };
    }
}
