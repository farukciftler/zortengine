import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Engine } from 'zortengine/src/engine/index.js';
import { RNPlatform, RNRendererAdapter, RNInputManager } from 'zortengine/src/adapters/react-native/index.js';
import { setGameAPI, clearGameAPI } from './gameBridge.js';

export const GameView = React.memo(function GameView({ style, createScene, pointerEvents }) {
  const engineRef = useRef(null);
  const inputManagerRef = useRef(null);
  const platformRef = useRef(null);
  const adapterRef = useRef(null);

  const handleContextCreate = useCallback(
    (gl) => {
      const platform = platformRef.current || new RNPlatform();
      platformRef.current = platform;

      const inputManager = new RNInputManager({ platform, autoAttach: false });
      inputManager.attach();
      inputManagerRef.current = inputManager;
      const im = inputManager;

      const adapter = adapterRef.current || new RNRendererAdapter({ shadows: true });
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

      setGameAPI({
        setJoystickDir: (x, z) => im.setJoystickDir(x, z),
        triggerAttack: () => im.triggerAction('attack', { profile: 'mobile' }),
      });
    },
    [createScene]
  );

  useEffect(() => {
    return () => {
      clearGameAPI();
      engineRef.current?.destroy?.();
    };
  }, []);

  return (
    <View style={[styles.container, style]} collapsable={false} pointerEvents={pointerEvents}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={handleContextCreate} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

