export const ROOM_GRAPH = [
    {
        id: 'landing-bay',
        label: 'Landing Bay',
        encounterId: 'opening',
        rewards: ['essence'],
        next: ['forge-nexus', 'signal-pit']
    },
    {
        id: 'forge-nexus',
        label: 'Forge Nexus',
        encounterId: 'elite-forge',
        rewards: ['relicChoice'],
        next: ['relay-core']
    },
    {
        id: 'signal-pit',
        label: 'Signal Pit',
        encounterId: 'support-pit',
        rewards: ['essence', 'loadoutChoice'],
        next: ['relay-core']
    },
    {
        id: 'relay-core',
        label: 'Relay Core',
        encounterId: 'boss-core',
        rewards: ['extraction'],
        next: []
    }
];

export const ENCOUNTER_DEFINITIONS = {
    opening: {
        id: 'opening',
        objective: 'Temizlik',
        waves: [
            { count: 2, spawnInterval: 0.45, archetypeId: 'scrapper' },
            { count: 2, spawnInterval: 0.4, archetypeId: 'artillery' }
        ]
    },
    elite-forge: {
        id: 'elite-forge',
        objective: 'Elite avla',
        waves: [
            { count: 2, spawnInterval: 0.35, archetypeId: 'scrapper' },
            { count: 1, spawnInterval: 0.6, archetypeId: 'eliteWarden' }
        ]
    },
    support-pit: {
        id: 'support-pit',
        objective: 'Support duzeni boz',
        waves: [
            { count: 2, spawnInterval: 0.35, archetypeId: 'artillery' },
            { count: 2, spawnInterval: 0.45, archetypeId: 'siphon' }
        ]
    },
    boss-core: {
        id: 'boss-core',
        objective: 'Boss yok et',
        waves: [
            { count: 2, spawnInterval: 0.3, archetypeId: 'scrapper' },
            { count: 1, spawnInterval: 0.8, archetypeId: 'bossOverseer' }
        ]
    }
};

export function getEncounterDefinition(id) {
    return ENCOUNTER_DEFINITIONS[id] || ENCOUNTER_DEFINITIONS.opening;
}

export function getRoomDefinition(id) {
    return ROOM_GRAPH.find(room => room.id === id) || ROOM_GRAPH[0];
}
