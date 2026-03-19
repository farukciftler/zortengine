## Mobile RPG – Sprint Planı (React Native + ZortEngine)

Bu plan, **React Native (Expo) + ZortEngine** kullanarak _küçük ama derinlikli_ bir **mobile action RPG** (küçük dünya, birkaç bölge, progression, temel quest yapısı) çıkarmak için hazırlanmıştır. Hedef: **oynanabilir bir vertical slice** (1 bölge + 1 hub + 1 boss + basit loot/level/quest zinciri).

### Sprint 0 – Proje İskeleti & Altyapı
- [x] **RN Projesi / Dizayn**
  - [x] `examples/mobile-rpg/` altında dokümantasyon ve taslak dosya yapısını kur.
  - [x] Hedef: RN tarafında UI + navigation, ZortEngine tarafında 3D/oyun loop tamamen ayrık dursun.
- [x] **Engine Bridge (RN <-> ZortEngine)**
  - [x] `examples/react-native-demo/GameView.js` içindeki GLView + Engine bootstrap kodunu incele.
  - [x] Aynı mantığı soyutlayan bir “bridge” tanımı çıkar: `MobileRpgGameView` veya `createEngineWithRN(gl, sceneFactory)`.
  - [x] Bridge; `RNPlatform`, `RNRendererAdapter`, `RNInputManager` ve `Engine` kurulumunu tek yerden yapsın.
- [x] **Temel Sahne Pipeline’ı**
  - [x] `GameScene` tabanlı sahne yapısına uygun olarak “hub”, “world”, “dungeon” gibi sahne tiplerini isimlendir.
  - [x] Her sahnede ortak olacak sistemleri belirle: `input`, `camera`, `movement`, `combat`, `ui-sync`.

### Sprint 1 – Core RPG Loop (Movement + Kamera + Düşman)
- [x] **Top-down / hafif izometrik kamera**
  - [x] Mobil için okunaklı bir açı seç (ör: hafif yukarıdan, karakter ortada).
  - [x] `RpgWorldScene` içinde temel kamera setup’ını kur; `onResize` ile aspect’e göre güncelle.
- [x] **Karakter hareketi (touch drag tabanlı)**
  - [x] `RNInputManager` ile pointer drag verisini al.
  - [x] `movementSystem` ile drag yönünü world-space’e çevir (kamera yönünü gözeterek).
  - [x] Karakter hızlanma/yavaşlama (acceleration) + basit frenleme ekle.
- [x] **Düşman spawn + basit AI**
  - [x] `enemySpawnerSystem`: belirli aralıklarla karakter çevresine düşman spawn et.
  - [x] `enemyAiSystem`: düşmanları oyuncuya doğru koşan, basit “yakın dövüş” yapan bir yapıya getir.
- [x] **Çarpışma / hasar iskeleti**
  - [x] Physics kullanmadan, AABB / mesafe tabanlı çarpışma ile basit saldırı ve hasar hesapla.
  - [x] `HealthComponent` ve `DamageEvent` benzeri veri yapıları tanımla.

### Sprint 2 – Combat Sistemi & Skill’ler
- [x] **Basic attack**
  - [x] RN UI'de tek bir "Attack” butonu (overlay) ekle.
  - [x] Buton event’ini `input` sistemine aktar, combat sisteminde consume et.
  - [x] Saldırı sırasında animasyon yerine kısa scale/flash + knockback efektleri kullan.
- [x] **Skill bar (2 aktif skill)**
  - [x] İki skill slotu: örn. “Dash” ve “Area Slash”.
  - [x] Cooldown, mana (veya energy) mekaniklerini minimal düzeyde uygula.
  - [ ] Skill kullanımı için görsel geri bildirim (UI ikon highlight, cooldown overlay).
- [ ] **Düşman çeşitliliği**
  - [ ] En az 2 enemy arketipi: yavaş/tank ve hızlı/zayıf.
  - [ ] Farklı hareket pattern’leri ve saldırı menzilleri tanımla.

### Sprint 3 – Progression: XP, Level, Stat’lar, Loot
- [ ] **XP & Level sistemi**
  - [ ] Öldürülen düşmanlardan XP topla.
  - [ ] Level up olduğunda stat artışı (örn. HP, damage, movement speed).
  - [ ] Level up anında kısa ekran efekti + UI bildirimi.
