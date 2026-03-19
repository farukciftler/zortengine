/**
 * RNInputManager API test — Node ortamında (PanResponder yok, mock platform)
 */
import assert from 'node:assert/strict';
import { RNInputManager } from '../../src/adapters/react-native/RNInputManager.js';

const mockPlatform = {
    getViewportSize: () => ({ width: 400, height: 600 })
};

const input = new RNInputManager({ platform: mockPlatform, autoAttach: false });

input.triggerAction('attack', { profile: 'mobile' });
assert.equal(input.commandQueue.length, 1, 'triggerAction adds to queue');
assert.equal(input.consumeCommands()[0].action, 'attack', 'consumeCommands');

input.triggerAction('left', { profile: 'mobile' });
input.triggerAction('right', { profile: 'mobile' });
const drained = input.drainReplayFrame(42);
assert.equal(drained.tick, 42, 'drainReplayFrame tick');
assert.equal(drained.commands.length, 2, 'drainReplayFrame commands');

input.enqueueExternalCommands([{ action: 'jump', profile: 'mobile', key: null, time: 0 }]);
assert.equal(input.commandQueue.length, 1, 'enqueueExternalCommands');

const move = input.getMovementVector('mobile');
assert.ok(typeof move.x === 'number' && typeof move.z === 'number', 'getMovementVector');

input.setJoystickDir(1, -1);
const move2 = input.getMovementVector('mobile');
assert.ok(move2.x > 0 && move2.z < 0, 'joystickDir normalizes to direction');

let emitted = false;
input.on('attack', () => { emitted = true; });
input.triggerAction('attack');
assert.equal(emitted, true, 'events.emit');

assert.equal(input.isPointerLocked(), false, 'isPointerLocked always false');
input.requestPointerLock();
input.exitPointerLock();

console.log('RNInputManager API test passed');
