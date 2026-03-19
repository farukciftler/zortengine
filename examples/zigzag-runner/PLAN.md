# Zigzag Runner — Klasör Yapısı Planı

## Oyun Özeti
- **Tür**: Endless zigzag runner
- **Görünüm**: 2.5D / izometrik, tek şerit ileri hareket
- **Mekanik**: Sol/sağ lane değiştirme, engellerden kaçınma, toplanabilir toplama
- **Progression**: Mesafe, skor, checkpoint, meta unlock

---

## Hedef Klasör Ağacı

```
examples/zigzag-runner/
├── PLAN.md                    # Bu plan
├── app/
│   ├── index.html             # Giriş sayfası, importmap
│   ├── main.js                # Bootstrap, URL params
│   ├── ZigzagGame.js          # Engine türevi, scene akışı
│   └── favicon.svg            # İkon (opsiyonel)
│
├── scenes/
│   ├── MenuScene.js           # Ana menü (oyna, ayarlar, skor)
│   └── RunScene.js            # Ana oyun sahnesi
│
├── runtime/
│   ├── ZigzagBootstrap.js      # Sistem kayıtları (physics, input, camera)
│   ├── ZigzagState.js         # Run state (skor, mesafe, lane)
│   ├── ZigzagFlowController.js # Başlatma, game over, restart
│   ├── ZigzagCheckpointController.js # Checkpoint kayıt/geri yükleme
│   └── ZigzagHudPresenter.js   # HUD güncellemeleri
│
├── actors/
│   ├── PlayerActor.js         # Oyuncu (lane, collision)
│   ├── ObstacleActor.js       # Engel (statik, collision)
│   └── CollectibleActor.js    # Toplanabilir (coin, power-up) — zortengine/objects kullanılabilir
│
├── systems/
│   ├── LaneSystem.js          # Lane geçiş mantığı
│   ├── SpawnSystem.js        # Engel/collectible spawn (procedural)
│   └── CollisionSystem.js     # Player–obstacle/collectible çarpışma
│
├── data/
│   ├── LaneDefinitions.js    # Lane sayısı, pozisyonlar
│   ├── ObstacleDefinitions.js # Engel tipleri, spawn ağırlıkları
│   ├── CollectibleDefinitions.js # Toplanabilir tipleri
│   └── TrackConfig.js         # Hız, spawn aralığı, zorluk eğrisi
│
├── ui/
│   └── ZigzagHud.js           # Skor, mesafe, can, pause overlay
│
└── assets/                    # (Opsiyonel) Özel asset'ler
    └── .gitkeep
```

---

## Modül Sorumlulukları

### app/
| Dosya | Sorumluluk |
|-------|------------|
| `index.html` | Importmap, canvas container, stil |
| `main.js` | `ZigzagGame` başlatma, URL params (seed, restore) |
| `ZigzagGame.js` | Engine extend, menu/run scene geçişi, `startRun` / `openMenu` |

### scenes/
| Dosya | Sorumluluk |
|-------|------------|
| `MenuScene.js` | Oyna butonu, skor tablosu, ayarlar; `requestStartRun` emit |
| `RunScene.js` | `GameScene` extend, setup → bootstrap, flow, checkpoint, spawn |

### runtime/
| Dosya | Sorumluluk |
|-------|------------|
| `ZigzagBootstrap.js` | Physics, InputManager, CameraManager, UIManager kaydı |
| `ZigzagState.js` | `{ score, distance, lane, speed, isAlive }` |
| `ZigzagFlowController.js` | Başlat, game over, restart, pause |
| `ZigzagCheckpointController.js` | SaveManager, checkpoint save/restore |
| `ZigzagHudPresenter.js` | HUD binding, skor/mesafe/can güncelleme |

### actors/
| Dosya | Sorumluluk |
|-------|------------|
| `PlayerActor.js` | Lane pozisyonu, collision radius, serialize |
| `ObstacleActor.js` | Engel mesh, collision, spawn pozisyonu |
| `CollectibleActor.js` | zortengine/gameplay `CollectibleActor` veya basit türev |

### systems/
| Dosya | Sorumluluk |
|-------|------------|
| `LaneSystem.js` | Input → lane değiştirme, lane pozisyon hesaplama |
| `SpawnSystem.js` | Zamanla engel/collectible spawn, procedural seed |
| `CollisionSystem.js` | Player–obstacle (game over), player–collectible (skor) |

### data/
| Dosya | Sorumluluk |
|-------|------------|
| `LaneDefinitions.js` | `LANE_COUNT`, `LANE_POSITIONS`, `LANE_WIDTH` |
| `ObstacleDefinitions.js` | Engel tipleri, mesh hint, spawn weight |
| `CollectibleDefinitions.js` | Coin, shield, magnet vb. |
| `TrackConfig.js` | `BASE_SPEED`, `SPAWN_INTERVAL`, `SPEED_RAMP` |

### ui/
| Dosya | Sorumluluk |
|-------|------------|
| `ZigzagHud.js` | DOM overlay: skor, mesafe, can, pause, game over |

---

## Engine Bağımlılıkları

| Kullanım | Kaynak |
|----------|--------|
| Engine, GameScene | zortengine |
| PhysicsManager | zortengine/physics |
| InputManager, UIManager, CameraManager | zortengine/browser |
| CollectibleActor (opsiyonel) | zortengine/gameplay |
| SaveManager | zortengine/persistence |
| AssetManifest, AssetPipeline | zortengine/assets |

---

## Akış Özeti

1. **Başlangıç**: `ZigzagGame` → `MenuScene`
2. **Oyna**: `requestStartRun` → `RunScene` oluştur, `useScene('run')`
3. **RunScene.setup()**: Bootstrap, state, flow, checkpoint, spawn, collision
4. **Game loop**: Track ileri, spawn, lane input, collision check
5. **Game over**: FlowController → pause, HUD game over, restart/menu
6. **Checkpoint**: Belirli mesafelerde otomatik kayıt

---

## run-showcase ile Farklar

| Özellik | run-showcase | zigzag-runner |
|---------|--------------|---------------|
| Networking | Var | Yok |
| Combat | Var | Yok |
| Odalar | Var | Yok |
| Lane hareket | Yok | Var |
| Procedural spawn | Kısmen | Tam |
| Karmaşıklık | Yüksek | Düşük |
