import * as THREE from 'three';
import { GameObject } from '../../engine/object/GameObject.js';

export class ObjectiveZoneActor extends GameObject {
    constructor(scene, x, z, options = {}) {
        super(scene, x, z, options.radius || 1.5);
        this.isActive = options.isActive ?? false;
        this._buildMesh();
        this.setActive(this.isActive);
    }

    update(delta) {
        super.update(delta);
        this.group.rotation.y += delta * 0.8;
    }

    setActive(active) {
        this.isActive = active;
        const color = active ? 0x34d399 : 0x64748b;
        const emissiveIntensity = active ? 1.6 : 0.35;

        for (const mesh of [this.outerRing, this.innerCore]) {
            if (!mesh) continue;
            mesh.material.color.setHex(color);
            mesh.material.emissive.setHex(color);
            mesh.material.emissiveIntensity = emissiveIntensity;
        }
    }

    _buildMesh() {
        const outerMat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            emissive: 0x64748b,
            emissiveIntensity: 0.35
        });
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            emissive: 0x64748b,
            emissiveIntensity: 0.35,
            transparent: true,
            opacity: 0.9
        });

        this.outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.18, 12, 24), outerMat);
        this.outerRing.rotation.x = Math.PI / 2;
        this.outerRing.position.y = 1.6;
        this.outerRing.castShadow = true;

        this.innerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.4, 16, 1, true), innerMat);
        this.innerCore.position.y = 1.2;
        this.innerCore.castShadow = true;

        this.group.add(this.outerRing, this.innerCore);
    }
}
