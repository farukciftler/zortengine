# Package Stability

| Entrypoint | Durum | Not |
| --- | --- | --- |
| `zortengine` | Stable | Cekirdek runtime primitive'leri |
| `zortengine/assets` | Stable | Generic asset/store/pipeline yuzeyi |
| `zortengine/browser` | Stable | Browser-only API |
| `zortengine/audio` | Stable | First-party audio adapter |
| `zortengine/render` | Stable | First-party Three renderer ve render asset adapter'lari |
| `zortengine/physics` | Stable | Physics adapter facade'i |
| `zortengine/devtools` | Stable | Tooling ve inspector yardimcilari |
| `zortengine/networking` | Stable | Networking transport/system surface'i |
| `zortengine/gameplay` | Provisional | Naming yeni; actor facade'i stabil olmaya aday |
| `zortengine/objects` | Deprecated | `gameplay` alias'i, yeni kodda kullanmayin |

## SemVer Politika Ozeti

- Stable entrypoint'lerde breaking degisiklikler yalnizca major release ile yapilir.
- Provisional surface'ler minor release'te isim veya package boundary degisikligi alabilir.
- Deprecated surface'ler bir sonraki major oncesi uyariyla kaldirilabilir.
