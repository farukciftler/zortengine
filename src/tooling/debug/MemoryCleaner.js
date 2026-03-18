export class MemoryCleaner {
    static dispose(object3D) {
        if (!object3D) return;

        object3D.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }

                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
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

        if (object3D.parent) {
            object3D.parent.remove(object3D);
        }
    }
}
