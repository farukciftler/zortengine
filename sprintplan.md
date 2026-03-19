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
- [ ] `src/adapters/react-native/` klasörünü oluştur
- [ ] `src/adapters/react-native/index.js` export dosyası
- [ ] `package.json` exports'a `zortengine/react-native` ekle
- [ ] `docs/react-native.md` placeholder doküman

### 0.2 Bağımlılıklar
- [ ] `expo-gl` — native WebGL context
- [ ] `expo-three` — Three.js ↔ expo-gl köprüsü
- [ ] `react-native-gesture-handler` — touch/gesture
- [ ] `react-native-reanimated` (opsiyonel, gesture handler peer dep)
- [ ] `optionalDependencies` veya `peerDependencies` stratejisi belirle (web kullanıcılarını etkilememek için)

### 0.3 Örnek RN Uygulaması
- [ ] `examples/react-native-demo/` — minimal Expo projesi
- [ ] `examples/react-native-demo/package.json` — zortengine workspace link
- [ ] `examples/react-native-demo/metro.config.js` — glb/gltf asset resolver
- [ ] Boş `App.js` + `GLView` placeholder

### 0.4 Contract Doğrulama
- [ ] `PlatformContract` (lifecycle.ts) interface'ini RN için gözden geçir
- [ ] `addEventListener` RN'de `'window'`/`'document'` yerine `'dimensions'` gibi mapping gerektiriyor mu kontrol et
- [ ] Engine'ın `platform.addEventListener('window', 'resize', ...)` çağrısına RN uyumlu çözüm planla

---

## Sprint 1: RNPlatform

### 1.1 Temel RNPlatform Sınıfı
- [ ] `src/adapters/react-native/RNPlatform.js` oluştur
- [ ] `getViewportSize()` — `Dimensions.get('window')` kullan
- [ ] `getBody()` — container/GLView ref döndür (Engine mount'ta kullanır; RN'de no-op veya ref)
- [ ] `requestAnimationFrame()` — RN'de `global.requestAnimationFrame` veya polyfill

### 1.2 addEventListener Uyarlaması
- [ ] `addEventListener(target, eventName, handler)` implement et
- [ ] `target === 'window'` + `eventName === 'resize'` → `Dimensions.addEventListener('change', handler)`
- [ ] Diğer target/event kombinasyonları için no-op veya uygun RN API mapping
- [ ] Cleanup fonksiyonu döndür (`removeEventListener`)

### 1.3 Pointer Lock (Mobilde Yok)
- [ ] `getPointerLockElement()` — `null` döndür
- [ ] `requestPointerLock()` — no-op
- [ ] `exitPointerLock()` — no-op
- [ ] InputManager'ın pointer lock kontrollerinin RN'de çökmediğinden emin ol

### 1.4 Test & Doğrulama
- [ ] RNPlatform'u izole test et (Dimensions mock)
- [ ] Engine constructor'a `platform: new RNPlatform()` vererek headless modda çalıştığını doğrula

---

## Sprint 2: RNRendererAdapter

### 2.1 expo-gl / expo-three Entegrasyonu
- [ ] `GLView`'dan `onContextCreate` ile `gl` context al
- [ ] `expo-three` `Renderer` ile Three.js renderer oluştur (DOM canvas yok)
- [ ] `gl.drawingBufferWidth` / `gl.drawingBufferHeight` ile viewport

### 2.2 RNRendererAdapter Sınıfı
- [ ] `src/adapters/react-native/RNRendererAdapter.js` oluştur
- [ ] `mount(options)` — `options.gl` (expo-gl context) al, `options.container` opsiyonel
- [ ] `appendChild` çağrısı yapma (RN'de DOM yok)
- [ ] ThreeRendererAdapter ile aynı contract: `createSceneHandle`, `unwrapScene`, `unwrapCamera`, `render`, `resize`, `dispose`

### 2.3 mount() Farklılıkları
- [ ] `THREE.WebGLRenderer` yerine expo-three `Renderer` kullan
- [ ] `renderer.domElement` yok — Engine'ın buna ihtiyacı var mı kontrol et (sadece appendChild için)
- [ ] `renderer.setSize()` — `gl.drawingBufferWidth/Height` veya parametre ile

### 2.4 resize() Davranışı
- [ ] `Dimensions` change veya `GLView` layout event'inden resize tetikle
- [ ] `renderAdapter.resize(width, height)` Engine tarafından `onWindowResize` ile çağrılıyor — RN'de `Dimensions` değişince aynı akışı tetikle

### 2.5 SceneHandle Uyumluluğu
- [ ] `ThreeSceneHandle` / `createSceneHandle` — Three.js Scene kullanıldığı için aynı mantık geçerli
- [ ] `unwrapScene` / `unwrapCamera` — ThreeRendererAdapter ile aynı

### 2.6 Test
- [ ] Örnek RN uygulamasında boş sahne render et
- [ ] Kamera + basit mesh (BoxGeometry) ile görsel doğrulama
- [ ] Cihaz rotasyonunda resize'ın çalıştığını kontrol et

---

## Sprint 3: RNInputManager

### 3.1 Input Contract Analizi
- [ ] InputManager'ın Engine/System tarafından kullanılan API'lerini listele
- [ ] `triggerAction`, `consumeCommands`, `drainReplayFrame`, `enqueueExternalCommands`
- [ ] `getMovementVector`, `getMouseDelta`, `isActionActive`, `getRaycastIntersection`

### 3.2 RNInputManager Sınıfı
- [ ] `src/adapters/react-native/RNInputManager.js` oluştur
- [ ] Aynı event/command API'sini koru (Engine ve System'lar değişmeden çalışsın)
- [ ] DOM event'leri yerine RN gesture/touch kullan

