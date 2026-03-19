# Örnek Uygulamalar Rehberi

ZortEngine iki örnek oyunla birlikte gelir. Her biri farklı engine özelliklerini sergiler.

## Karşılaştırma

| Özellik | run-showcase | zigzag-runner |
|---------|--------------|---------------|
| **Tür** | Multiplayer lobby, combat | Endless zigzag runner |
| **Networking** | Var (WebSocket lobby) | Yok |
| **Combat** | Var | Yok |
| **Şerit (lane) hareketi** | Yok | Var |
| **Procedural spawn** | Kısmen | Tam (path-based) |
| **Checkpoint / Save** | Var | Var |
| **Karmaşıklık** | Yüksek | Düşük |
| **Öğrenme eğrisi** | Orta–yüksek | Düşük |

## run-showcase

Multiplayer lobby, odalar, combat ve meta progression demo.

### Çalıştırma

1. **Lobby sunucusu** (ayrı terminal):
   ```bash
   npm run network
   ```
   Sunucu `ws://localhost:2567` üzerinde dinler.

2. **Web sunucusu**:
   ```bash
   npm run serve
   # veya: python3 -m http.server 3000
   ```

3. Tarayıcıda: **http://localhost:3000/examples/run-showcase/app/**

### Önemli Dosyalar

- `app/MyGame.js` — Engine extend, scene akışı
- `scenes/MainMenuScene.js` — Lobby UI, oda listesi
- `scenes/RunScene.js` — Combat, replication
- `server/lobby/network-server.js` — WebSocket lobby sunucusu

### İlgili Dokümantasyon

- [adapters.md](adapters.md) — Renderer, input
- [plugins.md](plugins.md) — Plugin kullanımı

---

## zigzag-runner

Endless zigzag runner: şerit değiştir, engellerden kaçın, toplanabilirleri topla.

### Çalıştırma

**Önemli:** Sunucuyu proje kökünden (`zortengine/`) başlatın.

```bash
# Proje kökünden
cd /path/to/zortengine

# Python (genelde en sorunsuz)
python3 -m http.server 3000

# veya Node serve
npm run serve
```

Tarayıcıda: **http://localhost:3000/examples/zigzag-runner/app/**

### Kontroller

- **Sol/Sağ**: A / D veya ok tuşları
- **Zıplama**: Space
- **Yeniden Oyna**: Oyun bittiğinde buton

### Detaylı Dokümantasyon

→ [zigzag-runner.md](zigzag-runner.md) — Mimari, klasör yapısı, engine kullanımı
