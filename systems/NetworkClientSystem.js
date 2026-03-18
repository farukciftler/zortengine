import { WebSocketTransport } from '../utils/WebSocketTransport.js';

export class NetworkClientSystem {
    constructor(options = {}) {
        this.url = options.url || null;
        this.roomId = options.roomId || 'default-room';
        this.playerId = options.playerId || `player-${Math.random().toString(36).slice(2, 8)}`;
        this.autoConnect = options.autoConnect ?? true;
        this.onMessage = options.onMessage || null;
        this.onPeerJoined = options.onPeerJoined || null;
        this.onPeerLeft = options.onPeerLeft || null;
        this.transport = new WebSocketTransport({
            url: this.url,
            socketFactory: options.socketFactory
        });

        this.transport.on('open', () => {
            this.transport.send('hello', {
                roomId: this.roomId,
                playerId: this.playerId
            });
        });
        this.transport.on('message', message => this._handleMessage(message));
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

    send(type, payload = {}) {
        this.transport.send(type, payload);
    }

    sendCommand(command) {
        this.send('command', command);
    }

    sendState(state) {
        this.send('state', state);
    }

    _handleMessage(message) {
        if (message.type === 'peer_joined' && this.onPeerJoined) {
            this.onPeerJoined(message.payload);
        }

        if (message.type === 'peer_left' && this.onPeerLeft) {
            this.onPeerLeft(message.payload);
        }

        if (this.onMessage) {
            this.onMessage(message);
        }
    }
}
