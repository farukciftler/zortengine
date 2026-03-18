import * as THREE from 'three';

export class AudioManager {
    constructor(camera) {
        this.listener = null;
        try {
            this.listener = new THREE.AudioListener();

            const threeCam = camera.getNativeCamera ? camera.getNativeCamera() : (camera.getThreeCamera ? camera.getThreeCamera() : camera);
            threeCam?.add?.(this.listener);
        } catch {
            this.listener = null;
        }

        this.audioLoader = new THREE.AudioLoader();
        this.audioBuffers = new Map();
    }

    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            if (this.audioBuffers.has(name)) {
                resolve(this.audioBuffers.get(name));
                return;
            }
            this.audioLoader.load(url, buffer => {
                this.audioBuffers.set(name, buffer);
                resolve(buffer);
            }, undefined, reject);
        });
    }

    createPositionalAudio(name, object, options = {}) {
        if (!this.listener) return null;
        if (!this.audioBuffers.has(name)) {
            console.warn(`Ses bulunamadi: ${name}. Once loadSound ile yukleyin.`);
            return null;
        }

        const sound = new THREE.PositionalAudio(this.listener);
        sound.setBuffer(this.audioBuffers.get(name));
        sound.setRefDistance(options.refDistance || 5);
        sound.setMaxDistance(options.maxDistance || 50);
        sound.setVolume(options.volume || 1);
        sound.setLoop(options.loop !== undefined ? options.loop : false);

        if (object.mesh) object.mesh.add(sound);
        else if (object.group) object.group.add(sound);
        else object.add(sound);

        return sound;
    }

    playGlobal(name, options = {}) {
        if (!this.listener) return null;
        if (!this.audioBuffers.has(name)) return null;

        const sound = new THREE.Audio(this.listener);
        sound.setBuffer(this.audioBuffers.get(name));
        sound.setVolume(options.volume || 1);
        sound.setLoop(options.loop || false);
        sound.play();
        return sound;
    }
}
