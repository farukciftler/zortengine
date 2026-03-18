import * as THREE from 'three';

export class GameObject {
    constructor(scene, x = 0, z = 0, radius = 1) {
        GameObject._nextEntityId = (GameObject._nextEntityId || 1);
        this.entityId = `entity-${GameObject._nextEntityId++}`;
        this.scene = null;
        this.sceneController = null;
        this.radius = radius;
        this.group = new THREE.Group();
        this.group.position.set(x, 0, z);
        this.isDestroyed = false;
        this.hp = 1;
        this.maxHp = 1;
        this.components = new Map();

        if (scene) {
            this.attachToScene(scene);
        }
    }

    update(delta, time) {
        for (const component of this.components.values()) {
            if (typeof component.update === 'function') {
                component.update(delta, time);
            }
        }
    }

    attachToScene(scene, sceneController = null) {
        if (this.scene === scene) return;

        if (this.scene) {
            this.detachFromScene();
        }

        this.scene = scene;
        this.sceneController = sceneController;

        if (this.scene) {
            this.scene.add(this.group);
        }
    }

    detachFromScene() {
        if (this.scene) {
            this.scene.remove(this.group);
        }

        this.scene = null;
        this.sceneController = null;
    }

    addComponent(name, component) {
        if (!name || !component) return component;

        if (this.components.has(name)) {
            this.removeComponent(name);
        }

        this.components.set(name, component);
        if (typeof component.onAttach === 'function') {
            component.onAttach(this);
        }

        return component;
    }

    getComponent(name) {
        return this.components.get(name) || null;
    }

    removeComponent(name) {
        const component = this.components.get(name);
        if (!component) return null;

        if (typeof component.onDetach === 'function') {
            component.onDetach(this);
        }

        this.components.delete(name);
        return component;
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

        for (const name of this.components.keys()) {
            this.removeComponent(name);
        }

        this.detachFromScene();
    }

    serialize() {
        return {
            entityId: this.entityId,
            type: this.constructor.name,
            radius: this.radius,
            isDestroyed: this.isDestroyed,
            position: {
                x: this.group.position.x,
                y: this.group.position.y,
                z: this.group.position.z
            },
            rotation: {
                x: this.group.rotation.x,
                y: this.group.rotation.y,
                z: this.group.rotation.z
            }
        };
    }

    collidesWith(other) {
        const dist = this.group.position.distanceTo(other.group.position);
        return dist < (this.radius + other.radius);
    }
}
