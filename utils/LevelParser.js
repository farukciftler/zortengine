import * as THREE from 'three';

export class LevelParser {
    constructor(physicsManager, scene) {
        this.physics = physicsManager;
        this.scene = scene;
    }

    // Blender'dan gelen bir GLTF modelini tarar
    parse(gltfScene) {
        const spawnPoints = {};
        
        gltfScene.traverse((child) => {
            if (child.isMesh) {
                // Gölgeleri aç
                child.castShadow = true;
                child.receiveShadow = true;

                // Blender'da isminin sonuna "_Collider" yazılan objeleri görünmez yapıp fiziğe ekler
                if (child.name.includes('_Collider')) {
                    child.visible = false;
                    
                    // Boyutları hesapla (Bounding Box)
                    child.geometry.computeBoundingBox();
                    const box = child.geometry.boundingBox;
                    const width = box.max.x - box.min.x;
                    const height = box.max.y - box.min.y;
                    const depth = box.max.z - box.min.z;

                    // Fizik motoruna statik (mass:0) bir kutu olarak ekle
                    const body = this.physics.createBox(width, height, depth, 0, child.position);
                    this.physics.addBody(body); // Mesh vermiyoruz çünkü görünmez duvar olacak
                }

                // Özel eşya/düşman doğma noktaları (Örn: "Spawn_Enemy_1")
                if (child.name.includes('Spawn_')) {
                    child.visible = false;
                    const type = child.name.split('_')[1]; // "Enemy", "Player", "Item" vs.
                    if (!spawnPoints[type]) spawnPoints[type] = [];
                    spawnPoints[type].push(child.position.clone());
                }
            }
        });

        this.scene.add(gltfScene);
        return { spawnPoints };
    }
}