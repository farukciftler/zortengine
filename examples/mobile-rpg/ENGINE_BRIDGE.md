## React Native – ZortEngine Bridge (Reference)

This file is prepared to show the **most basic bridge between React Native (Expo) and ZortEngine** in the mobile RPG project. The codes have been simplified from `examples/react-native-demo/GameView.js`.

### 1. Basic GameView skeleton on the RN side

```js
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Engine } from 'zortengine/src/engine/index.js';
import { RNPlatform, RNRendererAdapter, RNInputManager } from 'zortengine/src/adapters/react-native/index.js';

export function GameView({ style, createScene }) {
  const engineRef = useRef(null);
  const platformRef = useRef(null);
  const adapterRef = useRef(null);
  const inputRef = useRef(null);
  const [panHandlers, setPanHandlers] = useState({});

  const handleContextCreate = useCallback((gl) => {
    const platform = platformRef.current || new RNPlatform();
    platformRef.current = platform;

    const inputManager = new RNInputManager({ platform, autoAttach: false });
    inputManager.attach();
    setPanHandlers(inputManager.getPanHandlers());

    const adapter = adapterRef.current || new RNRendererAdapter();
    adapterRef.current = adapter;
    const viewport = { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };

    adapter.mount({ gl, platform, viewport });

    const engine = new Engine(null, {
      platform,
      rendererAdapter: adapter,
      headless: false,
    });
    engine._rnInputManager = inputManager;
    engineRef.current = engine;

    const scene = createScene(engine);
    engine.addScene(scene.name, scene);
    engine.useScene(scene.name);

    const aspect = viewport.width / Math.max(1, viewport.height);
    scene.onResize?.(viewport.width, viewport.height, aspect);
    adapter.resize?.(viewport.width, viewport.height);

    engine.start();
  }, [createScene]);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy?.();
    };
  }, []);

  return (
    <View ref={inputRef} style={[styles.container, style]} {...panHandlers} collapsable={false}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={handleContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### 2. Scene creation example (RpgWorldScene)

```js
import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';

export class RpgWorldScene extends GameScene {
  constructor() {
    super({ name: 'rpg-world' });
  }

  setup() {
    const { width, height } = this.engine.platform.getViewportSize();
    const aspect = width / Math.max(1, height);

    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, 0);
    this.setCamera(camera);

    this.threeScene.add(new THREE.AmbientLight(0xffffff, 0.7));
    // RPG world (ground, decor, character, enemies) will be added here.
  }
}
```

### 3. Usage (example)

```js
// On the RN side:
// <GameView createScene={(engine) => new RpgWorldScene()} />
```

In the mobile RPG project, different scenes (Hub, World, Dungeon) will be produced via this bridge; on the RN side, UI, menus, and inventory management will be provided with React Native components.


