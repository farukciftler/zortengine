# Zigzag Runner — Mimari ve Dokümantasyon

Endless zigzag runner örneği. Path tabanlı kıvrımlı yol, şerit değiştirme, zıplama ve procedural spawn ile engine kullanımını gösterir.

## Oyun Özeti

- **Tür**: Endless zigzag runner
- **Görünüm**: 2.5D / izometrik, tek şerit ileri hareket
- **Mekanik**: Sol/sağ lane değiştirme, zıplama, engellerden kaçınma, toplanabilir toplama
- **Progression**: Mesafe, skor, checkpoint, hız artışı

## Klasör Yapısı

```
examples/zigzag-runner/
├── app/
│   ├── index.html          # Giriş sayfası, importmap
│   ├── main.js             # Bootstrap, URL params
│   └── ZigzagGame.js       # Engine türevi, scene akışı
│
├── scenes/
│   ├── MenuScene.js        # Ana menü (oyna, skor)
│   └── RunScene.js         # Ana oyun sahnesi
│
├── runtime/
│   ├── ZigzagBootstrap.js       # Sistem kayıtları (physics, input, camera)
│   ├── ZigzagState.js           # Run state (skor, mesafe, lane, speed)
│   ├── ZigzagFlowController.js  # Başlatma, game over, restart
│   ├── ZigzagCheckpointController.js  # Checkpoint kayıt/geri yükleme
│   ├── ZigzagHudPresenter.js    # HUD güncellemeleri
│   └── PathGenerator.js         # Kıvrımlı path üretimi
│
├── actors/
│   ├── PlayerActor.js      # Oyuncu (lane, zıplama, collision)
│   ├── ObstacleActor.js    # Engel (statik, collision)
│   └── CollectibleActor.js # Toplanabilir
│
├── systems/
│   ├── LaneSystem.js       # Lane geçiş mantığı (A/D)
│   ├── SpawnSystem.js      # Engel/collectible spawn (procedural)
│   └── CollisionSystem.js  # Player–obstacle/collectible çarpışma
│
├── data/
│   ├── LaneDefinitions.js      # Lane sayısı, pozisyonlar
│   ├── ObstacleDefinitions.js  # Engel tipleri, spawn ağırlıkları
│   ├── CollectibleDefinitions.js
│   └── TrackConfig.js          # Hız, spawn aralığı, zorluk
│
├── ui/
│   └── ZigzagHud.js        # Skor, mesafe, can, pause overlay
│
├── README.md
└── PLAN.md                 # Detaylı plan
```

## Engine Kullanımı

### ZigzagGame (Engine extend)

```js
export class ZigzagGame extends Engine {
    constructor(options = {}) {
        super(document.body, { seed: options.seed });
        this.menuScene = new MenuScene();
        this.menuScene.on('requestStartRun', overrides => this.startRun(overrides));
        this.addScene('menu', this.menuScene);
        this.useScene('menu');
        this.start();
    }

    startRun(overrides = {}) {
        const runScene = new RunScene(runOptions);
        runScene.on('requestRestartRun', next => this.startRun(next));
        runScene.on('requestOpenMenu', () => this.useScene('menu'));
        this.addScene('run', runScene);
        this.useScene('run');
    }
}
```

### ZigzagBootstrap — Sistem Kayıtları

`RunScene.setup()` içinde bootstrap kullanılır:

- **PhysicsManager** — Cannon-es, gravity, collision
- **CameraManager** — TPS preset, path takibi
- **InputManager** — A/D, Space (zıplama)
- **UIManager** — HUD container

### RunScene — Ana Sahne

- `setup()`: Bootstrap, path generator, track ribbon, speed lines, player, systems
- `onUpdate()`: Mesafe, spawn, collision, track/speed lines güncelleme, kamera takibi
- Sistemler: LaneSystem, SpawnSystem, CollisionSystem (priority ile sıralı)

### Path ve Track

- **PathGenerator**: Segment tabanlı kıvrımlı path, `getInfoAtDistance(d)` → `{ position, rotation, tangent, curvature }`
- **Track**: Ribbon mesh, path boyunca sol/sağ kenarlar
- **Speed lines**: Path'e paralel hız çizgileri
- Önden render: ~220m yol ve engeller önceden oluşturulur, geçince silinir

### Spawn Sistemi

- **SPAWN_DISTANCE_AHEAD**: 100m — oyuncunun önünde spawn mesafesi
- **Prefill**: Oyun başında 0–100m aralığı engellerle doldurulur
- **Silme**: `pathDistance < playerDistance - 15` ile arkadaki objeler kaldırılır

## Engine Bağımlılıkları

| Kullanım | Kaynak |
|----------|--------|
| Engine, GameScene | zortengine |
| PhysicsManager | zortengine/physics |
| InputManager, UIManager, CameraManager | zortengine/browser |
| SaveManager | zortengine/persistence |

## Akış Özeti

1. **Başlangıç**: ZigzagGame → MenuScene
2. **Oyna**: requestStartRun → RunScene oluştur, useScene('run')
3. **RunScene.setup()**: Bootstrap, state, flow, checkpoint, path, track, spawn, collision
4. **Game loop**: Mesafe artışı, hız ramp, spawn, lane input, collision check
5. **Game over**: FlowController → pause, HUD game over, restart/menu
6. **Checkpoint**: Belirli mesafelerde otomatik kayıt

## Test

```bash
npm test
```

`tests/examples/zigzag-smoke.test.js` zigzag-runner'ı headless çalıştırır ve temel akışı doğrular.
