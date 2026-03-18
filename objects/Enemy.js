import * as THREE from 'three';
import { GameObject } from './GameObject.js';
import { StateMachine } from '../utils/StateMachine.js';

export class Enemy extends GameObject {
    constructor(scene, x, z, playerTarget) {
        super(scene, x, z, 1.0);
        this.player = playerTarget;
        this.speed = 3.5;
        this.attackRange = 2.0;
        this.chaseRange = 15.0;

        this.buildMesh();

        // Yapay Zeka (AI) Durum Makinesi
        this.fsm = new StateMachine();
        this._setupAI();
        this.fsm.setState('idle');
    }

    buildMesh() {
        // Basit mor bir düşman küpü
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x8e44ad });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.y = 0.5;
        this.mesh.castShadow = true;
        this.group.add(this.mesh);
    }

    _setupAI() {
        this.fsm.addState('idle', {
            onUpdate: () => {
                this.mesh.rotation.y += 0.02; // Beklerken yavaşça dön (Radar gibi)
                
                // Oyuncu menzile girdiyse kovalamaya başla
                if (this.distanceToPlayer() < this.chaseRange) {
                    this.fsm.setState('chase');
                }
            }
        });

        this.fsm.addState('chase', {
            onEnter: () => {
                this.mesh.material.color.setHex(0xe74c3c); // Kızgın (Kırmızı) ol
            },
            onUpdate: (delta) => {
                const dist = this.distanceToPlayer();

                // Çok uzaklaşırsa kovalamayı bırak
                if (dist > this.chaseRange) {
                    this.fsm.setState('idle');
                    return;
                }

                // Yeterince yakınsa saldır
                if (dist <= this.attackRange) {
                    this.fsm.setState('attack');
                    return;
                }

                // Oyuncuya doğru hareket et
                const dir = new THREE.Vector3().subVectors(this.player.group.position, this.group.position).normalize();
                this.group.position.addScaledVector(dir, this.speed * delta);
                
                // Oyuncuya bak
                this.group.lookAt(this.player.group.position);
            },
            onExit: () => {
                this.mesh.material.color.setHex(0x8e44ad); // Normale dön
            }
        });

        this.fsm.addState('attack', {
            onEnter: () => {
                // Saldırı animasyonu efekti (Şişme)
                this.mesh.scale.set(1.5, 1.5, 1.5);
                this.attackTimer = 0;
            },
            onUpdate: (delta) => {
                this.attackTimer += delta;
                if (this.attackTimer > 0.5) {
                    // Saldırı bitti, oyuncu hala yakındaysa tekrar saldır, yoksa kovala
                    if (this.distanceToPlayer() > this.attackRange) {
                        this.fsm.setState('chase');
                    } else {
                        this.attackTimer = 0; // Tekrar vur
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

    update(delta, time) {
        this.fsm.update(delta, time);
        
        // Nefes alma efekti
        if (this.fsm.getCurrentState() !== 'attack') {
            this.mesh.scale.y = 1 + Math.sin(time * 5) * 0.1;
        }
    }
}