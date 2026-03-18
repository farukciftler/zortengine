export type AssetType = 'texture' | 'model' | 'audio' | 'json' | 'text' | 'binary' | 'custom';

export interface AssetDefinitionBase {
    id: string;
    url: string;
    group?: string;
    preload?: boolean;
    metadata?: Record<string, unknown>;
}

export interface TextureAssetDefinition extends AssetDefinitionBase {
    type: 'texture';
}

export interface ModelAssetDefinition extends AssetDefinitionBase {
    type: 'model';
}

export interface AudioAssetDefinition extends AssetDefinitionBase {
    type: 'audio';
}

export interface CustomAssetDefinition extends AssetDefinitionBase {
    type: 'custom' | 'json' | 'text' | 'binary';
    loader?: string;
}

export type AssetDefinition =
    | TextureAssetDefinition
    | ModelAssetDefinition
    | AudioAssetDefinition
    | CustomAssetDefinition;

export interface AssetHandle<TResource = unknown> {
    id: string;
    definition: AssetDefinition;
    resource: TResource;
    retainCount: number;
}

export interface AssetStoreContract {
    has(id: string): boolean;
    get<TResource = unknown>(id: string): AssetHandle<TResource> | null;
    load<TResource = unknown>(
        definition: AssetDefinition,
        options?: {
            owner?: string;
            signal?: AbortSignal;
            onProgress?: (progress: { loaded: number; total: number; id: string }) => void;
        }
    ): Promise<AssetHandle<TResource>>;
    retain(id: string, owner?: string): AssetHandle | null;
    release(id: string, options?: { owner?: string; dispose?: boolean }): boolean;
    releaseOwner(owner: string, options?: { dispose?: boolean }): number;
    dispose(id: string): boolean;
}
