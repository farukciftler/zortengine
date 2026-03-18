import { BrowserPlatform } from '../core/BrowserPlatform.js';
import { Engine } from '../core/Engine.js';

export class HeadlessHarness {
    constructor(options = {}) {
        this.engine = new Engine(null, {
            headless: true,
            platform: options.platform || new BrowserPlatform({
                windowRef: null,
                documentRef: null
            }),
            fixedDelta: options.fixedDelta
        });
    }

    mountScene(name, scene) {
        this.engine.addScene(name, scene);
        this.engine.useScene(name);
        return scene;
    }

    step(frames = 1, delta = this.engine.fixedDelta) {
        for (let i = 0; i < frames; i++) {
            this.engine.stepSimulation(delta);
        }
    }

    snapshot() {
        return this.engine.sceneManager.getActiveScene()?.serializeState?.() || null;
    }
}
