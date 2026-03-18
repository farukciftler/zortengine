export class AssetManifest {
    constructor() {
        this.assets = new Map();
        this.groups = new Map();
    }

    register(id, definition = {}) {
        if (!id) return null;
        const entry = {
            id,
            url: definition.url || '',
            type: definition.type || 'unknown',
            group: definition.group || 'default',
            preload: definition.preload ?? false,
            metadata: definition.metadata || {}
        };

        this.assets.set(id, entry);
        if (!this.groups.has(entry.group)) {
            this.groups.set(entry.group, new Set());
        }
        this.groups.get(entry.group).add(id);
        return entry;
    }

    get(id) {
        return this.assets.get(id) || null;
    }

    getGroup(group = 'default') {
        return [...(this.groups.get(group) || [])].map(id => this.assets.get(id));
    }

    serialize() {
        return {
            assets: [...this.assets.values()]
        };
    }
}
