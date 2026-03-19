# ZortEngine React Native

This document contains setup and usage information for using ZortEngine in a React Native environment.

## Installation

```bash
npm install zortengine expo-gl expo-three three react-native-gesture-handler
```

## Usage

```js
import { Engine, GameScene } from 'zortengine';
import { RNPlatform, RNRendererAdapter, RNInputManager } from 'zortengine/react-native';
```

### Mount Order

Since the GL context is only available in the `onContextCreate` callback of `GLView`, the adapter should be mounted before the Engine is created:

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

`RNInputManager` is touch-based. Spread the handlers returned by `getPanHandlers()` into your View:

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

A ready-to-use joystick component including left/right screen splitting, deadzone, and smoothing:

```js
import { VirtualJoystick } from 'zortengine/react-native';

<VirtualJoystick
  region="left"                    // 'left' | 'right' | { left, top, width, height } (0-1)
  onDirectionChange={(x, z) => inputManager.setJoystickDir(x, z)}
  onReleaseOutside={() => inputManager.triggerAction('attack')}  // when finger slides right
  deadzone={0.12}
  radius={80}
  resetOnRelease={true}
  showVisual={true}
/>
```

### TouchRegion (createRegionChecker)

Helper for custom touch regions:

```js
import { createRegionChecker } from 'zortengine/react-native';

const isLeft = createRegionChecker('left');
const isRight = createRegionChecker('right');
const isCustom = createRegionChecker({ left: 0, top: 0, width: 0.5, height: 1 });  // ratio 0-1
const isPx = createRegionChecker({ leftPx: 0, topPx: 0, widthPx: 100, heightPx: 200 });
```

## Example

`examples/react-native-demo/` — minimal Expo project:

```bash
cd examples/react-native-demo
npm install
npm start
```

## Asset Loading

`glb`, `gltf`, `obj` asset formats are defined in Metro config. Use `require()` for asset paths:

```js
const modelUrl = require('./assets/model.glb');
// Load with ThreeAssetLoader
```

## Known Limitations

- There may be WebGL issues on the emulator; testing on a **real device** is recommended.
- Pointer lock is not supported on mobile.
- No keyboard input; touch/gesture-based input should be used.
- UIManager is DOM-based; an alternative UI is required in RN.

