import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createHumanoid } from '../utils/HumanoidBuilder.js';

const FAST_WEAPONS = ['sword', 'spear', 'shield'];

export class FastEnemy extends Enemy {
    constructor(scene, waypoints) {
        // Ninja like, very vibrant and unique random colors
        const randHue = Math.random();
        const colorHex = new THREE.Color().setHSL(randHue, 0.9, 0.55).getHex();
        const headColor = new THREE.Color().setHSL((randHue + 0.5) % 1.0, 0.6, 0.5).getHex();
        const wpn = FAST_WEAPONS[Math.floor(Math.random() * FAST_WEAPONS.length)];

        super(scene, {
            speed: 4,
            hp: 60,
            reward: 10,
            damage: 8,
            color: colorHex,
            waypoints: waypoints,
            mesh: createHumanoid(colorHex, headColor, true, wpn)
        });
        
        // Thinner, faster scale
        this.mesh.scale.set(0.5, 0.7, 0.5);
    }
}

