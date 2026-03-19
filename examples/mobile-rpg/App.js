import React, { useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { GameView } from './GameView';
import { RpgWorldScene } from './RpgWorldScene';
import { Joystick } from './Joystick';
import { getGameAPI } from './gameBridge.js';

function createScene(engine) {
  return new RpgWorldScene();
}

export default function App() {
  const handleAttack = useCallback(() => getGameAPI()?.triggerAttack?.(), []);

  return (
    <View style={styles.container}>
      <GameView style={styles.game} createScene={createScene} pointerEvents="none" />
      <View style={styles.hud} pointerEvents="box-none">
        <View style={styles.left} pointerEvents="auto" collapsable={false}>
          <Joystick />
        </View>
        <View style={styles.rightOverlay} pointerEvents="auto">
          <TouchableOpacity style={styles.attackBtn} onPressIn={handleAttack} activeOpacity={0.8}>
            <View style={styles.attackInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060910',
  },
  game: {
    flex: 1,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    width: '50%',
    height: '100%',
  },
  rightOverlay: {
    position: 'absolute',
    left: '50%',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
    backgroundColor: 'transparent',
  },
  attackBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 59, 106, 0.8)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attackInner: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
