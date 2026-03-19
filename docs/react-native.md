# ZortEngine React Native

Bu doküman, ZortEngine'ı React Native ortamında kullanmak için gerekli kurulum ve kullanım bilgilerini içerir.

## Kurulum

```bash
npm install zortengine expo-gl expo-three three react-native-gesture-handler
```

## Kullanım

```js
import { Engine, GameScene } from 'zortengine';
import { RNPlatform, RNRendererAdapter, RNInputManager } from 'zortengine/react-native';
```

### Mount Sırası

GL context yalnızca `GLView`'ın `onContextCreate` callback'inde mevcut olduğundan, Engine oluşturulmadan önce adapter mount edilmelidir:

```js
const handleContextCreate = (gl) => {
  const platform = new RNPlatform();
  const adapter = new RNRendererAdapter();
  adapter.mount({ gl, platform });

  const engine = new Engine(null, { platform, rendererAdapter: adapter });
  engine.addScene('main', new MyScene());
  engine.useScene('main');
  engine.start();
};

<GLView onContextCreate={handleContextCreate} />
```

### Input

`RNInputManager` touch tabanlıdır. `getPanHandlers()` ile dönen handler'ları View'a spread edin:

```js
const input = new RNInputManager({ platform });
input.attach();
<View {...input.getPanHandlers()}>
  <GLView ... />
</View>
```

- **Tap** → `attack` action
- **Swipe** → `left`, `right`, `forward`, `backward` actions

### VirtualJoystick (Reusable)

Sol/sağ ekran ayırma, deadzone, smoothing dahil hazır joystick bileşeni:

```js
import { VirtualJoystick } from 'zortengine/react-native';

<VirtualJoystick
  region="left"                    // 'left' | 'right' | { left, top, width, height } (0-1)
  onDirectionChange={(x, z) => inputManager.setJoystickDir(x, z)}
  onReleaseOutside={() => inputManager.triggerAction('attack')}  // parmak sağa kayınca
  deadzone={0.12}
  radius={80}
  resetOnRelease={true}
  showVisual={true}
/>
```

### TouchRegion (createRegionChecker)

Özel dokunma bölgeleri için yardımcı:

```js
import { createRegionChecker } from 'zortengine/react-native';

const isLeft = createRegionChecker('left');
const isRight = createRegionChecker('right');
const isCustom = createRegionChecker({ left: 0, top: 0, width: 0.5, height: 1 });  // oran 0-1
const isPx = createRegionChecker({ leftPx: 0, topPx: 0, widthPx: 100, heightPx: 200 });
```

## Örnek

`examples/react-native-demo/` — minimal Expo projesi:

```bash
cd examples/react-native-demo
npm install
npm start
```

## Asset Yükleme

Metro config'de `glb`, `gltf`, `obj` asset formatları tanımlı. Asset path için `require()` kullanın:

```js
const modelUrl = require('./assets/model.glb');
// ThreeAssetLoader ile yükle
```

## Bilinen Sınırlamalar

- Emülatörde WebGL sorunları olabilir; **gerçek cihazda** test önerilir.
- Pointer lock mobilde desteklenmez.
- Klavye input yok; touch/gesture tabanlı input kullanılmalı.
- UIManager DOM tabanlı; RN'de alternatif UI gerekir.
