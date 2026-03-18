import * as THREE from 'three';
import { EventEmitter } from '../events/EventEmitter.js';
import { BrowserPlatform } from '../../adapters/browser/BrowserPlatform.js';
import { GameScene } from './GameScene.js';
import { SceneManager } from './SceneManager.js';
import { InspectorRegistry } from '../../../utils/InspectorRegistry.js';
import { ReplayRecorder } from '../snapshot/ReplayRecorder.js';
import { SeededRandom } from '../snapshot/SeededRandom.js';

export class Engine {
    constructor(container, options = {}) {
        this.isHeadless = options.headless || false;
        this.platform = options.platform || new BrowserPlatform();
        this.clock = new THREE.Clock();
        this.events = new EventEmitter();
        this.random = options.random || new SeededRandom(options.seed || 'zortengine');
        this.inspector = options.inspector || new InspectorRegistry();
        this.replayRecorder = options.replayRecorder || new ReplayRecorder();
        this.objects = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.postProcessor = null;
        this.sceneManager = new SceneManager(this);
        this.defaultScene = null;
        this.fixedDelta = options.fixedDelta || 1 / 60;
        this.maxSubSteps = options.maxSubSteps || 5;
        this.accumulator = 0;
        this.simulationTime = 0;
        this.tick = 0;

        if (!this.isHeadless) {
            const viewport = this.platform.getViewportSize();
            this.container = container || this.platform.getBody();
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(viewport.width, viewport.height);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.container.appendChild(this.renderer.domElement);
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
        if (this.isHeadless || !this.renderer) return;

        const activeScene = this.sceneManager.getActiveScene();
        const renderScene = activeScene ? activeScene.threeScene : this.scene;
        const activeCamera = activeScene ? activeScene.getCamera() : this.camera;
        const activePostProcessor = activeScene ? activeScene.getPostProcessor() : this.postProcessor;

        if (activeCamera && renderScene) {
            const cam = activeCamera.getThreeCamera ? activeCamera.getThreeCamera() : activeCamera;

            if (activePostProcessor) {
                activePostProcessor.setCamera(cam);
                activePostProcessor.render();
            } else {
                this.renderer.render(renderScene, cam);
            }
        }
    }

    onWindowResize() {
        if (!this.renderer) return;

        const viewport = this.platform.getViewportSize();
        const aspect = viewport.width / viewport.height;
        this.renderer.setSize(viewport.width, viewport.height);

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
            this.renderer.dispose();
        }
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
        this.scene = scene ? scene.threeScene : this.scene;
        this.objects = scene ? scene.objects : this.objects;
        this.camera = scene ? scene.getCamera() : this.camera;
        this.physics = scene ? scene.getSystem('physics') : null;
        this.postProcessor = scene ? scene.getPostProcessor() : this.postProcessor;
    }
}
