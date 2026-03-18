import { EventEmitter } from '../events/EventEmitter.js';
import { BrowserPlatform } from '../../adapters/browser/BrowserPlatform.js';
import { ThreeRendererAdapter } from '../../adapters/render/ThreeRendererAdapter.js';
import { GameScene } from './GameScene.js';
import { SceneManager } from './SceneManager.js';
import { InspectorRegistry } from '../../tooling/inspector/InspectorRegistry.js';
import { ReplayRecorder } from '../snapshot/ReplayRecorder.js';
import { SeededRandom } from '../snapshot/SeededRandom.js';
import { PluginRegistry } from '../plugin/PluginRegistry.js';
import { AssetStore } from '../assets/AssetStore.js';

class EngineClock {
    constructor(options = {}) {
        this.now = options.now || (() => {
            if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
                return performance.now() / 1000;
            }
            return Date.now() / 1000;
        });
        this.started = false;
        this.lastTime = 0;
    }

    start() {
        this.lastTime = this.now();
        this.started = true;
    }

    getDelta() {
        const currentTime = this.now();
        if (!this.started) {
            this.lastTime = currentTime;
            this.started = true;
            return 0;
        }
        const delta = currentTime - this.lastTime;
        this.lastTime = currentTime;
        return Math.max(0, delta);
    }
}

export class Engine {
    constructor(container, options = {}) {
        this.isHeadless = options.headless || false;
        this.platform = options.platform || new BrowserPlatform();
        this.clock = options.clock || new EngineClock();
        this.events = new EventEmitter();
        this.random = options.random || new SeededRandom(options.seed || 'zortengine');
        this.inspector = options.inspector || new InspectorRegistry();
        this.replayRecorder = options.replayRecorder || new ReplayRecorder();
        this.plugins = new PluginRegistry(this, {
            scope: 'engine',
            events: this.events
        });
        this.assets = options.assets || new AssetStore();
        this.assetLoader = options.assetLoader || options.loader || this.assets.loader || null;
        if (this.assetLoader && !this.assets.loader) {
            this.assets.setLoader(this.assetLoader);
        }
        this.objects = [];
        this.scene = null;
        this.sceneHandle = null;
        this.camera = null;
        this.renderer = null;
        this.postProcessor = null;
        this.renderAdapter = this.isHeadless
            ? null
            : (options.rendererAdapter || new ThreeRendererAdapter(options.renderOptions || {}));
        this.rendererAdapter = this.renderAdapter;
        this.sceneManager = new SceneManager(this);
        this.defaultScene = null;
        this.fixedDelta = options.fixedDelta || 1 / 60;
        this.maxSubSteps = options.maxSubSteps || 5;
        this.accumulator = 0;
        this.simulationTime = 0;
        this.tick = 0;

        if (!this.isHeadless && this.renderAdapter) {
            const viewport = this.platform.getViewportSize();
            this.container = container || this.platform.getBody();
            this.renderer = this.renderAdapter.mount({
                container: this.container,
                platform: this.platform,
                viewport
            });
            this.removeResizeListener = this.platform.addEventListener(
                'window',
                'resize',
                () => this.onWindowResize()
            );
        } else {
            this.container = null;
        }

        this.defaultScene = new GameScene({ name: 'default' });
        this.sceneManager.addScene('default', this.defaultScene);
        this.sceneManager.setActive('default');
    }

    setCamera(camera) {
        const activeScene = this.sceneManager.getActiveScene();
        if (activeScene) {
            activeScene.setCamera(camera);
        }
        this.camera = camera;
    }

    addScene(name, scene) {
        return this.sceneManager.addScene(name, scene);
    }

    useScene(name) {
        return this.sceneManager.setActive(name);
    }

    add(object) {
        const activeScene = this.sceneManager.getActiveScene();
        if (activeScene) {
            return activeScene.add(object);
        }
        return object;
    }

    remove(object) {
        const activeScene = this.sceneManager.getActiveScene();
        if (activeScene) {
            activeScene.remove(object);
        }
    }

    registerSystem(name, system, options = {}) {
        const activeScene = this.sceneManager.getActiveScene();
        if (!activeScene) return system;
        const registered = activeScene.registerSystem(name, system, options);
        this._syncConvenienceRefs(activeScene);
        return registered;
    }

    getSystem(name) {
        return this.sceneManager.getActiveScene()?.getSystem(name) || null;
    }

    use(plugin, options = {}) {
        return this.plugins.use(plugin, options);
    }

    hasCapability(capability) {
        return this.plugins.hasCapability(capability);
    }

    getPlugin(id) {
        return this.plugins.getPlugin(id);
    }

    setAssetLoader(loader) {
        this.assetLoader = loader;
        this.assets.setLoader(loader);
        return this;
    }

