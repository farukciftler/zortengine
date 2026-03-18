import { EventEmitter } from 'zortengine';
import { WebSocketTransport } from 'zortengine/networking';

export class RoomSessionClient {
    constructor(options = {}) {
        this.playerName = options.playerName || 'Oyuncu';
        this.playerId = options.playerId || `player-${Math.random().toString(36).slice(2, 8)}`;
        this.transport = new WebSocketTransport({
            url: options.url,
            socketFactory: options.socketFactory
        });
        this.events = new EventEmitter();
        this.rooms = [];
        this.currentRoom = null;

        this.transport.on('open', () => {
            this.listRooms();
            this.events.emit('connected');
        });
        this.transport.on('close', () => {
            this.events.emit('disconnected');
        });
        this.transport.on('message', message => this._handleMessage(message));
        this.transport.on('error', error => this.events.emit('error', error));
    }

    connect() {
        return this.transport.connect();
    }

    disconnect() {
        this.transport.disconnect();
    }

    on(eventName, listener) {
        this.events.on(eventName, listener);
    }

    off(eventName, listener) {
        this.events.off(eventName, listener);
    }

    setPlayerName(name) {
        this.playerName = name || this.playerName;
    }

    listRooms() {
        this.transport.send('list_rooms');
    }

    createRoom(roomName, options = {}) {
        this.transport.send('create_room', {
            roomName,
            playerId: this.playerId,
            playerName: this.playerName,
            metadata: options.metadata || {}
        });
    }

    joinRoom(roomId) {
        this.transport.send('join_room', {
            roomId,
            playerId: this.playerId,
            playerName: this.playerName
        });
    }

    leaveRoom() {
        if (!this.currentRoom) return;
        this.transport.send('leave_room', {
            roomId: this.currentRoom.id,
            playerId: this.playerId
        });
    }

    startRoom() {
        if (!this.currentRoom) return;
        this.transport.send('start_room', {
            roomId: this.currentRoom.id,
            playerId: this.playerId
        });
    }

    _handleMessage(message) {
        if (message.type === 'room_list') {
            this.rooms = message.payload.rooms || [];
            this.events.emit('room_list', this.rooms);
        }

        if (message.type === 'room_joined') {
            this.currentRoom = message.payload.room;
            this.events.emit('room_joined', this.currentRoom);
        }

        if (message.type === 'room_updated') {
            this.currentRoom = message.payload.room;
            this.events.emit('room_updated', this.currentRoom);
        }

        if (message.type === 'room_left') {
            this.currentRoom = null;
            this.events.emit('room_left', message.payload);
        }

        if (message.type === 'room_started') {
            this.currentRoom = message.payload.room;
            this.events.emit('room_started', this.currentRoom);
        }

        if (message.type === 'error') {
            this.events.emit('error', message.payload);
        }
    }
}
