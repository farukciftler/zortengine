export class SceneManager {
    constructor(engine = null) {
        this.engine = engine;
        this.scenes = new Map();
        this.activeSceneName = null;
    }

    addScene(name, sceneObj) {
        sceneObj.name = sceneObj.name || name;
        this.scenes.set(name, sceneObj);
        return sceneObj;
    }

    removeScene(name) {
        const scene = this.scenes.get(name);
        if (!scene) return;

        if (this.activeSceneName === name) {
            this.setActive(null);
        }

        if (typeof scene.dispose === 'function') {
            scene.dispose();
        }

        this.scenes.delete(name);
    }

    setActive(name) {
        const currentScene = this.getActiveScene();
        if (currentScene && typeof currentScene.detach === 'function') {
            currentScene.detach();
        }

        if (name === null) {
            this.activeSceneName = null;
            this._syncEngine(null);
            return null;
        }

        const nextScene = this.scenes.get(name);
        if (!nextScene) {
            console.error(`Scene ${name} not found.`);
            return null;
        }

        this.activeSceneName = name;

        if (typeof nextScene.attach === 'function' && this.engine) {
            nextScene.attach(this.engine);
        }

        this._syncEngine(nextScene);
        return nextScene;
    }

    getActiveScene() {
        if (this.activeSceneName && this.scenes.has(this.activeSceneName)) {
            return this.scenes.get(this.activeSceneName);
        }
        return null;
    }

    update(delta, time) {
        const scene = this.getActiveScene();
        if (scene && typeof scene.update === 'function') {
            scene.update(delta, time);
        }
    }

    _syncEngine(scene) {
        if (!this.engine) return;

        this.engine.scene = scene ? scene.threeScene : null;
        this.engine.objects = scene ? scene.objects : [];
        this.engine.camera = scene ? scene.getCamera() : null;
        this.engine.postProcessor = scene ? scene.getPostProcessor() : null;
    }
}
