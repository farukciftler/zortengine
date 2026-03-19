# ZortEngine

`ZortEngine` is a scene-centric game runtime/framework core built on top of Three.js. With the V2 foundation, the repo is now organized not just as a folder, but as a **contract-first platform**: the core runtime maintains abstract contracts, while concrete Three.js/browser implementations remain in the adapter layer. For detailed documentation, see the [docs/](docs/README.md) index.

## Framework Boundaries

- `src/engine/`: Core runtime, plugin host, asset ownership, and scene lifecycle
- `src/adapters/`: Browser, audio, render, and physics connections
- `src/tooling/`: Debug, inspector, and headless utilities
- `src/kits/`: Opinionated but reusable gameplay modules
- `src/gameplay/`: Sample and kit actor facades
- `examples/run-showcase/`: Multiplayer lobby, combat, networking demo
- `examples/zigzag-runner/`: Endless runner, procedural spawn, path-based track
- `examples/react-native-demo/`: React Native minimal demo (expo-gl, touch input)
- `examples/run-showcase/server/lobby/`: Showcase lobby server
- `exports` in `package.json`: Maps public package entries directly under `src/...`

## Root API

The root `zortengine` export provides only these classes:

- `Engine`
- `GameScene`
- `SceneManager`
- `System`
- `SystemManager`
- `GameObject`
- `Component`
- `EventEmitter`
- `PluginRegistry`
- `SeededRandom`
- `ObjectPool`
- `HeadlessHarness`

Opinionated or platform-specific modules should be imported from sub-entrypoints.

## Sub-Entrypoints

```js
import { Engine, GameScene } from 'zortengine';
import { BrowserPlatform, InputManager, UIManager } from 'zortengine/browser';
import { AudioManager } from 'zortengine/audio';
import { PhysicsManager } from 'zortengine/physics';
import { AssetManifest, AssetPipeline, AssetStore } from 'zortengine/assets';
import { ThreeAssetLoader, ThreeRendererAdapter } from 'zortengine/render';
import { SaveManager, ReplayRecorder } from 'zortengine/persistence';
import { WebSocketTransport } from 'zortengine/networking';
import { ModularCharacter } from 'zortengine/gameplay';
```

## Browser Setup

If you are going to use `importmap` without a bundler, you need to explicitly map the root package and the sub-entrypoints you use:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/",
    "three/examples/jsm/": "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/",
    "cannon-es": "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js",
    "zortengine": "./src/engine/index.js",
    "zortengine/audio": "./src/adapters/audio/index.js",
    "zortengine/assets": "./src/engine/assets/index.js",
    "zortengine/browser": "./src/adapters/browser/index.js",
    "zortengine/devtools": "./src/tooling/index.js",
    "zortengine/gameplay": "./src/gameplay/index.js",
    "zortengine/kits": "./src/kits/index.js",
    "zortengine/networking": "./src/kits/networking/index.js",
    "zortengine/objects": "./src/objects/index.js",
    "zortengine/persistence": "./src/persistence/index.js",
    "zortengine/physics": "./src/adapters/physics/index.js",
    "zortengine/render": "./src/adapters/render/index.js"
  }
}
</script>
```

## Quick Start

```js
import { Engine, GameScene } from 'zortengine';

class EmptyScene extends GameScene {
    setup() {
        // Set up your own system and object layers here.
    }
}

