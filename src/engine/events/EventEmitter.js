export class EventEmitter {
    constructor() {
        this.events = {};
        this.anyListeners = [];
    }

    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
    }

    onAny(listener) {
        this.anyListeners.push(listener);
    }

    off(eventName, listener) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(l => l !== listener);
    }

    offAny(listener) {
        this.anyListeners = this.anyListeners.filter(l => l !== listener);
    }

    emit(eventName, ...args) {
        this.anyListeners.forEach(listener => listener(eventName, ...args));
        if (this.events[eventName]) {
            this.events[eventName].forEach(listener => listener(...args));
        }
    }
}
