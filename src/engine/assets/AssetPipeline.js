export class AssetPipeline {
    constructor(options = {}) {
        this.manifest = options.manifest;
        this.loader = options.loader;
    }

    validateManifest() {
        const errors = [];
        for (const asset of this.manifest?.assets?.values?.() || []) {
            if (!asset.id) errors.push('Asset id missing');
            if (!asset.url) errors.push(`Asset '${asset.id}' url missing`);
            if (!asset.type || asset.type === 'unknown') errors.push(`Asset '${asset.id}' type missing`);
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }

    async preloadGroup(group = 'default') {
        const assets = this.manifest?.getGroup?.(group) || [];
        for (const asset of assets) {
            if (asset.type === 'texture') {
                await this.loader.loadTexture(asset.id, asset.url);
            }
            if (asset.type === 'model') {
                await this.loader.loadModel(asset.id, asset.url);
            }
        }
        return assets.length;
    }
}
