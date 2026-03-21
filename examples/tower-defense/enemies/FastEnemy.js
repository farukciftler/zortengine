import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createHumanoid } from '../utils/HumanoidBuilder.js';

export class FastEnemy extends Enemy {
    constructor(scene, waypoints) {
        // Ninja like, very vibrant and unique random colors
        const randHue = Math.random();
        const colorHex = new THREE.Color().setHSL(randHue, 0.9, 0.55).getHex();
        const headColor = new THREE.Color().setHSL((randHue + 0.5) % 1.0, 0.5, 0.2).getHex();

        super(scene, {
            speed: 5.5,
            hp: 40,
            reward: 15,
            damage: 5,
            color: colorHex,
            waypoints: waypoints,
            mesh: createHumanoid(colorHex, headColor, true)
        });
        
        // Thinner, faster scale
        this.mesh.scale.set(0.5, 0.7, 0.5); 
    }
}