    start() {
        this.clock.start();
        this.loop();
    }

    loop() {
        this.platform.requestAnimationFrame(() => this.loop());
        this.stepSimulation(this.clock.getDelta());
        this.render();
    }

    stepSimulation(delta) {
        this.accumulator += delta;
        let steps = 0;

        while (this.accumulator >= this.fixedDelta && steps < this.maxSubSteps) {
            this.simulationTime += this.fixedDelta;
            this.tick += 1;
            this.update(this.fixedDelta, this.simulationTime);
            this.sceneManager.update(this.fixedDelta, this.simulationTime);
            this._syncConvenienceRefs(this.sceneManager.getActiveScene());
            steps += 1;
            this.accumulator -= this.fixedDelta;

            const input = this.getSystem('input');
            if (input?.drainReplayFrame) {
                this.replayRecorder.capture(input.drainReplayFrame(this.tick));
            }
        }
    }

    update(delta, time) {
        // Override in specific game
    }

    render() {
        if (this.isHeadless || !this.renderAdapter) return;

        const activeScene = this.sceneManager.getActiveScene();
        const renderScene = activeScene ? activeScene.getSceneHandle?.() : this.sceneHandle;
        const activeCamera = activeScene ? activeScene.getCamera() : this.camera;
        const activePostProcessor = activeScene ? activeScene.getPostProcessor() : this.postProcessor;

        if (activeCamera && renderScene) {
            this.renderAdapter.render({
                scene: renderScene,
                camera: activeCamera,
                postProcessor: activePostProcessor
            });
        }
    }

    onWindowResize() {
        if (!this.renderer) return;

        const viewport = this.platform.getViewportSize();
        const aspect = viewport.width / viewport.height;
        this.renderAdapter?.resize?.(viewport.width, viewport.height);

        const activeScene = this.sceneManager.getActiveScene();
        if (activeScene) {
            activeScene.onResize(viewport.width, viewport.height, aspect);
            this._syncConvenienceRefs(activeScene);
        } else if (this.camera && typeof this.camera.onResize === 'function') {
            this.camera.onResize(aspect, viewport.width, viewport.height);
        }

        const activePostProcessor = activeScene ? activeScene.getPostProcessor() : this.postProcessor;
        if (activePostProcessor && typeof activePostProcessor.onResize === 'function') {
            activePostProcessor.onResize(viewport.width, viewport.height);
        }
    }

    destroy() {
        if (this.removeResizeListener) {
            this.removeResizeListener();
            this.removeResizeListener = null;
        }

        if (this.sceneManager) {
            const activeScene = this.sceneManager.getActiveScene();
            if (activeScene && typeof activeScene.dispose === 'function') {
                activeScene.dispose();
            }
        }

        if (this.renderer) {
            this.renderAdapter?.dispose?.();
        }
        this.events.emit('engine:destroyed');
    }

    getSimulationStats() {
        return {
            tick: this.tick,
            fixedDelta: this.fixedDelta,
            simulationTime: this.simulationTime,
            pendingTime: this.accumulator
        };
    }

    snapshot() {
        return {
            tick: this.tick,
            simulationTime: this.simulationTime,
            random: this.random.snapshot(),
            scene: this.sceneManager.getActiveScene()?.serializeState?.() || null
        };
    }

    restoreSnapshot(snapshot) {
        if (!snapshot) return false;
        this.tick = snapshot.tick ?? this.tick;
        this.simulationTime = snapshot.simulationTime ?? this.simulationTime;
        if (snapshot.random) {
            this.random.restore(snapshot.random);
        }
        const activeScene = this.sceneManager.getActiveScene();
        if (activeScene?.restoreState) {
            activeScene.restoreState(snapshot.scene);
        }
        return true;
    }

    playReplay(serializedReplay, stepsLimit = Infinity) {
        this.replayRecorder.load(serializedReplay);
        const input = this.getSystem('input');
        let processed = 0;
        while (processed < stepsLimit) {
            const frame = this.replayRecorder.nextFrame();
            if (!frame) break;
            input?.enqueueExternalCommands?.(frame.commands || []);
            this.stepSimulation(this.fixedDelta);
            processed += 1;
        }
        return processed;
    }

    _syncConvenienceRefs(scene) {
        this.sceneHandle = scene ? scene.getSceneHandle?.() || null : null;
        this.scene = scene ? scene.getRenderScene?.() || null : null;
        this.objects = scene ? scene.objects : this.objects;
        this.camera = scene ? scene.getCamera() : this.camera;
        this.physics = scene ? scene.getSystem('physics') : null;
        this.postProcessor = scene ? scene.getPostProcessor() : this.postProcessor;
        this.renderer = this.renderAdapter?.renderer || this.renderer;
    }
}
