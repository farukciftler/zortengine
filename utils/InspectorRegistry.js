export class InspectorRegistry {
    constructor() {
        this.scenes = new Map();
    }

    registerScene(scene) {
        if (!scene?.name) return;
        if (!this.scenes.has(scene.name)) {
            this.scenes.set(scene.name, {
                systems: new Set(),
                objects: new Set()
            });
        }
    }

    registerSystem(sceneName, systemName) {
        if (!sceneName || !systemName) return;
        this.registerScene({ name: sceneName });
        this.scenes.get(sceneName).systems.add(systemName);
    }

    registerObject(sceneName, object) {
        if (!sceneName || !object) return;
        this.registerScene({ name: sceneName });
        this.scenes.get(sceneName).objects.add(object);
    }

    unregisterObject(sceneName, object) {
        this.scenes.get(sceneName)?.objects?.delete(object);
    }

    snapshot() {
        const result = [];
        for (const [sceneName, sceneInfo] of this.scenes.entries()) {
            result.push({
                sceneName,
                systems: [...sceneInfo.systems],
                objectCount: sceneInfo.objects.size,
                objects: [...sceneInfo.objects].map(object => ({
                    entityId: object.entityId,
                    type: object.constructor?.name || 'Object',
                    position: object.group
                        ? {
                            x: object.group.position.x,
                            y: object.group.position.y,
                            z: object.group.position.z
                        }
                        : null
                }))
            });
        }
        return result;
    }
}
