export const WORLD_LAYOUT = {
    lights: {
        ambient: { color: 0xffffff, intensity: 0.7 },
        directional: {
            color: 0xffffff,
            intensity: 0.9,
            position: [10, 20, 10],
            shadowBounds: 60,
            far: 120
        }
    },
    props: [
        {
            prefabId: 'ground',
            position: [0, 0, 0],
            size: [100, 100],
            material: { color: 0x27ae60 }
        }
    ],
    hazards: [],
    extraction: {
        position: [0, 0, -600], // Move far away
        radius: 1.8
    },
    spawnPoints: []
};
