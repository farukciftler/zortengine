import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { createHumanoid } from '../utils/HumanoidBuilder.js';

export class TankEnemy extends Enemy {
    constructor(scene, waypoints) {
        // Big heavy juggernaut, deep saturated tones with brighter armor
        const randHue = Math.random();
        const colorHex = new THREE.Color().setHSL(randHue, 0.6, 0.45).getHex();
        const headColor = new THREE.Color().setHSL((randHue + 0.3) % 1.0, 0.5, 0.5).getHex();
        const tankWeapon = Math.random() > 0.5 ? 'hammer' : 'axe';

        super(scene, {
            speed: 1.2,
            hp: 400,
            reward: 25,
            damage: 30,
            color: colorHex,
            waypoints: waypoints,
            mesh: createHumanoid(colorHex, headColor, true, tankWeapon)
        });
        // Big heavy tank
        this.mesh.scale.set(1.4, 1.5, 1.4);
    }
}
