import { EventEmitter } from './EventEmitter.js';

export class WebSocketTransport {
    constructor(options = {}) {
        this.url = options.url || null;
        this.socketFactory = options.socketFactory || (url => new WebSocket(url));
        this.events = new EventEmitter();
        this.socket = null;
        this.connected = false;
        this.outbox = [];
    }

    connect() {
        if (!this.url || typeof WebSocket === 'undefined' || this.socket) return false;

        this.socket = this.socketFactory(this.url);
        this.socket.addEventListener('open', () => {
            this.connected = true;
            this._flushOutbox();
            this.events.emit('open');
        });

        this.socket.addEventListener('message', event => {
            let message = null;
            try {
                message = JSON.parse(event.data);
            } catch {
                message = null;
            }
            if (message) {
                this.events.emit('message', message);
            }
        });

        this.socket.addEventListener('close', () => {
            this.connected = false;
            this.socket = null;
            this.events.emit('close');
        });

        this.socket.addEventListener('error', error => {
            this.events.emit('error', error);
        });

        return true;
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
        this.socket = null;
        this.connected = false;
    }

    send(type, payload = {}) {
        const message = JSON.stringify({ type, payload });
        if (!this.connected || !this.socket) {
            this.outbox.push(message);
            return false;
        }
        this.socket.send(message);
        return true;
    }

    on(eventName, listener) {
        this.events.on(eventName, listener);
    }

    off(eventName, listener) {
        this.events.off(eventName, listener);
    }

    _flushOutbox() {
        while (this.connected && this.socket && this.outbox.length > 0) {
            this.socket.send(this.outbox.shift());
        }
    }
}
