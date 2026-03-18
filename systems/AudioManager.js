import * as THREE from 'three';

export class AudioManager {
    constructor(camera) {
        this.listener = null;
        try {
            this.listener = new THREE.AudioListener();

            // Eğer camera bir wrapper ise, içindeki THREE kamerasını alalım
            const threeCam = camera.getThreeCamera ? camera.getThreeCamera() : camera;
            threeCam?.add?.(this.listener);
        } catch {
            this.listener = null;
        }

        this.audioLoader = new THREE.AudioLoader();
        this.audioBuffers = new Map();
    }

    // Sesi internetten veya lokalden yükleyip hafızaya alır
    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            if (this.audioBuffers.has(name)) {
                resolve(this.audioBuffers.get(name));
                return;
            }
            this.audioLoader.load(url, (buffer) => {
                this.audioBuffers.set(name, buffer);
                resolve(buffer);
            }, undefined, reject);
        });
    }

    // Nesnenin üzerine 3D ses ekler (uzaklaştıkça azalan ses)
    createPositionalAudio(name, object, options = {}) {
        if (!this.listener) return null;
        if (!this.audioBuffers.has(name)) {
            console.warn(`Ses bulunamadı: ${name}. Önce loadSound ile yükleyin.`);
            return null;
        }

        const sound = new THREE.PositionalAudio(this.listener);
        sound.setBuffer(this.audioBuffers.get(name));
        sound.setRefDistance(options.refDistance || 5); // Sesin azalmaya başlayacağı mesafe
        sound.setMaxDistance(options.maxDistance || 50); // Sesin tamamen duyulmaz olacağı mesafe
        sound.setVolume(options.volume || 1);
        sound.setLoop(options.loop !== undefined ? options.loop : false);
        
        // Sesi Three.js objesine bağla
        if (object.mesh) object.mesh.add(sound);
        else if (object.group) object.group.add(sound);
        else object.add(sound);

        return sound;
    }

    // Sahneden bağımsız global ses (Arka plan müziği veya UI sesi)
    playGlobal(name, options = {}) {
        if (!this.listener) return null;
        if (!this.audioBuffers.has(name)) return;
        
        const sound = new THREE.Audio(this.listener);
        sound.setBuffer(this.audioBuffers.get(name));
        sound.setVolume(options.volume || 1);
        sound.setLoop(options.loop || false);
        sound.play();
        return sound;
    }
}