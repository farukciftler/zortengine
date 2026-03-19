import type { EventBus, EventMap } from './events.js';
import type {
    AssetDefinition,
    AssetHandle,
    AssetStoreContract
} from './assets.js';
import type {
    CameraHandle,
    PostProcessorHandle,
    SceneHandle,
    TransformLike
} from './render.js';
import type { EnginePlugin, PluginScope } from './plugin.js';

export interface Snapshot {
    [key: string]: unknown;
}

export interface PlatformContract {
    getViewportSize(): { width: number; height: number };
    getViewportRect?(): { x: number; y: number; width: number; height: number };
    resolveAsset?(ref: unknown): unknown;
    getBody(): unknown;
    requestAnimationFrame(callback: () => void): unknown;
    addEventListener(target: unknown, eventName: string, handler: (...args: unknown[]) => void, options?: unknown): () => void;
}

export interface EngineEvents extends EventMap {
    'plugin:installed': { pluginId: string; scope: PluginScope };
    'scene:changed': { previous: string | null; next: string | null };
    'engine:destroyed': undefined;
}

export interface SceneEvents extends EventMap {
    'scene:entered': { name: string };
    'scene:exited': { name: string };
    'asset:retained': { id: string; owner: string };
    'asset:released': { id: string; owner: string };
}

export interface SystemContext<TScene extends SceneContract = SceneContract> {
    engine: EngineContract;
    scene: TScene;
}

export interface SystemContract<TContext extends SystemContext = SystemContext> {
    enabled?: boolean;
    onRegister?(context: TContext): void;
    onAttach?(context: TContext): void;
    onDetach?(context: TContext | null): void;
    onResize?(width: number, height: number, aspect: number, context: TContext | null): void;
    update?(delta: number, time: number, context: TContext | null): void;
    snapshot?(): Snapshot | null;
    restore?(snapshot: Snapshot | null, context: TContext | null): void;
    dispose?(): void;
}

export interface ComponentContract<TOwner extends GameObjectContract = GameObjectContract> {
    owner: TOwner | null;
    onAttach(owner: TOwner): void;
    onDetach(owner?: TOwner): void;
    update?(delta: number, time: number): void;
}

export interface GameObjectContract {
    entityId: string;
    radius: number;
    transform: TransformLike;
    isDestroyed: boolean;
    attachToScene?(sceneHandle: SceneHandle | unknown, scene?: SceneContract): void;
    detachFromScene?(sceneHandle?: SceneHandle | unknown, scene?: SceneContract): void;
    update?(delta: number, time: number): void;
    serialize?(): Snapshot;
    destroy?(): void;
}

export interface SceneContract {
    name: string;
    engine: EngineContract | null;
    events: EventBus<SceneEvents>;
    sceneHandle: SceneHandle | null;
    attach(engine: EngineContract): void;
    detach(): void;
    update(delta: number, time: number): void;
    setCamera(camera: CameraHandle | unknown): void;
    getCamera(): CameraHandle | unknown;
    setPostProcessor(postProcessor: PostProcessorHandle | unknown): void;
    getPostProcessor(): PostProcessorHandle | unknown;
    use(plugin: EnginePlugin, options?: Record<string, unknown>): unknown;
    retainAsset?(asset: string | AssetDefinition, options?: { owner?: string }): Promise<AssetHandle | null>;
    releaseAsset?(id: string, options?: { owner?: string; dispose?: boolean }): boolean;
}

export interface EngineContract {
    readonly isHeadless: boolean;
    readonly platform: PlatformContract;
    readonly events: EventBus<EngineEvents>;
    readonly assets: AssetStoreContract;
    addScene(name: string, scene: SceneContract): SceneContract;
    useScene(name: string): SceneContract | null;
    getSystem(name: string): SystemContract | null;
    use(plugin: EnginePlugin, options?: Record<string, unknown>): unknown;
    hasCapability(capability: string): boolean;
}
