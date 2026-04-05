import { System, GameObject } from 'zortengine';
import * as THREE from 'three';

export class SpawnerSystem extends System {
    constructor() {
        super();
        this.nextSpawnTime = 0;
        this.spawnInterval = 2; // seconds
    }

    onAttach(context) {
        this.scene = context.scene;
    }

    update(delta, time) {
        if (time > this.nextSpawnTime) {
            this.spawnBlock();
            this.nextSpawnTime = time + this.spawnInterval;
            this.spawnInterval = Math.max(0.5, this.spawnInterval * 0.98); // Gradually speed up
        }
    }

    spawnBlock() {
        const x = (Math.random() - 0.5) * 8; // Random X on platform
        const z = (Math.random() - 0.5) * 30; // Random Z
        
        const block = new GameObject();
        const size = 0.5 + Math.random();
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ 
            color: Math.random() > 0.5 ? 0xffcc00 : 0xff6600,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        block.group.add(mesh);
        block.group.position.set(x, 10, z);
        block.isBlock = true;
        block.mass = size * size * size; // Mass based on volume
        
        this.scene.add(block);

        // Add Physics Body
        if (this.physics) {
            const body = this.physics.createBox(size, size, size, block.mass, block.group.position);
            this.physics.addBody(body, block.group);
            block.body = body;
        }
    }
}
