import * as THREE from 'three';

export class AnimationManager {
    constructor(modelGroup) {
        this.mixer = new THREE.AnimationMixer(modelGroup);
        this.actions = {};
        this.activeAction = null;
    }

    add(name, clip) {
        const action = this.mixer.clipAction(clip);
        this.actions[name] = action;
    }

    play(name, fadeTime = 0.2) {
        const nextAction = this.actions[name];
        if (!nextAction || this.activeAction === nextAction) return;

        nextAction.reset().play();

        if (this.activeAction) {
            nextAction.crossFadeFrom(this.activeAction, fadeTime, true);
        }

        this.activeAction = nextAction;
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}
