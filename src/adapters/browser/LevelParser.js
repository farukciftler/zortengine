import * as THREE from 'three';

export class LevelParser {
    constructor(physicsManager, scene) {
        this.physics = physicsManager;
        this.scene = scene;
    }

    parse(gltfScene) {
        const spawnPoints = {};

        gltfScene.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.name.includes('_Collider')) {
                    child.visible = false;

                    const cloneGeo = child.geometry.clone();
                    cloneGeo.applyMatrix4(child.matrixWorld);

                    const body = this.physics.createTrimesh(cloneGeo, 0, new THREE.Vector3(0, 0, 0));
                    this.physics.addBody(body);
                }

                if (child.name.includes('Spawn_')) {
                    child.visible = false;
                    const type = child.name.split('_')[1];
                    if (!spawnPoints[type]) spawnPoints[type] = [];
                    spawnPoints[type].push(child.position.clone());
                }
            }
        });

        this.scene.add(gltfScene);
        return { spawnPoints };
    }
}
