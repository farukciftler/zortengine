import * as THREE from 'three';

export class AssetLoader {
    constructor() {
        this.textures = new Map();
        this.models = new Map();
        
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = null;
    }

    loadTexture(name, url) {
        return new Promise((resolve, reject) => {
            if (this.textures.has(name)) {
                resolve(this.textures.get(name));
                return;
            }
            
            this.textureLoader.load(url, 
                (texture) => {
                    this.textures.set(name, texture);
                    resolve(texture);
                },
                undefined,
                (err) => {
                    console.error(`Texture failed to load: ${url}`);
                    reject(err);
                }
            );
        });
    }

    loadModel(name, url) {
        return new Promise((resolve, reject) => {
            if (this.models.has(name)) {
                resolve(this.models.get(name));
                return;
            }

            this._getGltfLoader()
                .then(loader => {
                    loader.load(url,
                        (gltf) => {
                            this.models.set(name, gltf);
                            resolve(gltf);
                        },
                        undefined,
                        (err) => {
                            console.error(`Model failed to load: ${url}`);
                            reject(err);
                        }
                    );
                })
                .catch(reject);
        });
    }

    getTexture(name) {
        return this.textures.get(name) || null;
    }

    getModel(name) {
        return this.models.get(name) || null;
    }
    
    // Yükleme ekranı vb. için çoklu obje yükleme desteği
    async loadMultiple(assetsConfig) {
        const promises = [];
        if (assetsConfig.textures) {
            for (const [name, url] of Object.entries(assetsConfig.textures)) {
                promises.push(this.loadTexture(name, url));
            }
        }
        if (assetsConfig.models) {
            for (const [name, url] of Object.entries(assetsConfig.models)) {
                promises.push(this.loadModel(name, url));
            }
        }
        await Promise.all(promises);
    }

    async _getGltfLoader() {
        if (this.gltfLoader) {
            return this.gltfLoader;
        }

        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        this.gltfLoader = new GLTFLoader();
        return this.gltfLoader;
    }
}