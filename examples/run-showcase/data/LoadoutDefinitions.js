export const LOADOUT_DEFINITIONS = [
    {
        id: 'vanguard',
        name: 'Vanguard Suit',
        description: 'Dengeli, tek oyunculu odakli baslangic.',
        modifiers: [
            { stat: 'maxHealth', op: 'add', value: 15, source: 'loadout:vanguard' },
            { stat: 'projectileDamage', op: 'add', value: 4, source: 'loadout:vanguard' }
        ]
    },
    {
        id: 'striker',
        name: 'Striker Frame',
        description: 'Hizli dash ve ates hizi odakli.',
        modifiers: [
            { stat: 'dashCooldownScale', op: 'mul', value: 0.8, source: 'loadout:striker' },
            { stat: 'fireRateScale', op: 'mul', value: 0.88, source: 'loadout:striker' }
        ]
    },
    {
        id: 'duo-protocol',
        name: 'Duo Protocol',
        description: 'Yerel coop prototipini aktif eder.',
        modifiers: [
            { stat: 'coopEnabled', op: 'add', value: 1, source: 'loadout:duo-protocol' }
        ]
    }
];

export function getLoadoutDefinition(id) {
    return LOADOUT_DEFINITIONS.find(loadout => loadout.id === id) || LOADOUT_DEFINITIONS[0];
}
