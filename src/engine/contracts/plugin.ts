export type PluginScope = 'engine' | 'scene';

export interface PluginManifest {
    id: string;
    displayName?: string;
    version?: string;
    scope?: PluginScope;
    capabilities?: string[];
    dependencies?: string[];
    optionalDependencies?: string[];
}

export interface PluginContext<THost = unknown> {
    host: THost;
    scope: PluginScope;
    hasCapability(capability: string): boolean;
    getPlugin<TPluginApi = unknown>(id: string): TPluginApi | null;
}

export interface EnginePlugin<THost = unknown, TApi = unknown> {
    manifest: PluginManifest;
    install(context: PluginContext<THost>, options?: Record<string, unknown>): TApi;
}
