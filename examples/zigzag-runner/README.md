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
# veya: npx serve . -l 3000
```

Tarayıcıda açın: **http://localhost:3000/examples/zigzag-runner/app/**

(`/app/` ile bitmeli; `index.html` otomatik yüklenir)

## Kontroller

- **Sol/Sağ**: A / D veya ok tuşları
- Oyun bittiğinde "Yeniden Oyna" ile tekrar başla

## Klasör Yapısı

Detaylı plan için `PLAN.md` dosyasına bakın.
