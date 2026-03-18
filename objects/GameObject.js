import * as THREE from 'three';

export class GameObject {
    constructor(scene, x = 0, z = 0, radius = 1) {
        this.scene = scene;
        this.radius = radius;
        this.group = new THREE.Group();
        this.group.position.set(x, 0, z);
        if (this.scene) {
            this.scene.add(this.group);
        }
        this.isDestroyed = false;
        this.hp = 1;
        this.maxHp = 1;
    }

    // Called automatically by engine if added to engine.objects
    update(delta, time) {
        // To be overridden
    }

    flashColor(hexColor, duration = 200) {
        this.group.traverse(child => {
            if (child.isMesh && child.material) {
                if (!child.userData.origColor) {
                    if (child.material.color) {
                        child.userData.origColor = child.material.color.getHex();
                    }
                }
                child.material.color.setHex(hexColor);
                setTimeout(() => {
                    if (child.material && child.userData.origColor) {
                        child.material.color.setHex(child.userData.origColor);
                    }
                }, duration);
            }
        });
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        if (this.scene) {
            this.scene.remove(this.group);
        }
    }

    // Simple collision check against another game object
    collidesWith(other) {
        const dist = this.group.position.distanceTo(other.group.position);
        return dist < (this.radius + other.radius);
    }
}
