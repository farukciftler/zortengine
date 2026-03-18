import assert from 'node:assert/strict';
import { HeadlessHarness } from '../utils/HeadlessHarness.js';
import { RunScene } from '../game/scenes/RunScene.js';

const harness = new HeadlessHarness({
    fixedDelta: 1 / 60
});

const scene = new RunScene({
    seed: 'smoke-seed',
    loadoutId: 'vanguard'
});

harness.mountScene('run', scene);
harness.step(10);

const snapshot = harness.snapshot();

assert.ok(snapshot, 'Snapshot uretilmeli');
assert.equal(snapshot.name, 'run');
assert.ok(snapshot.runState, 'Run state snapshot icermeli');
assert.equal(snapshot.runState.seed, 'smoke-seed');
assert.ok(Array.isArray(snapshot.objects), 'Scene object listesi olmali');

console.log('headless smoke test passed');
