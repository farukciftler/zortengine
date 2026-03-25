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
            }),
            dispose: resource => {
                if (resource && typeof resource.stop === 'function') resource.stop();
                // Audio buffers are handled by the browser/Web Audio API, 
                // but we can clear references if needed.
            }
        });

        this.registerCapability('model', {
            load: async definition => {
                const loader = await this.#getGltfLoader();
                return new Promise((resolve, reject) => {
                    loader.load(definition.url, resolve, undefined, reject);
                });
            },
            dispose: resource => {
                if (!resource || !resource.scene) return;
                
                // Deep disposal of GLTF scene resources
                resource.scene.traverse(node => {
                    if (node.isMesh) {
                        node.geometry?.dispose();
                        if (Array.isArray(node.material)) {
                            node.material.forEach(m => m.dispose());
                        } else {
                            node.material?.dispose();
                        }
                    }
                });
                
                // Remove from parent if still attached
                if (resource.scene.parent) {
                    resource.scene.parent.remove(resource.scene);
                }
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
