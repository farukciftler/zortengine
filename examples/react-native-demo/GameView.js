/**
 * ZortEngine React Native wrapper — GLView + Engine lifecycle
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
// Metro/symlink çözümlemesi bazen `zortengine` root export'unda takılabildiği için deep import kullanıyoruz.
import { Engine, GameScene } from 'zortengine/src/engine/index.js';
// Metro'da package exports kapalı olduğunda `zortengine/react-native` resolve edilemeyebiliyor.
// Bu demo monorepo/symlink kullandığı için deep import tercih ediyor.
import { RNPlatform, RNRendererAdapter, RNInputManager } from 'zortengine/src/adapters/react-native/index.js';
import * as THREE from 'three';

if (typeof global !== 'undefined') {
  global.THREE = global.THREE || THREE;
}

class DemoScene extends GameScene {
  setup() {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
    this.setCamera(camera);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    this.threeScene.add(mesh);
    this._cube = mesh;

    this.threeScene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const input = this.engine._rnInputManager;
    if (input) {
      this.registerSystem('input', input);
      input.on('attack', () => {
        if (this._cube) this._cube.rotation.y += 0.5;
      });
    }
  }

  onResize(width, height, aspect) {
    const cam = this.getCamera();
    const threeCam = cam?.getNativeCamera?.() || cam?.getThreeCamera?.() || cam;
    if (threeCam?.isPerspectiveCamera) {
      threeCam.aspect = aspect;
      threeCam.updateProjectionMatrix();
    }
  }

  onUpdate(delta) {
    if (this._cube) {
      this._cube.rotation.x += delta * 0.5;
    }
  }
}

export function GameView({ style }) {
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
    adapter.mount({
      gl,
      platform,
      viewport: { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight },
    });

    const engine = new Engine(null, {
      platform,
      rendererAdapter: adapter,
      headless: false,
    });
    engine._rnInputManager = inputManager;
    engineRef.current = engine;

    const scene = new DemoScene({ name: 'demo' });
    engine.addScene('demo', scene);
    engine.useScene('demo');
    engine.start();
  }, []);

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
