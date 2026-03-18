export class EventEmitter {
    constructor() {
        this.events = {};
    }

    // Bir olayı dinlemeye başla (Subscribe)
    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
    }

    // Bir olayı dinlemeyi bırak (Unsubscribe)
    off(eventName, listener) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(l => l !== listener);
    }

    // Bir olayı tetikle (Publish)
    emit(eventName, ...args) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(listener => listener(...args));
        }
    }
}