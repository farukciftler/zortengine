import * as THREE from 'three';
import { GameObject } from './GameObject.js';

export class CollectibleActor extends GameObject {
    constructor(scene, x, z, options = {}) {
        super(scene, x, z, options.radius || 0.8);
        this.type = options.type || 'essence';
        this.payload = options.payload || {};
        this.label = options.label || '';
        this.baseY = options.y ?? 0.8;
        this.floatTime = 0;
        this._buildMesh(options);
    }

    update(delta, time) {
        super.update(delta, time);
        this.floatTime += delta;
        this.group.position.y = this.baseY + Math.sin(this.floatTime * 3) * 0.12;
        this.group.rotation.y += delta * 1.5;
    }

    _buildMesh(options) {
        const color = options.color || (this.type === 'relic' ? 0xf8e16c : 0x7dd3fc);
        const material = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: this.type === 'relic' ? 1.2 : 0.6
        });

        const geometry = this.type === 'relic'
            ? new THREE.OctahedronGeometry(0.45)
            : new THREE.SphereGeometry(0.28, 12, 12);

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.group.add(this.mesh);
    }

    serialize() {
        return {
            ...super.serialize(),
            collectibleType: this.type,
            payload: this.payload,
            label: this.label,
            baseY: this.baseY
        };
    }
}
