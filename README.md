# ZortEngine

`ZortEngine`, **Three.js** uzerine kurulu moduler bir 3D runtime/gameplay engine denemesidir. Repo artik tek bir aktif showcase akisi uzerinden ilerler: `game/scenes/RunScene.js`.

## Guncel Mimari

- `core/`: `Engine`, `SceneManager`, `GameScene`, `SystemManager`, `BrowserPlatform`
- `objects/`: `GameObject`, `Component`, karakter ve collectible/objective actor tabanlari
- `systems/`: input, physics, camera, projectile, encounter, collectible, modifier, status, debug overlay
- `utils/`: asset/save/random/replay/prefab/headless test yardimcilari
- `game/`: showcase oyunun veri, actor, runtime ve scene katmani
- `demo/my_game/`: aktif bootstrapping dosyalari ve legacy sample sahneler

## Aktif Showcase

Aktif demo girisi:

- `demo/my_game/MyGame.js`
- `demo/my_game/main.js`
- `game/scenes/RunScene.js`

`demo/my_game/IsometricBattleScene.js` artik sadece legacy sample olarak tutulur; aktif akista kullanilmaz.

## Browser Kurulumu

Bu repo bundler olmadan `importmap` ile calisir. Kendi `index.html` dosyanizda en az su import map tanimlari olmali:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/",
    "cannon-es": "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js",
    "zortengine": "./index.js"
  }
}
</script>
```

## Hızlı Başlangıç

```js
import { Engine } from 'zortengine';
import { RunScene } from './game/scenes/RunScene.js';

export class MyGame extends Engine {
    constructor() {
        super(document.body, {
            seed: 'daily-seed'
        });
        this.addScene('run', new RunScene());
        this.useScene('run');
        this.start();
    }
}
```

## Engine Yetkinlikleri

- Scene tabanli lifecycle ve system orchestration
- Input command queue ve fixed-step simulation altyapisi
- Physics body/material/contact helpers
- Projectile, collectible, objective zone ve encounter director sistemleri
- Modifier, status effect, seeded RNG, replay recorder ve save manager
- Headless harness ve inspector/debug overlay baslangici

## Showcase Oyunun Kanitladigi Alanlar

- Data-driven room/encounter tanimlari
- Relic/loadout secimleri ve run-based progression
- Singleplayer + yerel coop denemesi
- Restart/snapshot/save temelli run dongusu

## Test

Headless smoke test:

```bash
npm test
```

## Kural

Game’e ozel mantik `game/` tarafinda kalmali; fakat reusable olan sistemler ve altyapi `core/`, `systems/`, `objects/`, `utils/` altina tasinmali. Bu repodaki ana hedef, oyun geliştirirken engine yetkinligini kanitlamaktir.
