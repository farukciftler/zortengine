import assert from 'node:assert/strict';
import * as rootApi from 'zortengine';
import { HeadlessHarness, GameObject, GameScene } from 'zortengine';
import { AssetLoader, AssetManifest, AssetPipeline } from 'zortengine/assets';
import { BrowserPlatform } from 'zortengine/browser';
import { MemoryCleaner } from 'zortengine/devtools';
import { ObjectPool as RootPool } from 'zortengine';
import { WebSocketTransport } from 'zortengine/networking';
import { PhysicsManager } from 'zortengine/physics';
import { SaveManager } from 'zortengine/persistence';

assert.ok(rootApi.Engine, 'Engine root API icinde olmali');
assert.ok(rootApi.GameScene, 'GameScene root API icinde olmali');
assert.ok(rootApi.GameObject, 'GameObject root API icinde olmali');
assert.equal(rootApi.PhysicsManager, undefined, 'PhysicsManager root API disinda kalmali');
assert.equal(rootApi.UIManager, undefined, 'UIManager root API disinda kalmali');

assert.ok(AssetLoader && AssetManifest && AssetPipeline, 'Asset entrypoint calismali');
assert.ok(BrowserPlatform, 'Browser entrypoint calismali');
assert.ok(MemoryCleaner, 'Devtools entrypoint calismali');
assert.ok(WebSocketTransport, 'Networking transport entrypoint calismali');
assert.ok(PhysicsManager, 'Physics entrypoint calismali');
assert.ok(SaveManager, 'Persistence entrypoint calismali');
assert.ok(RootPool, 'Root API yardimcilari korunmali');

class TestObject extends GameObject {
    constructor(x = 0, z = 0, value = 0) {
        super(null, x, z, 1);
        this.value = value;
    }

    serialize() {
        return {
            ...super.serialize(),
            type: 'TestObject',
            value: this.value
        };
    }
}

class TrackerSystem {
    constructor(name, log) {
        this.name = name;
        this.log = log;
        this.restoredSnapshot = null;
    }

    update() {
        this.log.push(this.name);
    }

    snapshot() {
        return { name: this.name, visits: this.log.length };
    }

    restore(snapshot) {
        this.restoredSnapshot = snapshot;
    }
}

class ContractScene extends GameScene {
    constructor(name = 'contract') {
        super({ name });
        this.enterCount = 0;
        this.exitCount = 0;
    }

    setup() {
        this.log = [];
        this.early = this.registerSystem('early', new TrackerSystem('early', this.log), { priority: 5 });
        this.late = this.registerSystem('late', new TrackerSystem('late', this.log), { priority: 20 });
        this.registerObjectFactory('TestObject', snapshot => new TestObject(snapshot.position.x, snapshot.position.z, snapshot.value));
        this.testObject = new TestObject(2, 4, 9);
        this.add(this.testObject);
    }

    onEnter() {
        this.enterCount += 1;
    }

    onExit() {
        this.exitCount += 1;
    }
}

const harness = new HeadlessHarness({
    fixedDelta: 1 / 60
});

const sceneA = new ContractScene('scene-a');
const sceneB = new ContractScene('scene-b');
harness.mountScene('scene-a', sceneA);
harness.engine.addScene('scene-b', sceneB);
harness.step(1);

assert.deepEqual(sceneA.log, ['early', 'late'], 'System priority sirasi korunmali');
assert.equal(sceneA.enterCount, 1, 'Ilk scene attach olmali');

const snapshot = sceneA.serializeState();
sceneA.remove(sceneA.testObject);
sceneA.restoreState(snapshot);

const restoredObject = sceneA.objects.find(object => object instanceof TestObject);
assert.ok(restoredObject, 'Object factory ile restore calismali');
assert.equal(restoredObject.value, 9, 'Restore edilen object verisi korunmali');
assert.deepEqual(sceneA.early.restoredSnapshot, { name: 'early', visits: 2 }, 'System restore snapshot almali');

harness.engine.useScene('scene-b');
assert.equal(sceneA.exitCount, 1, 'Aktif scene detach olmali');
assert.equal(sceneB.enterCount, 1, 'Yeni scene attach olmali');

console.log('engine contract test passed');
