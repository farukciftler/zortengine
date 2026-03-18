# ZortEngine

`ZortEngine`, Three.js ustune kurulu scene-centric bir oyun runtime/framework cekirdegidir. Repo artik tek bir karma barrel export yerine **minimal root API + amaca ozel alt entrypoint'ler** yaklasimini izler.

## Framework Sinirlari

- `src/engine/`: cekirdek runtime ve scene lifecycle
- `src/adapters/`: browser, audio, render ve physics baglantilari
- `src/tooling/`: debug, inspector ve headless yardimcilari
- `src/kits/`: opinionated ama tekrar kullanilabilir gameplay modulleri
- `examples/run-showcase/`: sample uygulama
- `server/lobby/`: showcase lobby sunucusu
- `package.json` icindeki `exports`: public package girislerini dogrudan `src/...` altina baglar

## Root API

Root `zortengine` export'u yalnizca su siniflari sunar:

- `Engine`
- `GameScene`
- `SceneManager`
- `SystemManager`
- `GameObject`
- `Component`
- `EventEmitter`
- `SeededRandom`
- `ObjectPool`
- `HeadlessHarness`

Opinionated veya platforma ozel moduller alt entrypoint'lerden alinmalidir.

## Alt Entrypoint'ler

```js
import { Engine, GameScene } from 'zortengine';
import { BrowserPlatform, InputManager, UIManager } from 'zortengine/browser';
import { PhysicsManager } from 'zortengine/physics';
import { AssetLoader, AssetManifest, AssetPipeline } from 'zortengine/assets';
import { SaveManager, ReplayRecorder } from 'zortengine/persistence';
import { WebSocketTransport } from 'zortengine/networking';
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
    "zortengine/assets": "./src/engine/assets/index.js",
    "zortengine/browser": "./src/adapters/browser/index.js",
    "zortengine/devtools": "./src/tooling/index.js",
    "zortengine/kits": "./src/kits/index.js",
    "zortengine/networking": "./src/kits/networking/index.js",
    "zortengine/objects": "./src/objects/index.js",
    "zortengine/persistence": "./src/persistence/index.js",
    "zortengine/physics": "./src/adapters/physics/index.js"
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
        super(document.body, { seed: 'daily-seed' });
        this.addScene('main', new EmptyScene({ name: 'main' }));
        this.useScene('main');
        this.start();
    }
}
```

## Example App

Aktif showcase/example uygulama `examples/run-showcase/` altinda yasiyor:

- `examples/run-showcase/app/MyGame.js`
- `examples/run-showcase/app/main.js`
- `examples/run-showcase/scenes/MainMenuScene.js`
- `examples/run-showcase/scenes/RunScene.js`

Bu katman framework degil, engine'in ustune kurulu sample uygulamadir.

## Snapshot Contract

`GameScene` artik scene-level snapshot contract'i sunar:

- `serializeState()`: object ve system snapshot'larini toplar
- `restoreState(snapshot)`: system restore + object factory restore akisina girer
- `registerObjectFactory(type, factory)`: scene'e ait object restore registry

Bu sayede save/load politikasi app tarafinda kalirken, snapshot restore mekanigi framework katmaninda tanimli olur.

## Test

```bash
npm test
```

Test paketi su ayri katmanlari dogrular:

- `tests/engine/engine-contract.test.js`: root API, scene lifecycle, system priority, snapshot contract
- `tests/examples/headless-smoke.test.js`: showcase run headless smoke
- `tests/examples/network-smoke.test.js`: lobby/network smoke

## Mimari Not

Hedef ayrim:

- `engine`: runtime primitive'leri
- `adapters`: browser/physics gibi platform baglantilari
- `tooling`: debug/inspector yardimcilari
- `example`: showcase oyun, menu akisi, room/lobby semantigi

Engine cekirdegi sample oyun kavramlarini bilmemeli; sample uygulama da root API yerine ihtiyac duydugu alt entrypoint'leri kullanmalidir.
