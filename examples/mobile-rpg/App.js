import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { GameView } from './GameView';
import { HubScene } from './HubScene';
import { RpgWorldScene } from './RpgWorldScene';
import { DungeonScene } from './DungeonScene';
import { VirtualJoystick } from 'zortengine/src/adapters/react-native/index.js';
import { getGameAPI } from './gameBridge.js';

function createScenes(engine) {
  const hub = new HubScene();
  const world = new RpgWorldScene();
  const dungeon = new DungeonScene();
  engine.addScene('hub', hub);
  engine.addScene('rpg-world', world);
  engine.addScene('dungeon', dungeon);
  return 'hub';
}

export default function App() {
  const handleAttack = useCallback(() => getGameAPI()?.triggerAttack?.(), []);

  const [stats, setStats] = useState(null);
  const [quest, setQuest] = useState(null);
  useEffect(() => {
    const id = setInterval(() => {
      const api = getGameAPI();
      const s = api?.getStats?.();
      if (s) setStats(s);
      const q = api?.getQuest?.();
      setQuest(q);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <GameView style={styles.game} createScenes={createScenes} pointerEvents="none" />
      {stats && (
        <View style={styles.stats} pointerEvents="none">
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Lv.{stats.level}</Text>
            <View style={styles.hpBarBg}>
              <View style={[styles.hpBarFill, { width: `${(stats.hp / stats.maxHp) * 100}%` }]} />
            </View>
          </View>
          <Text style={styles.xpText}>XP {stats.xp}/{stats.xpForNext}  •  {stats.gold ?? 0} altın</Text>
        </View>
      )}
      {quest && (
        <View style={styles.quest} pointerEvents="none">
          <Text style={styles.questTitle}>📜 {quest.title}</Text>
          <Text style={styles.questDesc}>{quest.description}</Text>
          {quest.objectives?.map((obj, i) => (
            <Text key={i} style={styles.questObj}>
              • {obj.current}/{obj.target}
              {obj.type === 'kill_enemies' && ' düşman'}
              {obj.type === 'collect_gold' && ' altın'}
              {obj.type === 'reach_level' && ' seviye'}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.hud} pointerEvents="box-none">
        <View style={styles.left} pointerEvents="auto" collapsable={false}>
          <VirtualJoystick
            region="left"
            onDirectionChange={(x, z) => getGameAPI()?.setJoystickDir?.(x, z)}
            onReleaseOutside={() => getGameAPI()?.triggerAttack?.()}
          />
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
  stats: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 50,
    pointerEvents: 'none',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 36,
    marginRight: 8,
  },
  hpBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: '#e74c3c',
    borderRadius: 6,
  },
  xpText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 4,
  },
  quest: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  questTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  questDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginBottom: 6,
  },
  questObj: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    marginLeft: 4,
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
