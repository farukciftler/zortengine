export class Component {
    constructor() {
        this.owner = null;
        this.enabled = true;
    }

    onAttach(owner) {
        this.owner = owner;
    }

    onDetach() {
        this.owner = null;
    }

    update(delta, time) {
        // Override in subclasses.
    }
}
