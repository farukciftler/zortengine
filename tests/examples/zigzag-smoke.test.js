import { HeadlessHarness } from 'zortengine';
import { RunScene } from '../../examples/zigzag-runner/scenes/RunScene.js';

const harness = new HeadlessHarness({ fixedDelta: 1 / 60 });
const scene = new RunScene({ seed: 'zigzag-smoke' });
harness.mountScene('zigzag', scene);
harness.step(10);

const state = scene.runState;
console.assert(state != null, 'RunState olmali');
console.assert(typeof state.score === 'number', 'Skor sayi olmali');
console.assert(typeof state.distance === 'number', 'Mesafe sayi olmali');
console.assert(scene.player != null, 'Player olmali');

console.log('zigzag smoke test passed');