- [ ] **Item / loot sistemi (hafif)**
  - [ ] Basit rarity’ler: Common / Rare / Epic (renk kodlu).
  - [ ] Silah/zırh yerine pasif buff item’lar (örn. %damage, %hp, %movespeed).
  - [ ] Düşmanlardan ve küçük sandıklardan loot düşsün.
- [ ] **Inventory & equip**
  - [ ] RN tarafında basit bir inventory list UI’si (ikon + isim + stat).
  - [ ] “Equip” / “Unequip” butonları ile aktif stat’ları güncelle.

### Sprint 4 – Dünya Yapısı: Hub + Bölge + Dungeon
- [ ] **Hub sahnesi**
  - [ ] Şehir/alan vari küçük bir hub: NPC’ler (statik), basit dekor.
  - [ ] Buradan “World” (dış alan) ve “Dungeon”’lara geçiş portal’ları / kapıları olsun.
- [ ] **Dünya sahnesi (RpgWorldScene)**
  - [ ] Açık alan (forest/field stili) layout; path’ler, engeller, dekor objeleri.
  - [ ] Random encounter: dolaşırken ufak düşman grupları spawn olsun.
- [ ] **Dungeon sahnesi**
  - [ ] Daha sıkışık, odalar ve koridorlardan oluşan level.
  - [ ] Spawn noktaları, mini-boss, trap’ler (örn. periodik zarar veren alan).
  - [ ] Basit “run sonuç ekranı”: dungeon tamamlanınca ödül ekranı.

### Sprint 5 – Quest Sistemi & Basit Hikâye Akışı
- [ ] **Quest modellemesi**
  - [ ] Basit bir `Quest` yapısı: id, isim, açıklama, hedefler, ödüller.
  - [ ] Hedef tipleri: “X düşmanı öldür”, “Y item’ini topla”, “Z bölgesine git”.
- [ ] **Quest akışı**
  - [ ] Hub’daki bir NPC üzerinden ana quest zincirini başlat.
  - [ ] Quest ilerlemesini engine tarafında track et, RN UI’ye yansıt.
  - [ ] Tamamlanan quest için ödül ver ve bir sonrakine zincirle.
- [ ] **Quest UI**
  - [ ] RN tarafında “active quest” paneli (küçük overlay).
  - [ ] Basit quest list ekranı (pause menüsünden erişilebilir).

### Sprint 6 – RPG UI/UX & Mobil Parlatma
- [ ] **HUD**
  - [ ] HP bar, mana/energy bar, XP bar, level etiketi.
  - [ ] Mini-map yerine basit “kompas” veya ok gösterimi (hedef yönü için).
- [ ] **Kontrollerin ince ayarı**
  - [ ] Drag sensitivity, deadzone, camera follow hızları için ayar profilleri.
  - [ ] Düşük FPS durumunda input’un pürüzsüz hissetmesi için clamp/lerp düzeltmeleri.
- [ ] **Performans & cihaz uyumu**
  - [ ] Eski cihazlar için kalite ayarları: gölge kapatma, LOD düşürme, efekt yoğunluğu.
  - [ ] FPS ve GC spike’larını tespit edip ağır sistemlerde optimizasyon.

### Sprint 7 – Persistence & Meta Progression
- [ ] **Save/Load**
  - [ ] Oyuncu level, stat, önemli quest ilerleme ve kritik loot bilgisini kaydet.
  - [ ] Uygulama yeniden açıldığında kaldığı yerin “özet” halinden devam edebilsin (tam olarak aynı sahne olmak zorunda değil).
- [ ] **Meta progression**
  - [ ] Run’lar arasında kalıcı buff’lar (roguelite-lite hissi): örn. +max HP, +%gold gain.
  - [ ] Basit bir “upgrade tree” veya lineer upgrade listesi.

---

Bu sprint planı, `examples/mobile-rpg/` altında hem **engine sahneleri** hem de **React Native UI** ile beraber geliştirilecek bir mobile RPG için yol haritasıdır. İlk adım olarak:

1. `examples/react-native-demo` içindeki `GameView`/RN bridge mantığı soyutlanacak.
2. `RpgWorldScene` + `HubScene` iskeletleri tanımlanacak.
3. Ardından Sprint 1 kapsamındaki movement + temel combat ile dikey dilim ayağa kaldırılacaktır.

