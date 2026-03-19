import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GameView } from './GameView';

export default function App() {
  return (
    <View style={styles.container}>
      <GameView style={styles.gameView} />
      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.text}>ZortEngine RN Demo</Text>
        <Text style={styles.hint}>Tap: rotate cube • Swipe: direction</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e14',
  },
  gameView: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  hint: {
    color: '#888',
    fontSize: 12,
  },
});