export class MyGame extends Engine {
    constructor() {
        const assetLoader = new ThreeAssetLoader();
        super(document.body, {
            seed: 'daily-seed',
            rendererAdapter: new ThreeRendererAdapter(),
            assets: new AssetStore({ loader: assetLoader }),
            assetLoader
        });
        this.addScene('main', new EmptyScene({ name: 'main' }));
        this.useScene('main');
        this.start();
    }
}
```

## Example Applications

The Engine comes with two example games:

| Example | Description | Features |
|-------|----------|------------|
| **[run-showcase](examples/run-showcase/)** | Multiplayer lobby, combat demo | Networking, rooms, combat, meta progression |
| **[zigzag-runner](examples/zigzag-runner/)** | Endless zigzag runner | Lane switching, procedural spawn, checkpoints |

### run-showcase

- `examples/run-showcase/app/MyGame.js`, `main.js`
- `examples/run-showcase/scenes/MainMenuScene.js`, `RunScene.js`
- Lobby server: `npm run network` → `examples/run-showcase/server/lobby/`

### zigzag-runner

- `examples/zigzag-runner/app/ZigzagGame.js`, `main.js`
- `examples/zigzag-runner/scenes/MenuScene.js`, `RunScene.js`
- Running: From project root `npm run serve` or `python3 -m http.server 3000` → **http://localhost:3000/examples/zigzag-runner/app/**

For detailed information → [docs/examples.md](docs/examples.md), [docs/zigzag-runner.md](docs/zigzag-runner.md)

## Snapshot Contract

`GameScene` now provides a scene-level snapshot contract:

- `serializeState()`: Collects object and system snapshots
- `restoreState(snapshot)`: Enters system restore + object factory restore flow
- `registerObjectFactory(type, factory)`: Object restore registry belonging to the scene

In this way, while the save/load policy remains on the app side, the snapshot restore mechanism is defined at the framework layer.

## Plugin and Capability Contract

`Engine` and `GameScene` can now install dependency-aware plugins with `use(plugin)`:

```js
engine.use({
  manifest: {
    id: 'inspector-tools',
    scope: 'engine',
    capabilities: ['inspect']
  },
  install(context) {
    return {
      hasInspectCapability: context.hasCapability('inspect')
    };
  }
});
```

Scene plugins can request engine plugins with `dependencies`; capability registrations are also tracked at the host level.

## Renderer Boundary

New boundary of the render flow in the V2 foundation:

- `Engine` now uses `RendererAdapter` instead of creating `THREE.WebGLRenderer` directly
- `GameScene` provides `sceneHandle` and `getRenderScene()` surfaces
- `CameraManager` and post-process layer are brought closer to generic handle semantics like `getNativeCamera()`
- `ThreeRendererAdapter` is the first-party default implementation

## Asset Ownership

The asset system has been moved from loader helper level to retain/release/dispose ownership:

- `AssetLoader`: Generic loader dispatcher based on capability map
- `ThreeAssetLoader`: Consolidates texture/model/audio loaders in the adapter layer
- `AssetStore`: Holds retain/release/dispose and owner index
- `AssetPipeline`: Establishes scene-scope ownership with the store in the preload group flow
- `GameScene.retainAsset()` / `releaseAsset()`: Automatically releases owned assets when the scene is detached

## Test

```bash
npm test
```

The test package verifies these separate layers:

- `tests/engine/engine-contract.test.js`: Root API, scene lifecycle, system priority, snapshot contract
- `tests/types/engine-contracts.test.ts`: Generic contract smoke test
- `tests/examples/headless-smoke.test.js`: run-showcase headless smoke
- `tests/examples/zigzag-smoke.test.js`: zigzag-runner smoke
- `tests/examples/network-smoke.test.js`: lobby/network smoke

## React Native

ZortEngine works in the React Native environment. Adapters are from the `zortengine/react-native` entrypoint:

```js
import { RNPlatform, RNRendererAdapter, RNInputManager } from 'zortengine/react-native';
```

Example: `examples/react-native-demo/` — minimal Expo project. For detailed setup [docs/react-native.md](docs/react-native.md).

## Documentation

| Document | Content |
|-------|--------|
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/examples.md](docs/examples.md) | Example applications guide |
| [docs/zigzag-runner.md](docs/zigzag-runner.md) | Zigzag Runner architecture and usage |
| [docs/plugins.md](docs/plugins.md) | Plugin manifest and capability model |
| [docs/adapters.md](docs/adapters.md) | Renderer, audio, browser adapter boundaries |
| [docs/react-native.md](docs/react-native.md) | React Native setup and usage |
| [docs/v2-migration.md](docs/v2-migration.md) | V1 → V2 migration notes |
| [docs/package-stability.md](docs/package-stability.md) | Public API stability table |

## Architectural Note

Target separation:

- `engine`: Runtime primitives
- `adapters`: Platform connections like browser/physics
- `tooling`: Debug/inspector utilities
- `example`: Showcase game, menu flow, room/lobby semantics

The engine core should not know about sample game concepts; the sample application should also use the sub-entrypoints it needs instead of the root API.
ine ihtiyac duydugu alt entrypoint'leri kullanmalidir.
