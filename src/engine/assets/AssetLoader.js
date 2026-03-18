export class AssetLoader {
    constructor(options = {}) {
        this.capabilities = new Map();
        this.cache = new Map();
        this.disposer = options.dispose || null;
    }

    registerCapability(type, capability) {
        if (!type || !capability?.load) return this;
        this.capabilities.set(type, capability);
        return this;
    }

    getCapability(type) {
        return this.capabilities.get(type) || null;
    }

    async load(definition, options = {}) {
        if (!definition?.id) {
            throw new Error('Asset definition id gerekli.');
        }

        if (this.cache.has(definition.id)) {
            return this.cache.get(definition.id);
        }

        const capability = this.getCapability(definition.type);
        if (!capability) {
            throw new Error(`Asset type '${definition.type}' icin capability tanimli degil.`);
        }

        const resource = await capability.load(definition, options);
        this.cache.set(definition.id, resource);
        return resource;
    }

    dispose(resource, definition) {
        const capability = definition ? this.getCapability(definition.type) : null;
        capability?.dispose?.(resource, definition);
        this.disposer?.(resource, definition);
    }

    async loadTexture(name, url, options = {}) {
        return this.load({ id: name, url, type: 'texture' }, options);
    }

    async loadModel(name, url, options = {}) {
        return this.load({ id: name, url, type: 'model' }, options);
    }

    get(name) {
        return this.cache.get(name) || null;
    }

    getTexture(name) {
        return this.get(name);
    }

    getModel(name) {
        return this.get(name);
    }

    async loadMultiple(assetsConfig, options = {}) {
        const promises = [];
        if (assetsConfig.textures) {
            for (const [name, url] of Object.entries(assetsConfig.textures)) {
                promises.push(this.loadTexture(name, url, options));
            }
        }
        if (assetsConfig.models) {
            for (const [name, url] of Object.entries(assetsConfig.models)) {
                promises.push(this.loadModel(name, url, options));
            }
        }
        await Promise.all(promises);
    }
}
