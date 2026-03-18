import type {
    EngineContract,
    EnginePlugin,
    EventBus,
    RendererAdapter,
    SceneContract,
    SystemContract
} from '../../src/engine/contracts/index.js';

type EngineEvents = {
    ready: { scene: string };
    stopped: undefined;
};

declare const bus: EventBus<EngineEvents>;
declare const engine: EngineContract;
declare const scene: SceneContract;
declare const system: SystemContract;
declare const renderer: RendererAdapter;

const plugin: EnginePlugin<EngineContract, { enabled: true }> = {
    manifest: {
        id: 'contracts-smoke',
        scope: 'engine',
        capabilities: ['contracts']
    },
    install(context) {
        context.host.hasCapability('contracts');
        return { enabled: true };
    }
};

bus.on('ready', payload => {
    payload.scene.toUpperCase();
});
bus.emit('stopped', undefined);

engine.use(plugin);
scene.use(plugin);
system.enabled = false;
renderer.createSceneHandle();
