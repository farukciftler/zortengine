import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createHumanoid } from '../utils/HumanoidBuilder.js';

export class TankEnemy extends Enemy {
    constructor(scene, waypoints) {
        super(scene, {
            speed: 1.5,
            hp: 300,
            reward: 35,
            damage: 25,
            color: 0xaa00aa,
            waypoints: waypoints,
            mesh: createHumanoid(0x833471, 0x111111, false) // Big purple juggernaut, no sword, uses hands
        });
        // Big heavy tank
        this.mesh.scale.set(1.4, 1.5, 1.4);
    }
}
