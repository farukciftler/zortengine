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
    const { width, height } = this.engine?.platform?.getViewportSize?.() || { width: 1, height: 1 };
    const aspect = (width && height) ? (width / height) : 1;

    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.set(0, 1.6, 4);
    camera.lookAt(0, 0, 0);
    this.setCamera(camera);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    this.threeScene.add(mesh);
    this._cube = mesh;

    this.threeScene.add(new THREE.AmbientLight(0xffffff, 0.6));

    this._isPressing = false;
    // rad/s cinsinden açısal hız
    this._angularVel = { x: 0, y: 0 };
    this._lastDragTs = null;

    const input = this.engine._rnInputManager;
    if (input) {
      this.registerSystem('input', input);
      input.on('pressStart', () => {
        this._isPressing = true;
        this._lastDragTs = null;
        if (this._cube) this._cube.scale.set(1.08, 1.08, 1.08);
      });
      input.on('pressEnd', () => {
        this._isPressing = false;
        this._lastDragTs = null;
        if (this._cube) this._cube.scale.set(1, 1, 1);
      });
      input.on('drag', ({ dx, dy, time }) => {
        if (!this._cube) return;
        // Parmak sürükleme -> anlık dönme + momentum için hız örneklemesi
        const sensitivity = 0.012; // rad / px
        this._cube.rotation.y += dx * sensitivity;
        this._cube.rotation.x += dy * sensitivity;

        const dtMs = this._lastDragTs ? Math.max(8, time - this._lastDragTs) : 16;
        this._lastDragTs = time;
        const dt = dtMs / 1000;
        // (rad/px * px) / s = rad/s
        this._angularVel.y = (dx * sensitivity) / dt;
        this._angularVel.x = (dy * sensitivity) / dt;
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
    if (!this._cube) return;
    if (this._isPressing) return;

    // Bırakınca momentum: sürtünmeyle yavaşlat
    const dampingPerSecond = 7.5; // yüksekse daha hızlı durur
    const k = Math.exp(-dampingPerSecond * Math.max(0, delta));
    this._angularVel.x *= k;
    this._angularVel.y *= k;

    // Çok küçükse durdur (mikro jitter olmasın)
    if (Math.abs(this._angularVel.x) < 0.01) this._angularVel.x = 0;
    if (Math.abs(this._angularVel.y) < 0.01) this._angularVel.y = 0;

    this._cube.rotation.x += this._angularVel.x * delta;
    this._cube.rotation.y += this._angularVel.y * delta;
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
    const viewport = { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
    adapter.mount({
      gl,
      platform,
      viewport,
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

    // İlk frame öncesi aspect/viewport senkronu
    const aspect = viewport.width / Math.max(1, viewport.height);
    scene.onResize?.(viewport.width, viewport.height, aspect);
    adapter.resize?.(viewport.width, viewport.height);

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
