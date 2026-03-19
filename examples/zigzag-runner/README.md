# Zigzag Runner

Endless zigzag runner örneği. Sol/sağ şerit değiştirerek engellerden kaçın, toplanabilirleri topla.

## Çalıştırma

**Önemli:** Sunucuyu proje kökünden (`zortengine/`) başlatın.

```bash
# Proje kökünden (zortengine klasöründe)
cd /path/to/zortengine

# Python (genelde en sorunsuz)
python3 -m http.server 3000

# veya Node serve ile
npm run serve
```

Tarayıcıda açın: **http://localhost:3000/examples/zigzag-runner/app/**

## Kontroller

- **Sol/Sağ**: A / D veya ok tuşları
- **Zıplama**: Space
- **Yeniden Oyna**: Oyun bittiğinde buton

## Dokümantasyon

| Belge | İçerik |
|-------|--------|
| [docs/zigzag-runner.md](../../docs/zigzag-runner.md) | Mimari, klasör yapısı, engine kullanımı |
| [docs/examples.md](../../docs/examples.md) | Örnekler karşılaştırması |
| [PLAN.md](PLAN.md) | Detaylı plan ve modül sorumlulukları |
