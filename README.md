# ZortEngine

`ZortEngine`, Three.js ustune kurulu scene-centric bir oyun runtime/framework cekirdegidir. V2 tabaniyla birlikte repo artik yalnizca klasor olarak degil, **contract-first platform** olarak organize edilir: cekirdek runtime soyut contract'lari korur, concrete Three.js/browser uygulamalari adapter katmaninda kalir. Detayli dokumantasyon icin [docs/](docs/README.md) indeksine bakin.

## Framework Sinirlari

- `src/engine/`: cekirdek runtime, plugin host, asset ownership ve scene lifecycle
- `src/adapters/`: browser, audio, render ve physics baglantilari
- `src/tooling/`: debug, inspector ve headless yardimcilari
- `src/kits/`: opinionated ama tekrar kullanilabilir gameplay modulleri
- `src/gameplay/`: sample ve kit actor facade'lari
- `examples/run-showcase/`: multiplayer lobby, combat, networking demo
- `examples/zigzag-runner/`: endless runner, procedural spawn, path-based track
- `examples/react-native-demo/`: React Native minimal demo (expo-gl, touch input)
- `examples/run-showcase/server/lobby/`: showcase lobby sunucusu
- `package.json` icindeki `exports`: public package girislerini dogrudan `src/...` altina baglar

## Root API

Root `zortengine` export'u yalnizca su siniflari sunar:

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

Opinionated veya platforma ozel moduller alt entrypoint'lerden alinmalidir.

## Alt Entrypoint'ler

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

## Browser Kurulumu

Bundler olmadan `importmap` ile calisacaksaniz root package ve kullandiginiz alt entrypoint'leri acikca map etmeniz gerekir:

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

## Hızlı Başlangıç

```js
import { Engine, GameScene } from 'zortengine';

class EmptyScene extends GameScene {
    setup() {
        // Kendi system ve object katmaninizi buraya kurun.
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

## Örnek Uygulamalar

Engine iki örnek oyunla birlikte gelir:

| Örnek | Açıklama | Özellikler |
|-------|----------|------------|
| **[run-showcase](examples/run-showcase/)** | Multiplayer lobby, combat demo | Networking, odalar, savaş, meta progression |
| **[zigzag-runner](examples/zigzag-runner/)** | Endless zigzag runner | Şerit değiştirme, procedural spawn, checkpoint |

### run-showcase

- `examples/run-showcase/app/MyGame.js`, `main.js`
- `examples/run-showcase/scenes/MainMenuScene.js`, `RunScene.js`
- Lobby sunucusu: `npm run network` → `examples/run-showcase/server/lobby/`

### zigzag-runner

- `examples/zigzag-runner/app/ZigzagGame.js`, `main.js`
- `examples/zigzag-runner/scenes/MenuScene.js`, `RunScene.js`
- Çalıştırma: Proje kökünden `npm run serve` veya `python3 -m http.server 3000` → **http://localhost:3000/examples/zigzag-runner/app/**

Detaylı bilgi için → [docs/examples.md](docs/examples.md), [docs/zigzag-runner.md](docs/zigzag-runner.md)

## Snapshot Contract

`GameScene` artik scene-level snapshot contract'i sunar:

- `serializeState()`: object ve system snapshot'larini toplar
- `restoreState(snapshot)`: system restore + object factory restore akisina girer
- `registerObjectFactory(type, factory)`: scene'e ait object restore registry

Bu sayede save/load politikasi app tarafinda kalirken, snapshot restore mekanigi framework katmaninda tanimli olur.

## Plugin ve Capability Contract

`Engine` ve `GameScene` artik `use(plugin)` ile dependency-aware plugin kurabilir:

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

Scene plugin'leri engine plugin'lerini `dependencies` ile isteyebilir; capability kayitlari da host seviyesinde izlenir.

## Renderer Boundary

V2 tabaninda render akisinin yeni siniri:

- `Engine` artik dogrudan `THREE.WebGLRenderer` yaratmak yerine `RendererAdapter` kullanir
- `GameScene` `sceneHandle` ve `getRenderScene()` yuzeylerini sunar
- `CameraManager` ve post-process katmani `getNativeCamera()` benzeri generic handle semantigine yaklastirildi
- `ThreeRendererAdapter` first-party varsayilan implementasyondur

## Asset Ownership

Asset sistemi loader helper seviyesinden cikartilip retain/release/dispose sahipligine gecirildi:

- `AssetLoader`: capability map tabanli generic loader dispatcher
- `ThreeAssetLoader`: texture/model/audio loader'larini adapter katmaninda toplar
- `AssetStore`: retain/release/dispose ve owner index'i tutar
- `AssetPipeline`: preload group akisinda store ile scene-scope ownership kurar
- `GameScene.retainAsset()` / `releaseAsset()`: scene ayrilirken owned asset'leri otomatik birakir

## Test

```bash
npm test
```

Test paketi su ayri katmanlari dogrular:

- `tests/engine/engine-contract.test.js`: root API, scene lifecycle, system priority, snapshot contract
- `tests/types/engine-contracts.test.ts`: generic contract smoke test
- `tests/examples/headless-smoke.test.js`: run-showcase headless smoke
- `tests/examples/zigzag-smoke.test.js`: zigzag-runner smoke
- `tests/examples/network-smoke.test.js`: lobby/network smoke

## React Native

ZortEngine React Native ortamında çalışır. Adapter'lar `zortengine/react-native` entrypoint'inden:

```js
import { RNPlatform, RNRendererAdapter, RNInputManager } from 'zortengine/react-native';
```

Örnek: `examples/react-native-demo/` — minimal Expo projesi. Detaylı kurulum için [docs/react-native.md](docs/react-native.md).

## Dokümantasyon

| Belge | İçerik |
|-------|--------|
| [docs/README.md](docs/README.md) | Dokümantasyon indeksi |
| [docs/examples.md](docs/examples.md) | Örnek uygulamalar rehberi |
| [docs/zigzag-runner.md](docs/zigzag-runner.md) | Zigzag Runner mimari ve kullanım |
| [docs/plugins.md](docs/plugins.md) | Plugin manifest ve capability modeli |
| [docs/adapters.md](docs/adapters.md) | Renderer, audio, browser adapter sınırları |
| [docs/react-native.md](docs/react-native.md) | React Native kurulum ve kullanım |
| [docs/v2-migration.md](docs/v2-migration.md) | V1 → V2 geçiş notları |
| [docs/package-stability.md](docs/package-stability.md) | Public API stabilite tablosu |

## Mimari Not

Hedef ayrim:

- `engine`: runtime primitive'leri
- `adapters`: browser/physics gibi platform baglantilari
- `tooling`: debug/inspector yardimcilari
- `example`: showcase oyun, menu akisi, room/lobby semantigi

Engine cekirdegi sample oyun kavramlarini bilmemeli; sample uygulama da root API yerine ihtiyac duydugu alt entrypoint'leri kullanmalidir.
