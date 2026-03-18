# ZortEngine

`ZortEngine`, Three.js ustune kurulu scene-centric bir oyun runtime/framework cekirdegidir. Repo artik tek bir karma barrel export yerine **minimal root API + amaca ozel alt entrypoint'ler** yaklasimini izler.

## Framework Sinirlari

- `index.js`: yalnizca cekirdek framework yuzeyi
- `browser.js`: browser, input, camera, UI ve render-yardimcilari
- `physics.js`: fizik adaptoru
- `assets.js`: asset/prefab yardimcilari
- `persistence.js`: save/replay yardimcilari
- `devtools.js`: debug ve inspector araclari
- `networking.js`: low-level networking export'lari
- `game/` ve `demo/my_game/`: showcase/example uygulama

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

Bundler olmadan `importmap` ile calisacaksaniz hem root package'i hem alt entrypoint'leri map etmeniz gerekir:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/",
    "three/examples/jsm/": "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/",
    "cannon-es": "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js",
    "zortengine": "./index.js",
    "zortengine/": "./"
  }
}
</script>
```

## Hızlı Başlangıç

```js
import { Engine, GameScene } from 'zortengine';

class EmptyScene extends GameScene {
    setup() {
        // Kendi systems/objects katmaninizi buraya kurun.
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

Aktif showcase/example uygulama su dosyalarda yasiyor:

- `demo/my_game/MyGame.js`
- `demo/my_game/main.js`
- `game/scenes/MainMenuScene.js`
- `game/scenes/RunScene.js`

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

- `tests/engine-contract.test.js`: root API, scene lifecycle, system priority, snapshot contract
- `tests/headless-smoke.test.js`: showcase run headless smoke
- `tests/network-smoke.test.js`: lobby/network smoke

## Mimari Not

Hedef ayrim:

- `engine`: runtime primitive'leri
- `adapters`: browser/physics gibi platform baglantilari
- `tooling`: debug/inspector yardimcilari
- `example`: showcase oyun, menu akisi, room/lobby semantigi

Engine cekirdegi sample oyun kavramlarini bilmemeli; sample uygulama da root API yerine ihtiyac duydugu alt entrypoint'leri kullanmalidir.
