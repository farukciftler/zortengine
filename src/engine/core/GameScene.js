import * as THREE from 'three';
import { SystemManager } from './SystemManager.js';
import { EventEmitter } from '../events/EventEmitter.js';

export class GameScene {
    constructor(options = {}) {
        this.name = options.name || 'scene';
        this.background = options.background;
        this.threeScene = options.threeScene || new THREE.Scene();
        this.objects = [];
        this.systems = new SystemManager();
        this.engine = null;
        this.camera = null;
        this.postProcessor = null;
        this.isSetup = false;
        this.events = new EventEmitter();
        this.objectFactories = new Map();

        if (this.background !== undefined) {
            this.threeScene.background = this.background;
        }
    }

    setup() {
        // Override in subclasses.
    }

    onEnter() {
        // Optional lifecycle hook.
    }

    onExit() {
        // Optional lifecycle hook.
    }

    onUpdate(delta, time) {
        // Override in subclasses.
    }

    attach(engine) {
        this.engine = engine;
        this.systems.setContext({ engine, scene: this });
        engine.inspector?.registerScene?.(this);

        if (!this.isSetup) {
            this.setup();
            this.isSetup = true;
        }

        this.onEnter();
    }

    detach() {
        this.onExit();
        this.systems.clearContext();
        this.engine = null;
    }

    on(eventName, listener) {
        this.events.on(eventName, listener);
    }

    off(eventName, listener) {
        this.events.off(eventName, listener);
    }

    emit(eventName, payload) {
        this.events.emit(eventName, payload);
    }

    add(object) {
        if (!object || this.objects.includes(object)) return object;

        this.objects.push(object);

        if (typeof object.attachToScene === 'function') {
            object.attachToScene(this.threeScene, this);
        } else if (object.mesh) {
            this.threeScene.add(object.mesh);
        } else if (object.group) {
            this.threeScene.add(object.group);
        } else if (object instanceof THREE.Object3D) {
            this.threeScene.add(object);
        }

        if (typeof object.onAddedToScene === 'function') {
            object.onAddedToScene(this);
        }

        this.engine?.inspector?.registerObject?.(this.name, object);

        return object;
    }

    remove(object) {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }

        if (!object) return;

        if (typeof object.detachFromScene === 'function') {
            object.detachFromScene(this.threeScene, this);
        } else if (object.mesh) {
            this.threeScene.remove(object.mesh);
        } else if (object.group) {
            this.threeScene.remove(object.group);
        } else if (object instanceof THREE.Object3D) {
            this.threeScene.remove(object);
        }

        if (typeof object.onRemovedFromScene === 'function') {
            object.onRemovedFromScene(this);
        }

        this.engine?.inspector?.unregisterObject?.(this.name, object);
    }

    registerSystem(name, system, options = {}) {
        const registered = this.systems.register(name, system, options);
        this.engine?.inspector?.registerSystem?.(this.name, name);
        return registered;
    }

    getSystem(name) {
        return this.systems.get(name);
    }

    registerObjectFactory(type, factory) {
        if (!type || typeof factory !== 'function') return this;
        this.objectFactories.set(type, factory);
        return this;
    }

    getObjectFactory(type) {
        return this.objectFactories.get(type) || null;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    getCamera() {
        return this.camera;
    }

    setPostProcessor(postProcessor) {
        this.postProcessor = postProcessor;
    }

    getPostProcessor() {
        return this.postProcessor;
    }

    update(delta, time) {
        for (const object of this.objects) {
            if (typeof object.update === 'function') {
                object.update(delta, time);
            }
        }

        this.systems.update(delta, time);
        this.onUpdate(delta, time);
    }

    onResize(width, height, aspect) {
        const camera = this.getCamera();
        if (camera && typeof camera.onResize === 'function') {
            camera.onResize(aspect, width, height);
        }

        this.systems.onResize(width, height, aspect);
    }

    dispose() {
        [...this.objects].forEach(object => this.remove(object));
        this.systems.dispose();
    }

    serializeState() {
        return {
            name: this.name,
            objects: this.objects
                .filter(object => typeof object.serialize === 'function')
                .map(object => object.serialize()),
            systems: this.systems.entries
                .map(({ name, system }) => ({
                    name,
                    snapshot: typeof system.snapshot === 'function' ? system.snapshot() : null
                }))
        };
    }

    restoreState(snapshot) {
        if (!snapshot) return false;
        this.restoreSystemSnapshots(snapshot.systems || []);
        this.restoreObjects(snapshot.objects || []);
        return true;
    }

    restoreSystemSnapshots(systemSnapshots = []) {
        const context = { engine: this.engine, scene: this };
        for (const entry of systemSnapshots) {
            const system = this.getSystem(entry?.name);
            if (system && typeof system.restore === 'function') {
                system.restore(entry.snapshot, context);
            }
        }
    }

    restoreObjects(serializedObjects = [], options = {}) {
        const {
            clearExisting = false,
            filter = null
        } = options;

        if (clearExisting) {
            [...this.objects].forEach(object => this.remove(object));
        }

        const restored = [];
        for (const snapshot of serializedObjects) {
            if (!snapshot?.type) continue;
            if (typeof filter === 'function' && !filter(snapshot)) continue;
            const factory = this.getObjectFactory(snapshot.type);
            if (!factory) continue;

            const object = factory(snapshot, this);
            if (!object) continue;
            if (!this.objects.includes(object)) {
                this.add(object);
            }
            restored.push(object);
        }

        return restored;
    }
}
