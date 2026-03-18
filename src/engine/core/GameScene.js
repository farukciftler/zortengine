import * as THREE from 'three';
import { SystemManager } from './SystemManager.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { PluginRegistry } from '../plugin/PluginRegistry.js';

function createFallbackSceneHandle(nativeScene = null) {
    return {
        add(node) {
            const nativeNode = node?.getNativeNode?.() || node?.group || node?.mesh || node;
            nativeScene?.add?.(nativeNode);
        },
        remove(node) {
            const nativeNode = node?.getNativeNode?.() || node?.group || node?.mesh || node;
            nativeScene?.remove?.(nativeNode);
        },
        setBackground(background) {
            if (nativeScene) {
                nativeScene.background = background;
            }
        },
        getNativeScene() {
            return nativeScene;
        }
    };
}

export class GameScene {
    constructor(options = {}) {
        this.name = options.name || 'scene';
        this.background = options.background;
        this.sceneHandle = options.sceneHandle || null;
        this.threeScene = options.threeScene || this.sceneHandle?.getNativeScene?.() || new THREE.Scene();
        this.objects = [];
        this.systems = new SystemManager();
        this.engine = null;
        this.camera = null;
        this.postProcessor = null;
        this.isSetup = false;
        this.events = new EventEmitter();
        this.objectFactories = new Map();
        this.plugins = new PluginRegistry(this, {
            scope: 'scene'
        });
        this.assetScope = `scene:${this.name}`;

        this.sceneHandle?.setBackground?.(this.background);
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
        this.plugins.parent = engine.plugins;
        if (!this.sceneHandle) {
            this.sceneHandle = engine.renderAdapter?.createSceneHandle?.({
                background: this.background,
                nativeScene: this.threeScene
            }) || createFallbackSceneHandle(this.threeScene);
        }
        this.threeScene = this.sceneHandle?.getNativeScene?.() || this.threeScene;
        this.systems.setContext({ engine, scene: this });
        engine.inspector?.registerScene?.(this);

        if (!this.isSetup) {
            this.setup();
            this.isSetup = true;
        }

        this.onEnter();
        this.events.emit('scene:entered', { name: this.name });
    }

    detach() {
        this.onExit();
        this.releaseOwnedAssets();
        this.events.emit('scene:exited', { name: this.name });
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

    use(plugin, options = {}) {
        return this.plugins.use(plugin, options);
    }

    add(object) {
        if (!object || this.objects.includes(object)) return object;

        this.objects.push(object);

        if (typeof object.attachToScene === 'function') {
            object.attachToScene(this.sceneHandle || this.threeScene, this);
        } else if (object.mesh) {
            this.sceneHandle?.add?.(object.mesh);
        } else if (object.group) {
            this.sceneHandle?.add?.(object.group);
        } else {
            this.sceneHandle?.add?.(object);
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
            object.detachFromScene(this.sceneHandle || this.threeScene, this);
        } else if (object.mesh) {
            this.sceneHandle?.remove?.(object.mesh);
        } else if (object.group) {
            this.sceneHandle?.remove?.(object.group);
        } else {
            this.sceneHandle?.remove?.(object);
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

    getSceneHandle() {
        return this.sceneHandle;
    }

    getRenderScene() {
        return this.sceneHandle?.getNativeScene?.() || this.threeScene || null;
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
        this.releaseOwnedAssets();
        this.systems.dispose();
    }

    async retainAsset(assetOrId, options = {}) {
        if (!this.engine?.assets) return null;
        const owner = options.owner || this.assetScope;
        const handle = typeof assetOrId === 'string'
            ? this.engine.assets.retain(assetOrId, owner)
            : await this.engine.assets.load(assetOrId, { ...options, owner });

        if (handle) {
            this.events.emit('asset:retained', { id: handle.id, owner });
        }
        return handle;
    }

    releaseAsset(id, options = {}) {
        if (!this.engine?.assets) return false;
        const owner = options.owner || this.assetScope;
        const released = this.engine.assets.release(id, {
            owner,
            dispose: options.dispose
        });
        if (released) {
            this.events.emit('asset:released', { id, owner });
        }
        return released;
    }

    releaseOwnedAssets() {
        this.engine?.assets?.releaseOwner?.(this.assetScope);
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
