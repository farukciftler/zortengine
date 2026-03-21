import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createHumanoid } from '../utils/HumanoidBuilder.js';

export class FastEnemy extends Enemy {
    constructor(scene, waypoints) {
        super(scene, {
            speed: 5.5,
            hp: 40,
            reward: 15,
            damage: 5,
            color: 0x00ff00,
            waypoints: waypoints,
            mesh: createHumanoid(0x1dd1a1, 0x222f3e, true) // Ninja like
        });
        
        // Thinner, faster scale
        this.mesh.scale.set(0.5, 0.7, 0.5); 
    }
}
