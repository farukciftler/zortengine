# 🎮 Mini 3D Engine

Bu oyun motoru, **Three.js** üzerine inşa edilmiş; modüler, hafif ve esnek bir 3D oyun motorudur. 
İster bir İzometrik RPG, ister FPS oyunu, isterseniz de bir Yarış oyunu yapın; motor içindeki sistemler projenizi hızlandırmak için tasarlandı.

## 📁 Klasör Yapısı

Engine klasörünü yeni projenize kopyalayıp hemen çalışmaya başlayabilirsiniz.
- `core/` -> Motorun kalbi (`Engine.js`, `SceneManager.js`)
- `objects/` -> Temel oyun nesneleri (`GameObject.js`, `ModularCharacter.js`)
- `systems/` -> Kamera, Giriş (Input), Ses ve Fizik sistemleri.
- `utils/` -> Model ve Doku yükleyiciler (`AssetLoader.js`)

## 🚀 Hızlı Başlangıç

### 1. HTML Kurulumu
Projenizin `index.html` dosyasında `Three.js`'i dahil ettiğinizden emin olun:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script type="module" src="js/main.js"></script>
```

### 2. Motoru Genişletmek
Kendi oyununuzu oluştururken `Engine` sınıfından miras alırsınız:

```javascript
// js/MyGame.js
import { Engine } from './engine/core/Engine.js';
import { CameraManager } from './engine/systems/CameraManager.js';
import { ModularCharacter } from './engine/objects/ModularCharacter.js';

export class MyGame extends Engine {
    constructor() {
        super(document.body); // Canvas'ı body'ye ekler

        // Kamerayı hazır preset ile ayarla
        this.cameraManager = new CameraManager(this.scene);
        this.cameraManager.setPreset('isometric'); 
        this.setCamera(this.cameraManager);

        // Sahneye Işık Ekle
        const light = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(light);

        // Modüler bir karakter oluştur ve oyuna ekle
        this.player = new ModularCharacter(this.scene, 0, 0, { colorSuit: 0xff0000 });
        this.add(this.player);

        // Döngüyü başlat
        this.start();
    }

    // Bu fonksiyon saniyede 60 kere otomatik çağrılır
    update(delta, time) {
        // Karakteri yürüme modunda hareket ettir
        this.player.animateWalk(time, 1.5);
        this.player.group.position.x += delta * 2;
        
        // Kamera karakteri takip etsin
        this.cameraManager.updateFollow(this.player.group.position, 0, delta);
    }
}
```

### 3. Oyunu Başlatma
```javascript
// js/main.js
import { MyGame } from './MyGame.js';
window.onload = () => new MyGame();
```

## 🛠 Modüllerin Kullanımı

**Modüler Karakter Giydirme:**
`ModularCharacter` bir iskelet gibidir, eline kılıç veya kafasına şapka takabilirsiniz.
```javascript
const kılıçMesh = new THREE.Mesh(...);
karakter.equip('rightHand', kılıçMesh); // Sağ ele kılıç tak
karakter.unequip('rightHand'); // Kılıcı çıkar
```

**Kamera Presetleri:**
Farklı oyun tarzları için tek satırda kameranızı ayarlayın:
```javascript
this.cameraManager.setPreset('top-down');
this.cameraManager.setPreset('fps');
this.cameraManager.setPreset('tps'); // Omuz üstü
this.cameraManager.setPreset('isometric');
```

**Giriş (Input) Yöneticisi:**
Klavye/Fare veya Joystick ile entegre çalışır.
```javascript
import { InputManager } from './engine/systems/InputManager.js';
this.input = new InputManager();

const move = this.input.getMovementVector(); // {x: 1, z: 0} gibi WASD/Ok tuşlarından yön döner
if (this.input.isKeyDown('space')) {
    // Zıpla
}
```

**Fizik, Ağırlık ve Momentum:**
`PhysicsManager` artık kütle, sürtünme, sekme, damping, gravity scale ve kuvvet/impulse yardımcılarını destekler.
```javascript
const physics = new PhysicsManager({
    gravity: { x: 0, y: -9.81, z: 0 },
    defaultContactMaterial: { friction: 0.45, restitution: 0.02 }
});

const groundMaterial = physics.createMaterial('ground', { friction: 0.9 });
const crateMaterial = physics.createMaterial('crate', { friction: 0.6, restitution: 0.05 });

physics.addContactMaterial(crateMaterial, groundMaterial, {
    friction: 0.8,
    restitution: 0.02
});

const crateBody = physics.createBox(2, 2, 2, 25, { x: 0, y: 5, z: 0 }, null, {
    material: crateMaterial,
    linearDamping: 0.35,
    angularDamping: 0.4,
    gravityScale: 1.0
});

physics.addBody(crateBody, crateMesh);
physics.applyImpulse(crateBody, { x: 0, y: 0, z: -8 });

const momentum = physics.getMomentum(crateBody);
```

## 📌 Kurallar
Motor kodlarının (`engine/`) içine asla projenize özel (örn: `AltinSayisi`, `ZombiVur()`) kodlar yazmayın. Özel kodlarınızı her zaman `game/` klasöründe tutun. Motoru temiz tutarsanız, bir sonraki projenize saniyeler içinde kopyalayabilirsiniz!
