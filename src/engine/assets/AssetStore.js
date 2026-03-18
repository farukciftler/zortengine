export class AssetStore {
    constructor(options = {}) {
        this.loader = options.loader || null;
        this.records = new Map();
        this.ownerIndex = new Map();
    }

    setLoader(loader) {
        this.loader = loader;
        return this;
    }

    has(id) {
        return this.records.has(id);
    }

    get(id) {
        const record = this.records.get(id);
        if (!record || !record.resource) return null;
        return this.#toHandle(record);
    }

    async load(definition, options = {}) {
        if (!definition?.id) {
            throw new Error('Asset definition id gerekli.');
        }

        let record = this.records.get(definition.id);
        if (record?.resource) {
            this.retain(definition.id, options.owner);
            return this.#toHandle(record);
        }

        if (!record) {
            record = {
                definition,
                resource: null,
                promise: null,
                owners: new Set(),
                retainCount: 0
            };
            this.records.set(definition.id, record);
        }

        if (!record.promise) {
            if (!this.loader?.load) {
                throw new Error(`Asset '${definition.id}' icin loader tanimli degil.`);
            }

            record.promise = Promise.resolve(this.loader.load(definition, options))
                .then(resource => {
                    record.resource = resource;
                    record.promise = null;
                    return resource;
                })
                .catch(error => {
                    record.promise = null;
                    if (!record.resource && record.retainCount === 0) {
                        this.records.delete(definition.id);
                    }
                    throw error;
                });
        }

        const resource = await record.promise;
        this.retain(definition.id, options.owner);
        options.onProgress?.({ loaded: 1, total: 1, id: definition.id });
        return this.#toHandle(record, resource);
    }

    retain(id, owner = 'global') {
        const record = this.records.get(id);
        if (!record) return null;

        record.retainCount += 1;
        record.owners.add(owner);

        if (!this.ownerIndex.has(owner)) {
            this.ownerIndex.set(owner, new Set());
        }
        this.ownerIndex.get(owner).add(id);

        return this.#toHandle(record);
    }

    release(id, options = {}) {
        const record = this.records.get(id);
        if (!record) return false;

        const owner = options.owner || 'global';
        if (record.owners.has(owner)) {
            record.owners.delete(owner);
            this.ownerIndex.get(owner)?.delete(id);
            if (this.ownerIndex.get(owner)?.size === 0) {
                this.ownerIndex.delete(owner);
            }
        }

        record.retainCount = Math.max(0, record.retainCount - 1);
        if (record.retainCount === 0 && options.dispose !== false) {
            return this.dispose(id);
        }
        return true;
    }

    releaseOwner(owner, options = {}) {
        const ids = [...(this.ownerIndex.get(owner) || [])];
        ids.forEach(id => this.release(id, { owner, dispose: options.dispose }));
        return ids.length;
    }

    dispose(id) {
        const record = this.records.get(id);
        if (!record) return false;

        if (this.loader?.dispose) {
            this.loader.dispose(record.resource, record.definition);
        } else {
            this.loader?.getCapability?.(record.definition.type)?.dispose?.(record.resource, record.definition);
        }

        for (const owner of record.owners) {
            this.ownerIndex.get(owner)?.delete(id);
            if (this.ownerIndex.get(owner)?.size === 0) {
                this.ownerIndex.delete(owner);
            }
        }

        this.records.delete(id);
        return true;
    }

    #toHandle(record, resource = record.resource) {
        return {
            id: record.definition.id,
            definition: record.definition,
            resource,
            retainCount: record.retainCount
        };
    }
}
