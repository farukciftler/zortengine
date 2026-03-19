import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT || 2567);
const rooms = new Map();
const disconnectGraceMs = Number(process.env.ROOM_GRACE_MS || 15000);
const OPEN_STATE = 1;

function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            id: roomId,
            name: roomId,
            status: 'lobby',
            hostId: null,
            createdAt: Date.now(),
            metadata: {},
            players: new Map(),
            clients: new Set(),
            pendingRemovals: new Map()
        });
    }
    return rooms.get(roomId);
}

function sanitizeRoomId(value) {
    return (value || 'room')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 32) || `room-${Math.random().toString(36).slice(2, 8)}`;
}

function serializeRoom(room) {
    return {
        id: room.id,
        name: room.name,
        status: room.status,
        hostId: room.hostId,
        createdAt: room.createdAt,
        metadata: room.metadata,
        players: [...room.players.values()].map(player => ({
            playerId: player.playerId,
            playerName: player.playerName,
            connected: player.connected
        })),
        playerCount: room.players.size
    };
}

function syncRoomList() {
    const payload = JSON.stringify({
        type: 'room_list',
        payload: {
            rooms: [...rooms.values()]
                .filter(room => room.players.size > 0 || room.status === 'lobby')
                .map(serializeRoom)
        }
    });

    for (const client of wss.clients) {
        if (client.readyState === OPEN_STATE) {
            client.send(payload);
        }
    }
}

function broadcast(roomId, message, except = null) {
    const payload = JSON.stringify(message);
    for (const client of getRoom(roomId).clients) {
        if (client === except) continue;
        if (client.readyState === OPEN_STATE) {
            client.send(payload);
        }
    }
}

function send(ws, type, payload = {}) {
    if (ws.readyState === OPEN_STATE) {
        ws.send(JSON.stringify({ type, payload }));
    }
}

function updateRoomClients(roomId) {
    const room = getRoom(roomId);
    broadcast(roomId, {
        type: 'room_updated',
        payload: {
            room: serializeRoom(room)
        }
    });
    syncRoomList();
}

function ensurePlayerInRoom(room, playerId, playerName) {
    const pendingRemoval = room.pendingRemovals.get(playerId);
    if (pendingRemoval) {
        clearTimeout(pendingRemoval);
        room.pendingRemovals.delete(playerId);
    }

    const existing = room.players.get(playerId) || {
        playerId,
        playerName: playerName || playerId,
        connected: true
    };

    existing.playerName = playerName || existing.playerName;
    existing.connected = true;
    existing.lastSeenAt = Date.now();
    room.players.set(playerId, existing);

    if (!room.hostId) {
        room.hostId = playerId;
    }
}

function joinRoom(ws, roomId, playerId, playerName, options = {}) {
    const room = getRoom(roomId);
    room.name = options.roomName || room.name || roomId;
    room.metadata = options.metadata || room.metadata || {};
    room.clients.add(ws);
    ws.roomId = room.id;
    ws.playerId = playerId;

    ensurePlayerInRoom(room, playerId, playerName);

    send(ws, 'room_joined', {
        room: serializeRoom(room)
    });

    broadcast(room.id, {
        type: 'peer_joined',
        payload: {
            playerId
        }
    }, ws);

    updateRoomClients(room.id);
    return room;
}

function removePlayerFromRoom(roomId, playerId) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.players.delete(playerId);
    const pendingRemoval = room.pendingRemovals.get(playerId);
    if (pendingRemoval) {
        clearTimeout(pendingRemoval);
        room.pendingRemovals.delete(playerId);
    }

    if (room.hostId === playerId) {
        room.hostId = room.players.keys().next().value || null;
    }

    broadcast(roomId, {
        type: 'peer_left',
        payload: {
            playerId
        }
    });

    if (room.players.size === 0 && room.clients.size === 0) {
        rooms.delete(roomId);
        syncRoomList();
        return;
    }

    updateRoomClients(roomId);
}

const wss = new WebSocketServer({ port });

wss.on('connection', ws => {
    ws.roomId = null;
    ws.playerId = null;

    ws.on('message', raw => {
        let data;
        try {
            data = JSON.parse(raw.toString());
        } catch {
            return;
        }

        if (data.type === 'list_rooms') {
            send(ws, 'room_list', {
                rooms: [...rooms.values()].map(serializeRoom)
            });
            return;
        }

        if (data.type === 'create_room') {
            const roomId = sanitizeRoomId(data.payload.roomName);
            const room = getRoom(roomId);
            room.name = data.payload.roomName || roomId;
            room.metadata = data.payload.metadata || {};
            room.status = 'lobby';
            joinRoom(ws, roomId, data.payload.playerId, data.payload.playerName, {
                roomName: room.name,
                metadata: room.metadata
            });
            return;
        }

        if (data.type === 'join_room') {
            const roomId = sanitizeRoomId(data.payload.roomId);
            if (!rooms.has(roomId)) {
                send(ws, 'error', {
                    message: 'Oda bulunamadi.',
                    code: 'ROOM_NOT_FOUND'
                });
                return;
            }
            joinRoom(ws, roomId, data.payload.playerId, data.payload.playerName);
            return;
        }

        if (data.type === 'leave_room') {
            const roomId = ws.roomId || sanitizeRoomId(data.payload.roomId);
            const playerId = ws.playerId || data.payload.playerId;
            const room = rooms.get(roomId);
            if (room) {
                room.clients.delete(ws);
            }
            ws.roomId = null;
            ws.playerId = null;
            removePlayerFromRoom(roomId, playerId);
            send(ws, 'room_left', { roomId, playerId });
            return;
        }

        if (data.type === 'start_room') {
            const roomId = sanitizeRoomId(data.payload.roomId);
            const room = rooms.get(roomId);
            if (!room) {
                send(ws, 'error', {
                    message: 'Oda bulunamadi.',
                    code: 'ROOM_NOT_FOUND'
                });
                return;
            }
            if (room.hostId !== data.payload.playerId) {
                send(ws, 'error', {
                    message: 'Sadece oda sahibi baslatabilir.',
                    code: 'NOT_HOST'
                });
                return;
            }
            room.status = 'running';
            broadcast(roomId, {
                type: 'room_started',
                payload: {
                    room: serializeRoom(room)
                }
            });
            syncRoomList();
            return;
        }

        if (data.type === 'hello') {
            joinRoom(
                ws,
                sanitizeRoomId(data.payload.roomId),
                data.payload.playerId,
                data.payload.playerName || data.payload.playerId,
                {
                    roomName: data.payload.roomId
                }
            );
            return;
        }

        if (!ws.roomId) return;

        if (data.type === 'command' || data.type === 'state' || data.type === 'replay') {
            broadcast(ws.roomId, {
                type: data.type,
                payload: {
                    playerId: ws.playerId,
                    ...data.payload
                }
            }, ws);
        }
    });

    ws.on('close', () => {
        if (ws.roomId) {
            const room = rooms.get(ws.roomId);
            if (!room) return;

            room.clients.delete(ws);

            if (!ws.playerId) return;

            const timeout = setTimeout(() => {
                removePlayerFromRoom(ws.roomId, ws.playerId);
            }, disconnectGraceMs);

            room.pendingRemovals.set(ws.playerId, timeout);
            const player = room.players.get(ws.playerId);
            if (player) {
                player.connected = false;
                player.lastSeenAt = Date.now();
                updateRoomClients(ws.roomId);
            }
        }
    });
});

console.log(`network server listening on ws://localhost:${port}`);
