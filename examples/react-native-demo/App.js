import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GameView } from './GameView';
import { VirtualJoystick } from 'zortengine/src/adapters/react-native/index.js';
import {
  getRallyInputAPI,
  setRallyGas,
  setRallyBrake,
  resetRallyPedals,
} from './rallyBridge.js';

export default function App() {
  const [mode, setMode] = useState(null); // 'tap' | 'run' | 'rally' | null
  const gameKey = useMemo(() => (mode ? `mode:${mode}` : 'menu'), [mode]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!alive) return;
        if (mode === 'rally') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch (e) {
        console.warn('[App] ScreenOrientation', e?.message ?? e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'rally') {
      resetRallyPedals();
    }
  }, [mode]);

  const onRallyDir = useCallback((x) => {
    getRallyInputAPI()?.setJoystickDir?.(x, 0);
  }, []);

  if (!mode) {
    return (
      <View style={styles.menuContainer}>
        <View style={styles.menuHeader}>
          <Text style={styles.title}>ZortEngine</Text>
          <Text style={styles.subtitle}>React Native Showcase</Text>
        </View>

        <View style={styles.menuButtons}>
          <Pressable style={styles.button} onPress={() => setMode('tap')}>
            <Text style={styles.buttonTitle}>Tap Arena</Text>
            <Text style={styles.buttonHint}>Dokun: hedef patlat</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={() => setMode('run')}>
            <Text style={styles.buttonTitle}>Swipe Runner</Text>
            <Text style={styles.buttonHint}>Sağ/Sol swipe: şerit değiştir</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={() => setMode('rally')}>
            <Text style={styles.buttonTitle}>Ralli</Text>
            <Text style={styles.buttonHint}>Yatay ekran • Sol: direksiyon • Sağ: gaz / fren</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>LAN: Expo Go ile bağlan</Text>
      </View>
    );
  }

  const overlayTitle =
    mode === 'tap' ? 'Tap Arena' : mode === 'run' ? 'Swipe Runner' : mode === 'rally' ? 'Ralli' : '';
  const overlayHint =
    mode === 'tap'
      ? 'Dokunarak hedefleri patlat'
      : mode === 'run'
        ? 'Sağ/Sol swipe ile şerit değiştir'
        : mode === 'rally'
          ? 'Sol: direksiyon • Sağ: gaz ve fren'
          : '';

  return (
    <View style={styles.container}>
      <GameView
        key={gameKey}
        style={styles.gameView}
        mode={mode}
        pointerEvents={mode === 'rally' ? 'none' : 'auto'}
      />
      {mode === 'rally' && (
        <View style={styles.rallyHud} pointerEvents="box-none">
          <View style={styles.joystickZone} pointerEvents="auto" collapsable={false}>
            <VirtualJoystick
              region="left"
              onDirectionChange={onRallyDir}
              deadzone={0.08}
              radius={72}
              showVisual
            />
          </View>
          <View style={styles.pedalZone} pointerEvents="auto" collapsable={false}>
            <Pressable
              style={({ pressed }) => [styles.pedal, styles.pedalBrake, pressed && styles.pedalPressed]}
              onPressIn={() => setRallyBrake(1)}
              onPressOut={() => setRallyBrake(0)}
            >
              <Text style={styles.pedalLabel}>FREN</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.pedal, styles.pedalGas, pressed && styles.pedalPressed]}
              onPressIn={() => setRallyGas(1)}
              onPressOut={() => setRallyGas(0)}
            >
              <Text style={styles.pedalLabel}>GAZ</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={styles.overlay}>
        <Pressable style={styles.backButton} onPress={() => setMode(null)}>
          <Text style={styles.backText}>← Menü</Text>
        </Pressable>
        <View style={styles.overlayRight} pointerEvents="none">
          <Text style={styles.overlayTitle}>{overlayTitle}</Text>
          <Text style={styles.overlayHint}>{overlayHint}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    backgroundColor: '#070b12',
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 28,
  },
  menuHeader: {
    marginBottom: 36,
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    color: '#93a4c7',
    fontSize: 14,
  },
  menuButtons: {
    gap: 14,
  },
  rallyHud: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  joystickZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '42%',
  },
  pedalZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '38%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 20,
    paddingRight: 12,
    gap: 12,
  },
  pedal: {
    width: 88,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  pedalGas: {
    backgroundColor: 'rgba(39, 174, 96, 0.85)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pedalBrake: {
    backgroundColor: 'rgba(192, 57, 43, 0.85)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pedalPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  pedalLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#0d1322',
    borderWidth: 1,
    borderColor: '#1b2a55',
  },
  buttonTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  buttonHint: {
    color: '#93a4c7',
    fontSize: 13,
  },
  footer: {
    marginTop: 'auto',
    color: '#55648a',
    fontSize: 12,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0e14',
  },
  gameView: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 54,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 19, 34, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(27, 42, 85, 0.75)',
  },
  backText: {
    color: '#fff',
    fontSize: 12,
  },
  overlayRight: {
    alignItems: 'flex-end',
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  overlayHint: {
    marginTop: 4,
    color: '#93a4c7',
    fontSize: 11,
  },
});
