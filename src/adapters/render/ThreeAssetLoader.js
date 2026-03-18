import * as THREE from 'three';
import { AssetLoader } from '../../engine/assets/AssetLoader.js';

export class ThreeAssetLoader extends AssetLoader {
    constructor(options = {}) {
        super(options);
        this.textureLoader = options.textureLoader || new THREE.TextureLoader();
        this.audioLoader = options.audioLoader || new THREE.AudioLoader();
        this.gltfLoaderPromise = null;

        this.registerCapability('texture', {
            load: definition => new Promise((resolve, reject) => {
                this.textureLoader.load(definition.url, resolve, undefined, reject);
            }),
            dispose: resource => resource?.dispose?.()
        });

        this.registerCapability('audio', {
            load: definition => new Promise((resolve, reject) => {
                this.audioLoader.load(definition.url, resolve, undefined, reject);
            })
        });

        this.registerCapability('model', {
            load: async definition => {
                const loader = await this.#getGltfLoader();
                return new Promise((resolve, reject) => {
                    loader.load(definition.url, resolve, undefined, reject);
                });
            }
        });
    }

    async #getGltfLoader() {
        if (!this.gltfLoaderPromise) {
            this.gltfLoaderPromise = import('three/examples/jsm/loaders/GLTFLoader.js')
                .then(({ GLTFLoader }) => new GLTFLoader());
        }
        return this.gltfLoaderPromise;
    }
}
