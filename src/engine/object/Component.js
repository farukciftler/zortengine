export class Component {
    constructor() {
        this.owner = null;
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
