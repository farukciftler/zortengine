import * as THREE from 'three';

export class AnimationManager {
    constructor(modelGroup) {
        // Modele bağlı bir mikser oluşturuyoruz
        this.mixer = new THREE.AnimationMixer(modelGroup);
        this.actions = {};
        this.activeAction = null;
    }

    // GLTF içinden gelen animasyon klibini kaydet
    add(name, clip) {
        const action = this.mixer.clipAction(clip);
        this.actions[name] = action;
    }

    // Animasyonu yumuşak geçişle (fade) oynat
    play(name, fadeTime = 0.2) {
        const nextAction = this.actions[name];
        if (!nextAction || this.activeAction === nextAction) return;

        nextAction.reset().play();

        // Eski animasyondan yeni animasyona yavaşça geç
        if (this.activeAction) {
            nextAction.crossFadeFrom(this.activeAction, fadeTime, true);
        }

        this.activeAction = nextAction;
    }

    // Her frame güncellenmeli
    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}