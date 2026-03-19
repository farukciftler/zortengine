/**
 * Quest tipleri ve hedefler
 */
export const QUEST_OBJECTIVE = {
  KILL_ENEMIES: 'kill_enemies',
  COLLECT_GOLD: 'collect_gold',
  REACH_LEVEL: 'reach_level',
};

export const QUESTS = [
  {
    id: 'first_blood',
    title: 'İlk Kan',
    description: '3 düşmanı yok et.',
    objectives: [
      { type: QUEST_OBJECTIVE.KILL_ENEMIES, target: 3 },
    ],
  },
  {
    id: 'treasure_hunter',
    title: 'Hazine Avcısı',
    description: '50 altın topla.',
    objectives: [
      { type: QUEST_OBJECTIVE.COLLECT_GOLD, target: 50 },
    ],
  },
  {
    id: 'rising_star',
    title: 'Yükselen Yıldız',
    description: 'Seviye 3\'e ulaş.',
    objectives: [
      { type: QUEST_OBJECTIVE.REACH_LEVEL, target: 3 },
    ],
  },
];

export function createQuestProgress(quest) {
  return {
    questId: quest.id,
    current: quest.objectives.map(() => 0),
  };
}

export function updateQuestProgress(progress, quest, event) {
  const { type } = event;
  for (let i = 0; i < quest.objectives.length; i++) {
    const obj = quest.objectives[i];
    if (obj.type === QUEST_OBJECTIVE.KILL_ENEMIES && type === 'kill') {
      progress.current[i] = Math.min(progress.current[i] + (event.count ?? 1), obj.target);
    } else if (obj.type === QUEST_OBJECTIVE.COLLECT_GOLD && type === 'gold') {
      progress.current[i] = Math.min(progress.current[i] + (event.amount ?? 0), obj.target);
    } else if (obj.type === QUEST_OBJECTIVE.REACH_LEVEL && type === 'level') {
      progress.current[i] = event.level >= obj.target ? obj.target : progress.current[i];
    }
  }
}

export function isQuestComplete(progress, quest) {
  return quest.objectives.every((obj, i) => progress.current[i] >= obj.target);
}
