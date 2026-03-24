export const WORLD_LAYOUT = {
    lights: {
        ambient: { color: 0xffffff, intensity: 0.7 },
        directional: {
            color: 0xffffff,
            intensity: 0.9,
            position: [10, 20, 10],
            shadowBounds: 100,
            far: 160
        }
    },
    props: [
        {
            prefabId: 'ground',
            position: [-20, 0, 10],
            size: [80, 160],
            material: { color: 0x555555 }
        }
    ],
    hazards: [],
    extraction: {
        position: [0, 0, -600], // Move far away
        radius: 1.8
    },
    spawnPoints: []
};
