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
                    
                    // -- YENİ: Objeyi üçgen ağı (Trimesh) olarak kopyala ve fiziğe tam uyumlu ekle --
                    const cloneGeo = child.geometry.clone();
                    cloneGeo.applyMatrix4(child.matrixWorld); // Blender'daki yerel büyüklüğü/rotasyonu merkeze uygula
                    
                    // Objeyi dünya merkezinde sıfırdan yarat (Trimesh olduğu için)
                    const body = this.physics.createTrimesh(cloneGeo, 0, new THREE.Vector3(0, 0, 0));
                    // this.physics.addBody(body); zaten createTrimesh içinde eklendi
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