export class StateMachine {
    constructor() {
        this.states = {};
        this.currentState = null;
    }

    addState(name, config) {
        this.states[name] = {
            name,
            onEnter: config.onEnter || null,
            onUpdate: config.onUpdate || null,
            onExit: config.onExit || null
        };
    }

    setState(name) {
        if (!this.states[name]) {
            console.warn(`Durum bulunamadı: ${name}`);
            return;
        }

        if (this.currentState && this.currentState.name === name) {
            return;
        }

        if (this.currentState && this.currentState.onExit) {
            this.currentState.onExit();
        }

        this.currentState = this.states[name];

        if (this.currentState.onEnter) {
            this.currentState.onEnter();
        }
    }

    update(delta, time) {
        if (this.currentState && this.currentState.onUpdate) {
            this.currentState.onUpdate(delta, time);
        }
    }

    getCurrentState() {
        return this.currentState ? this.currentState.name : null;
    }
}
