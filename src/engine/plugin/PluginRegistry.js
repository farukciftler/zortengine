function normalizeManifest(plugin) {
    const manifest = plugin?.manifest || {};
    const id = manifest.id || plugin?.id;
    if (!id) {
        throw new Error('Plugin manifest.id gerekli.');
    }

    return {
        id,
        displayName: manifest.displayName || id,
        version: manifest.version || '0.0.0',
        scope: manifest.scope || 'engine',
        capabilities: [...new Set(manifest.capabilities || [])],
        dependencies: [...new Set(manifest.dependencies || [])],
        optionalDependencies: [...new Set(manifest.optionalDependencies || [])]
    };
}

export class PluginRegistry {
    constructor(host, options = {}) {
        this.host = host;
        this.scope = options.scope || 'engine';
        this.events = options.events || null;
        this.parent = options.parent || null;
        this.entries = new Map();
        this.capabilities = new Set(options.capabilities || []);
    }

    use(plugin, options = {}) {
        const manifest = normalizeManifest(plugin);

        if (manifest.scope !== this.scope) {
            throw new Error(
                `Plugin '${manifest.id}' ${manifest.scope} scope bekliyor, ${this.scope} host'una kurulamaz.`
            );
        }

        if (this.entries.has(manifest.id)) {
            return this.entries.get(manifest.id).api;
        }

        this.#assertDependencies(manifest);

        const context = {
            host: this.host,
            scope: this.scope,
            hasCapability: capability => this.hasCapability(capability),
            getPlugin: id => this.getPlugin(id)
        };

        const api = typeof plugin.install === 'function'
            ? plugin.install(context, options)
            : this.host;

        const entry = { manifest, plugin, api, options };
        this.entries.set(manifest.id, entry);
        manifest.capabilities.forEach(capability => this.capabilities.add(capability));
        this.events?.emit?.('plugin:installed', {
            pluginId: manifest.id,
            scope: this.scope
        });
        return api;
    }

    hasCapability(capability) {
        return this.capabilities.has(capability) || this.parent?.hasCapability?.(capability) || false;
    }

    getPlugin(id) {
        return this.entries.get(id)?.api || this.parent?.getPlugin?.(id) || null;
    }

    list() {
        return [...this.entries.values()].map(entry => entry.manifest);
    }

    #assertDependencies(manifest) {
        for (const dependency of manifest.dependencies) {
            if (!this.getPlugin(dependency)) {
                throw new Error(`Plugin '${manifest.id}' icin gerekli bagimlilik eksik: '${dependency}'.`);
            }
        }
    }
}
