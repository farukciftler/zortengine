export class MemoryCleaner {
    // Three.js objelerini GPU'dan tamamen siler
    static dispose(object3D) {
        if (!object3D) return;

        object3D.traverse((child) => {
            if (child.isMesh) {
                // Geometriyi RAM/GPU'dan sil
                if (child.geometry) {
                    child.geometry.dispose();
                }

                // Materyalleri ve kaplamaları (Texture) sil
                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
                        // Eğer materyalin dokusu varsa onu da temizle
                        for (const key in material) {
                            if (material[key] && material[key].isTexture) {
                                material[key].dispose();
                            }
                        }
                        material.dispose();
                    });
                }
            }
        });

        // Objeyi sahneden/atasından ayır
        if (object3D.parent) {
            object3D.parent.remove(object3D);
        }
    }
}