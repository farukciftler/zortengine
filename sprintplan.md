# ZortEngine React Native Entegrasyonu — Sprint Planı

Bu doküman, ZortEngine'ı React Native ortamında native hissiyatla çalıştırmak için detaylı sprint planını içerir.

---

## Genel Bakış

| Sprint | Odak | Tahmini Süre |
|--------|------|--------------|
| 0 | Hazırlık & Altyapı | 2–3 gün |
| 1 | RNPlatform | 2–3 gün |
| 2 | RNRendererAdapter | 3–4 gün |
| 3 | RNInputManager | 4–5 gün |
| 4 | Engine Entegrasyonu | 2–3 gün |
| 5 | Asset Pipeline & Metro | 2 gün |
| 6 | Native Feel & Polish | 4–5 gün |

**Toplam tahmini:** 3–4 hafta

---

## Sprint 0: Hazırlık & Altyapı

### 0.1 Proje Yapısı
- [x] `src/adapters/react-native/` klasörünü oluştur
- [x] `src/adapters/react-native/index.js` export dosyası
- [x] `package.json` exports'a `zortengine/react-native` ekle
- [x] `docs/react-native.md` placeholder doküman

### 0.2 Bağımlılıklar
- [x] `expo-gl` — native WebGL context (demo package.json'da)
- [x] `expo-three` — Three.js ↔ expo-gl köprüsü (demo package.json'da)
- [x] `react-native-gesture-handler` — touch/gesture (demo package.json'da)
- [x] `react-native-reanimated` (opsiyonel, gesture handler peer dep) — ihtiyaç halinde eklenir
- [x] `optionalDependencies` veya `peerDependencies` stratejisi belirle — RN deps sadece demo'da, root paket etkilenmez

### 0.3 Örnek RN Uygulaması
- [x] `examples/react-native-demo/` — minimal Expo projesi
- [x] `examples/react-native-demo/package.json` — zortengine workspace link (`file:../..`)
- [x] `examples/react-native-demo/metro.config.js` — glb/gltf asset resolver
- [x] Boş `App.js` + `GLView` placeholder

### 0.4 Contract Doğrulama
- [x] `PlatformContract` (lifecycle.ts) interface'ini RN için gözden geçir
- [x] `addEventListener` RN'de `'window'`/`'document'` yerine `'dimensions'` gibi mapping gerektiriyor mu kontrol et — `'window'+'resize'` → `Dimensions.addEventListener('change')`
- [x] Engine'ın `platform.addEventListener('window', 'resize', ...)` çağrısına RN uyumlu çözüm planla

---

## Sprint 1: RNPlatform

### 1.1 Temel RNPlatform Sınıfı
- [x] `src/adapters/react-native/RNPlatform.js` oluştur
- [x] `getViewportSize()` — `Dimensions.get('window')` kullan
- [x] `getBody()` — container/GLView ref döndür (Engine mount'ta kullanır; RN'de no-op veya ref)
- [x] `requestAnimationFrame()` — RN'de `global.requestAnimationFrame` veya polyfill

### 1.2 addEventListener Uyarlaması
- [x] `addEventListener(target, eventName, handler)` implement et
- [x] `target === 'window'` + `eventName === 'resize'` → `Dimensions.addEventListener('change', handler)`
- [x] Diğer target/event kombinasyonları için no-op veya uygun RN API mapping
- [x] Cleanup fonksiyonu döndür (`removeEventListener`)

### 1.3 Pointer Lock (Mobilde Yok)
- [x] `getPointerLockElement()` — `null` döndür
- [x] `requestPointerLock()` — no-op
- [x] `exitPointerLock()` — no-op
- [x] InputManager'ın pointer lock kontrollerinin RN'de çökmediğinden emin ol

### 1.4 Test & Doğrulama
- [x] RNPlatform'u izole test et (Dimensions mock)
- [x] Engine constructor'a `platform: new RNPlatform()` vererek headless modda çalıştığını doğrula

---

## Sprint 2: RNRendererAdapter

### 2.1 expo-gl / expo-three Entegrasyonu
- [x] `GLView`'dan `onContextCreate` ile `gl` context al
- [x] `expo-three` `Renderer` ile Three.js renderer oluştur (DOM canvas yok)
- [x] `gl.drawingBufferWidth` / `gl.drawingBufferHeight` ile viewport

### 2.2 RNRendererAdapter Sınıfı
- [x] `src/adapters/react-native/RNRendererAdapter.js` oluştur
- [x] `mount(options)` — `options.gl` (expo-gl context) al, `options.container` opsiyonel
- [x] `appendChild` çağrısı yapma (RN'de DOM yok)
- [x] ThreeRendererAdapter ile aynı contract: `createSceneHandle`, `unwrapScene`, `unwrapCamera`, `render`, `resize`, `dispose`

### 2.3 mount() Farklılıkları
- [x] `THREE.WebGLRenderer` yerine expo-three `Renderer` kullan
- [x] `renderer.domElement` yok — Engine'ın buna ihtiyacı var mı kontrol et (sadece appendChild için)
- [x] `renderer.setSize()` — `gl.drawingBufferWidth/Height` veya parametre ile

### 2.4 resize() Davranışı
- [x] `Dimensions` change veya `GLView` layout event'inden resize tetikle
- [x] `renderAdapter.resize(width, height)` Engine tarafından `onWindowResize` ile çağrılıyor — RN'de `Dimensions` değişince aynı akışı tetikle

### 2.5 SceneHandle Uyumluluğu
- [x] `ThreeSceneHandle` / `createSceneHandle` — Three.js Scene kullanıldığı için aynı mantık geçerli
- [x] `unwrapScene` / `unwrapCamera` — ThreeRendererAdapter ile aynı

### 2.6 Test
- [ ] Örnek RN uygulamasında boş sahne render et (Sprint 4'te)
- [ ] Kamera + basit mesh (BoxGeometry) ile görsel doğrulama (Sprint 4'te)
- [ ] Cihaz rotasyonunda resize'ın çalıştığını kontrol et (Sprint 4'te)

---

## Sprint 3: RNInputManager

### 3.1 Input Contract Analizi
- [x] InputManager'ın Engine/System tarafından kullanılan API'lerini listele
- [x] `triggerAction`, `consumeCommands`, `drainReplayFrame`, `enqueueExternalCommands`
- [x] `getMovementVector`, `getMouseDelta`, `isActionActive`, `getRaycastIntersection`

### 3.2 RNInputManager Sınıfı
- [x] `src/adapters/react-native/RNInputManager.js` oluştur
- [x] Aynı event/command API'sini koru (Engine ve System'lar değişmeden çalışsın)
- [x] DOM event'leri yerine RN gesture/touch kullan

### 3.3 Touch → Action Mapping
- [x] Tek dokunuş (tap) → `attack` action
- [x] Swipe yönleri → `forward`, `backward`, `left`, `right`
- [ ] İki parmak tap → `jump` veya `skill1` (oyuna göre) — opsiyonel
- [x] `bindings` yapısını koru; mobil için `mobile` profile ekle

### 3.4 Joystick / Virtual D-Pad (Opsiyonel)
- [x] `joystickDir.x`, `joystickDir.z` — swipe sırasında güncellenir
- [x] `getMovementVector` bu değerleri kullansın (mevcut InputManager zaten destekliyor)
- [ ] Ekranın sol altında virtual joystick UI — opsiyonel

### 3.5 Touch → NDC (Raycast için)
- [x] `event.nativeEvent.locationX/Y` + viewport size ile NDC hesapla
- [x] `touchPos` — `getRaycastIntersection` için
- [x] `getMouseDelta` — swipe delta ile simüle et

### 3.6 Gesture Handler Entegrasyonu
- [x] `PanResponder` ile touch handling
- [x] `getPanHandlers()` — View'a spread edilebilir
- [x] `attach()` / `detach()` — viewRef ile

### 3.7 Test
- [x] Tap → attack command
- [x] Swipe → movement command
- [x] `getMovementVector` doğru değer döndürüyor mu
- [x] Replay/snapshot ile uyumluluk (drainReplayFrame, enqueueExternalCommands)

---

## Sprint 4: Engine Entegrasyonu

### 4.1 Engine Constructor Uyarlaması
- [x] `container` — RN'de `null` (appendChild yapılmaz)
- [x] `platform: new RNPlatform()`
- [x] `rendererAdapter` — önce `mount({ gl, platform })` ile hazırlanır, sonra Engine'a verilir
- [x] Engine'da `container || platform.getBody()` — RN'de null, adapter DOM kullanmaz

### 4.2 Mount Sırası
- [x] GLView `onContextCreate` → gl al
- [x] RNRendererAdapter oluştur, `mount({ gl, platform })` çağır
- [x] Engine oluştur (rendererAdapter hazır)
- [x] Engine.start() — loop başlasın

### 4.3 React Component Yapısı
- [x] `GameView` wrapper component (`examples/react-native-demo/GameView.js`)
- [x] `useRef` ile Engine instance
- [x] `useEffect` cleanup'ta `engine.destroy()`
- [x] GLView + Engine lifecycle doğru sırada

### 4.4 Resize Akışı
- [x] RNPlatform `addEventListener('window','resize')` → `Dimensions.addEventListener('change')`
- [x] Engine `onWindowResize` tetiklenir
- [x] `GLView` layout değişince Dimensions change ile resize

### 4.5 Örnek Oyun Entegrasyonu
- [x] Minimal DemoScene — kamera + dönen kutu
- [x] RNInputManager register, tap → rotate
- [ ] zigzag-runner tam entegrasyon — opsiyonel (UIManager DOM tabanlı)

### 4.6 Test
- [ ] Uygulama gerçek cihazda açılıyor (expo start)
- [ ] Touch ile obje hareketi
- [ ] Rotasyon/resize sonrası görüntü bozulmuyor

---

## Sprint 5: Asset Pipeline & Metro

### 5.1 Metro Config
- [x] `assetExts` — `glb`, `gltf`, `obj` vb. ekle
- [x] `examples/react-native-demo/metro.config.js` — assetExts.push
- [ ] `require('./model.glb')` ile çalıştığını gerçek asset ile doğrula

### 5.2 ThreeAssetLoader RN Uyumu
- [x] Three.js TextureLoader, GLTFLoader — expo-three ile uyumlu
- [ ] `require()` vs `fetch` — RN'de asset path farkları dokümante edildi

### 5.3 Asset Yükleme Testi
- [ ] GLB model yükle ve sahneye ekle — opsiyonel
- [ ] Texture yükle — opsiyonel
- [ ] AssetStore retain/release RN'de sorunsuz — varsayılan

### 5.4 Hata Yönetimi
- [ ] Asset yükleme hatalarında fallback — opsiyonel

---

## Sprint 6: Native Feel & Polish

### 6.1 Performans
- [ ] 60 FPS hedefi — `expo-gl` performansını ölç
- [ ] Gereksiz re-render'ları azalt (React state kullanımı)
- [ ] Physics step, render step ayrımı — frame drop'ta simulation bozulmasın

### 6.2 Touch Gecikmesi
- [ ] `react-native-gesture-handler` native driver kullanımı
- [ ] JS bridge gecikmesini minimize et
- [ ] `runOnJS` vs native callback — kritik path'lerde optimizasyon

### 6.3 Haptic Feedback (Opsiyonel)
- [ ] `expo-haptics` — tap, swipe için haptic
- [ ] Action tetiklenince kısa titreşim

### 6.4 Fullscreen & Status Bar
- [ ] Immersive mode / fullscreen
- [ ] Status bar gizleme (oyun modu)
- [ ] Safe area — notch vb. için

### 6.5 Gerçek Cihaz Testi
- [ ] iOS fiziksel cihaz
- [ ] Android fiziksel cihaz
- [ ] Farklı ekran boyutları
- [ ] Düşük/orta segment cihazlarda performans

### 6.6 Dokümantasyon
- [ ] `docs/react-native.md` — kurulum, kullanım, örnek
- [ ] README'de React Native bölümü
- [ ] Known limitations

---

## Bağımlılık Grafiği

```
Sprint 0 ──► Sprint 1 ──► Sprint 2 ──┬──► Sprint 4 ──► Sprint 5 ──► Sprint 6
                │                    │
                └──► Sprint 3 ───────┘
```

- Sprint 1, 2, 3 paralel başlanabilir (0 sonrası)
- Sprint 4, 1–2–3 tamamlandıktan sonra
- Sprint 5–6, 4 üzerine inşa edilir

---

## Riskler & Mitigasyon

| Risk | Mitigasyon |
|------|------------|
| expo-three / Three.js versiyon uyumsuzluğu | Sabit versiyonlar, compatibility matrix |
| Input gecikmesi kabul edilemez | Native gesture handler, minimal JS in hot path |
| Asset loading RN'de farklı | Erken test, Metro config dokümantasyonu |
| Engine'da DOM varsayımları | Grep ile `document`/`window`/`appendChild` kontrolü |

---

## Kabul Kriterleri (Genel)

- [ ] Zigzag-runner veya eşdeğer minimal oyun RN'de çalışıyor
- [ ] Touch ile hareket ve aksiyon tetikleniyor
- [ ] Cihaz rotasyonunda layout bozulmuyor
- [ ] 60 FPS'e yakın (hedef cihazda)
- [ ] `zortengine/react-native` entrypoint'ten tüm adapter'lar export ediliyor
