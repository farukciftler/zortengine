export class AssetPipeline {
    constructor(options = {}) {
        this.manifest = options.manifest;
        this.loader = options.loader;
        this.store = options.store || null;
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

    async preloadGroup(group = 'default', options = {}) {
        const assets = this.manifest?.getGroup?.(group) || [];
        const total = assets.length || 1;
        let loaded = 0;

        for (const asset of assets) {
            if (this.store?.load) {
                await this.store.load(asset, {
                    owner: options.owner || `group:${group}`,
                    signal: options.signal,
                    onProgress: progress => options.onProgress?.({
                        ...progress,
                        loaded: loaded + progress.loaded,
                        total
                    })
                });
            } else {
                await this.loader.load(asset, options);
            }
            loaded += 1;
            options.onProgress?.({
                id: asset.id,
                loaded,
                total
            });
        }
        return assets.length;
    }
}
