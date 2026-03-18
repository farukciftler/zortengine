export const RELIC_DEFINITIONS = [
    {
        id: 'kinetic-core',
        name: 'Kinetic Core',
        description: 'Mermi hasarini artirir.',
        apply: runState => {
            runState.modifiers.projectileDamageBonus += 12;
        }
    },
    {
        id: 'spring-lattice',
        name: 'Spring Lattice',
        description: 'Ziplamayi guclendirir.',
        apply: runState => {
            runState.modifiers.jumpBonus += 1.5;
        }
    },
    {
        id: 'phase-capacitor',
        name: 'Phase Capacitor',
        description: 'Dash cooldownunu azaltir.',
        apply: runState => {
            runState.modifiers.dashCooldownScale *= 0.8;
        }
    },
    {
        id: 'trigger-prism',
        name: 'Trigger Prism',
        description: 'Ates hizini artirir.',
        apply: runState => {
            runState.modifiers.fireRateScale *= 0.85;
        }
    }
];

export function getRandomRelic(excludedIds = []) {
    const available = RELIC_DEFINITIONS.filter(relic => !excludedIds.includes(relic.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}
