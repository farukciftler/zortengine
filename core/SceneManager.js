export class SceneManager {
    constructor() {
        this.scenes = {};
        this.activeSceneName = null;
    }

    addScene(name, sceneObj) {
        this.scenes[name] = sceneObj;
    }

    removeScene(name) {
        if (this.scenes[name]) {
            delete this.scenes[name];
        }
    }

    setActive(name) {
        if (this.scenes[name]) {
            this.activeSceneName = name;
        } else {
            console.error(`Scene ${name} not found.`);
        }
    }

    getActiveScene() {
        if (this.activeSceneName && this.scenes[this.activeSceneName]) {
            return this.scenes[this.activeSceneName];
        }
        return null;
    }

    update(delta, time) {
        const scene = this.getActiveScene();
        if (scene && typeof scene.update === 'function') {
            scene.update(delta, time);
        }
    }
}
