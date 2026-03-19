import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { GameView } from './GameView';

export default function App() {
  const [mode, setMode] = useState(null); // 'tap' | 'run' | null
  const gameKey = useMemo(() => (mode ? `mode:${mode}` : 'menu'), [mode]);

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
        </View>

        <Text style={styles.footer}>LAN: Expo Go ile bağlan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameView key={gameKey} style={styles.gameView} mode={mode} />
      <View style={styles.overlay}>
        <Pressable style={styles.backButton} onPress={() => setMode(null)}>
          <Text style={styles.backText}>← Menü</Text>
        </Pressable>
        <View style={styles.overlayRight} pointerEvents="none">
          <Text style={styles.overlayTitle}>{mode === 'tap' ? 'Tap Arena' : 'Swipe Runner'}</Text>
          <Text style={styles.overlayHint}>
            {mode === 'tap' ? 'Dokunarak hedefleri patlat' : 'Sağ/Sol swipe ile şerit değiştir'}
          </Text>
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
