import { EventEmitter } from '../utils/EventEmitter.js';
import { WebSocketTransport } from '../utils/WebSocketTransport.js';

export class RoomClientSystem {
    constructor(options = {}) {
        this.url = options.url || null;
        this.playerName = options.playerName || 'Oyuncu';
        this.playerId = options.playerId || `player-${Math.random().toString(36).slice(2, 8)}`;
        this.autoConnect = options.autoConnect ?? true;
        this.events = new EventEmitter();
        this.rooms = [];
        this.currentRoom = null;
        this.transport = new WebSocketTransport({
            url: this.url,
            socketFactory: options.socketFactory
        });

        this.transport.on('open', () => {
            this.listRooms();
            this.events.emit('connected');
        });
        this.transport.on('message', message => this._handleMessage(message));
        this.transport.on('close', () => {
            this.events.emit('disconnected');
        });
    }

    onAttach() {
        if (this.autoConnect) {
            this.connect();
        }
    }

    onDetach() {
        this.disconnect();
    }

    connect() {
        this.transport.connect();
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
        this._send('list_rooms');
    }

    createRoom(roomName, options = {}) {
        this._send('create_room', {
            roomName,
            playerId: this.playerId,
            playerName: this.playerName,
            metadata: options.metadata || {}
        });
    }

    joinRoom(roomId) {
        this._send('join_room', {
            roomId,
            playerId: this.playerId,
            playerName: this.playerName
        });
    }

    leaveRoom() {
        if (!this.currentRoom) return;
        this._send('leave_room', {
            roomId: this.currentRoom.id,
            playerId: this.playerId
        });
    }

    startRoom() {
        if (!this.currentRoom) return;
        this._send('start_room', {
            roomId: this.currentRoom.id,
            playerId: this.playerId
        });
    }

    _send(type, payload = {}) {
        this.transport.send(type, payload);
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
