import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import WebSocket from 'ws';

const port = 27657;
const server = spawn('node', ['scripts/network-server.js'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    env: {
        ...process.env,
        PORT: String(port),
        ROOM_GRACE_MS: '100'
    }
});

await wait(500);

const messagesA = [];
const messagesB = [];

const a = new WebSocket(`ws://localhost:${port}`);
const b = new WebSocket(`ws://localhost:${port}`);

await Promise.all([
    new Promise(resolve => a.once('open', resolve)),
    new Promise(resolve => b.once('open', resolve))
]);

a.on('message', raw => messagesA.push(JSON.parse(raw.toString())));
b.on('message', raw => messagesB.push(JSON.parse(raw.toString())));

a.send(JSON.stringify({
    type: 'create_room',
    payload: {
        roomName: 'Smoke Room',
        playerId: 'a',
        playerName: 'Alpha'
    }
}));

await wait(300);

b.send(JSON.stringify({ type: 'list_rooms', payload: {} }));

await wait(200);

b.send(JSON.stringify({
    type: 'join_room',
    payload: {
        roomId: 'smoke-room',
        playerId: 'b',
        playerName: 'Beta'
    }
}));

await wait(300);

a.send(JSON.stringify({
    type: 'start_room',
    payload: {
        roomId: 'smoke-room',
        playerId: 'a'
    }
}));

await wait(200);

b.send(JSON.stringify({
    type: 'state',
    payload: {
        roomId: 'smoke-room',
        position: { x: 1, y: 0, z: 2 },
        health: 99
    }
}));

await wait(300);

assert.ok(messagesB.some(message => message.type === 'room_list'), 'Oda listesi alinmali');
assert.ok(messagesA.some(message => message.type === 'room_joined'), 'Oda kuran istemci room_joined almali');
assert.ok(messagesB.some(message => message.type === 'room_joined'), 'Odaya katilan istemci room_joined almali');
assert.ok(messagesA.some(message => message.type === 'peer_joined'), 'Peer joined mesaji alinmali');
assert.ok(messagesA.some(message => message.type === 'room_started'), 'Room started mesaji alinmali');
assert.ok(messagesA.some(message => message.type === 'state'), 'State replikasyonu alinmali');

a.close();
b.close();
server.kill('SIGTERM');

console.log('network smoke test passed');
