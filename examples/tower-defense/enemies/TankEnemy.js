import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createHumanoid } from '../utils/HumanoidBuilder.js';

export class TankEnemy extends Enemy {
    constructor(scene, waypoints) {
        // Big heavy juggernaut, dark random saturated tones
        const randHue = Math.random();
        const colorHex = new THREE.Color().setHSL(randHue, 0.6, 0.35).getHex();
        
        super(scene, {
            speed: 1.5,
            hp: 300,
            reward: 35,
            damage: 25,
            color: colorHex,
            waypoints: waypoints,
            mesh: createHumanoid(colorHex, 0x111111, false) 
        });
        // Big heavy tank
        this.mesh.scale.set(1.4, 1.5, 1.4);
    }
}
