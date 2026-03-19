/**
 * RNPlatform contract test — Node ortamında mock Dimensions ile çalışır
 */
import assert from 'node:assert/strict';
import { RNPlatform } from '../../src/adapters/react-native/RNPlatform.js';
import { Engine } from '../../src/engine/core/Engine.js';

const mockDimensions = {
    get: () => ({ width: 400, height: 600 }),
    addEventListener: () => ({ remove: () => {} })
};

const platform = new RNPlatform({ dimensions: mockDimensions });
assert.deepEqual(platform.getViewportSize(), { width: 400, height: 600 }, 'getViewportSize');

const ref = {};
const platformWithRef = new RNPlatform({ containerRef: ref });
assert.equal(platformWithRef.getBody(), ref, 'getBody returns containerRef');

const cleanup = platform.addEventListener('window', 'resize', () => {});
assert.equal(typeof cleanup, 'function', 'addEventListener returns cleanup');
cleanup();

const cleanupOther = platform.addEventListener('document', 'click', () => {});
assert.equal(typeof cleanupOther, 'function', 'addEventListener returns no-op for other targets');
cleanupOther();

const id = platform.requestAnimationFrame(() => {});
assert.ok(id !== undefined, 'requestAnimationFrame returns id');

assert.equal(platform.getPointerLockElement(), null, 'getPointerLockElement returns null');

const engine = new Engine(null, { headless: true, platform });
assert.equal(engine.platform, platform, 'Engine accepts RNPlatform');
assert.equal(engine.isHeadless, true, 'Engine headless');
engine.destroy();

console.log('RNPlatform contract test passed');

