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
        },
        {
            prefabId: 'ramp',
            position: [-8, 1, 5],
            size: [6, 1, 10],
            rotationZ: -Math.PI / 8,
            material: { color: 0xe67e22 }
        },
        {
            prefabId: 'physicsBox',
            position: [3, 20, -3],
            size: [2, 2, 2],
            mass: 18,
            material: { color: 0x3498db, emissive: 0x3498db, emissiveIntensity: 2.0 }
        }
    ],
    hazards: [
        {
            id: 'plasma-pool',
            position: [10, 0, -5],
            radius: 2.2,
            damagePerSecond: 12,
            color: 0x22d3ee
        }
    ],
    extraction: {
        position: [0, 0, -6],
        radius: 1.8
    },
    spawnPoints: [
        [8, 0, 8],
        [-10, 0, 6],
        [12, 0, -8],
        [-12, 0, -10]
    ]
};
