import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';
import { BrowserPlatform } from './BrowserPlatform.js';
import { GameScene } from './GameScene.js';
import { SceneManager } from './SceneManager.js';

export class Engine {
    constructor(container, options = {}) {
        this.isHeadless = options.headless || false;
        this.platform = options.platform || new BrowserPlatform();
        this.clock = new THREE.Clock();
        this.events = new EventEmitter();
        this.objects = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.postProcessor = null;
        this.sceneManager = new SceneManager(this);
        this.defaultScene = null;

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
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this.update(delta, time);
        this.sceneManager.update(delta, time);
        this._syncConvenienceRefs(this.sceneManager.getActiveScene());

        this.render();
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

    _syncConvenienceRefs(scene) {
        this.scene = scene ? scene.threeScene : this.scene;
        this.objects = scene ? scene.objects : this.objects;
        this.camera = scene ? scene.getCamera() : this.camera;
        this.physics = scene ? scene.getSystem('physics') : null;
        this.postProcessor = scene ? scene.getPostProcessor() : this.postProcessor;
    }
}