### 3.3 Touch → Action Mapping
- [ ] Tek dokunuş (tap) → `attack` action
- [ ] Swipe yönleri → `forward`, `backward`, `left`, `right`
- [ ] İki parmak tap → `jump` veya `skill1` (oyuna göre)
- [ ] `bindings` yapısını koru; mobil için `mobile` profile ekle

### 3.4 Joystick / Virtual D-Pad (Opsiyonel)
- [ ] Ekranın sol altında virtual joystick
- [ ] `joystickDir.x`, `joystickDir.z` güncelle
- [ ] `getMovementVector` bu değerleri kullansın (mevcut InputManager zaten destekliyor)

### 3.5 Touch → NDC (Raycast için)
- [ ] `event.nativeEvent.locationX/Y` + viewport size ile NDC hesapla
- [ ] `mousePos` benzeri `touchPos` — `getRaycastIntersection` için
- [ ] `getMouseDelta` — swipe delta veya joystick ile simüle et

### 3.6 Gesture Handler Entegrasyonu
- [ ] `react-native-gesture-handler` ile `PanResponder` veya `GestureDetector`
- [ ] `onTouchStart`, `onTouchMove`, `onTouchEnd` → command queue'ya ekle
- [ ] `attach()` / `detach()` — GLView veya root View ref'e bağla

### 3.7 Test
- [ ] Tap → attack command
- [ ] Swipe → movement command
- [ ] `getMovementVector` doğru değer döndürüyor mu
- [ ] Replay/snapshot ile uyumluluk

---

## Sprint 4: Engine Entegrasyonu

### 4.1 Engine Constructor Uyarlaması
- [ ] `container` — RN'de `null` veya GLView ref (appendChild yapılmayacak)
- [ ] `platform: new RNPlatform()`
- [ ] `rendererAdapter: new RNRendererAdapter({ gl })` — gl, GLView context create sonrası inject edilmeli
- [ ] Engine'da `container || platform.getBody()` — RN'de `getBody()` ne dönecek netleştir

### 4.2 Mount Sırası
- [ ] GLView `onContextCreate` → gl al
- [ ] RNRendererAdapter oluştur, `mount({ gl, platform })` çağır
- [ ] Engine oluştur (rendererAdapter hazır)
- [ ] Engine.start() — loop başlasın

### 4.3 React Component Yapısı
- [ ] `ZortEngineView` veya `GameView` wrapper component
- [ ] `useRef` ile Engine instance
- [ ] `useEffect` cleanup'ta `engine.destroy()`
- [ ] GLView + Engine lifecycle'ı doğru sırada

### 4.4 Resize Akışı
- [ ] `Dimensions.addEventListener('change')` → `onWindowResize` benzeri çağrı
- [ ] RNPlatform'tan Engine'a resize event'i ilet
- [ ] `GLView` layout değişince (ör. orientation) resize tetiklenmeli

### 4.5 Örnek Oyun Entegrasyonu
- [ ] zigzag-runner veya minimal scene'i RN'de çalıştır
- [ ] Scene setup, camera, basit objeler
- [ ] InputManager yerine RNInputManager register et

### 4.6 Test
- [ ] Uygulama açılıyor, sahne render ediliyor
- [ ] Touch ile karakter/obje hareketi
- [ ] Rotasyon/resize sonrası görüntü bozulmuyor

---

## Sprint 5: Asset Pipeline & Metro

### 5.1 Metro Config
- [ ] `assetExts` — `glb`, `gltf`, `obj` vb. ekle
- [ ] `sourceExts` — gerekirse
- [ ] Asset resolver'ın `require('./model.glb')` ile çalıştığını doğrula

### 5.2 ThreeAssetLoader RN Uyumu
- [ ] `require()` ile asset path — RN'de farklı
- [ ] `fetch` vs `require` — hangi asset tipleri için ne kullanılacak
- [ ] TextureLoader, GLTFLoader — expo-three/Three.js uyumluluğu

### 5.3 Asset Yükleme Testi
- [ ] GLB model yükle ve sahneye ekle
- [ ] Texture yükle
- [ ] AssetStore retain/release RN'de sorunsuz mu

### 5.4 Hata Yönetimi
- [ ] Asset yükleme hatalarında fallback
- [ ] Loading state / progress (opsiyonel)

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
