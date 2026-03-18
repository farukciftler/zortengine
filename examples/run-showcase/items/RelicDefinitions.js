export const RELIC_DEFINITIONS = [
    {
        id: 'kinetic-core',
        name: 'Kinetic Core',
        description: 'Mermi hasarini artirir.',
        effects: [
            { type: 'modifier', stat: 'projectileDamage', op: 'add', value: 12 }
        ]
    },
    {
        id: 'spring-lattice',
        name: 'Spring Lattice',
        description: 'Ziplamayi guclendirir.',
        effects: [
            { type: 'modifier', stat: 'jumpVelocity', op: 'add', value: 1.5 }
        ]
    },
    {
        id: 'phase-capacitor',
        name: 'Phase Capacitor',
        description: 'Dash cooldownunu azaltir.',
        effects: [
            { type: 'modifier', stat: 'dashCooldownScale', op: 'mul', value: 0.8 }
        ]
    },
    {
        id: 'trigger-prism',
        name: 'Trigger Prism',
        description: 'Ates hizini artirir.',
        effects: [
            { type: 'modifier', stat: 'fireRateScale', op: 'mul', value: 0.85 }
        ]
    },
    {
        id: 'chain-reactor',
        name: 'Chain Reactor',
        description: 'Mermi isabetlerinde zincir patlama sansi verir.',
        effects: [
            { type: 'modifier', stat: 'chainChance', op: 'add', value: 0.25 }
        ]
    },
    {
        id: 'aegis-bloom',
        name: 'Aegis Bloom',
        description: 'Dash sonrasi kisa sureli kalkan kazandirir.',
        effects: [
            { type: 'modifier', stat: 'dashShield', op: 'add', value: 12 }
        ]
    },
    {
        id: 'venom-loop',
        name: 'Venom Loop',
        description: 'Isabetler zehir uygular.',
        effects: [
            { type: 'statusOnHit', statusId: 'poison-burst', chance: 1.0 }
        ]
    }
];

export function getRandomRelic(excludedIds = [], rng = null) {
    const available = RELIC_DEFINITIONS.filter(relic => !excludedIds.includes(relic.id));
    if (available.length === 0) return null;
    if (rng?.pick) {
        return rng.pick(available);
    }
    return available[Math.floor(Math.random() * available.length)];
}
