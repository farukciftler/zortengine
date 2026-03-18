export const ENEMY_ARCHETYPES = {
    scrapper: {
        id: 'scrapper',
        name: 'Scrapper',
        color: 0x8e44ad,
        maxHp: 60,
        speed: 3.8,
        attackRange: 1.8,
        chaseRange: 16,
        attackDamage: 20,
        attackStyle: 'melee',
        pickupEssence: 1
    },
    artillery: {
        id: 'artillery',
        name: 'Artillery Drone',
        color: 0x2563eb,
        maxHp: 70,
        speed: 2.8,
        attackRange: 7.5,
        chaseRange: 18,
        attackDamage: 14,
        attackStyle: 'ranged',
        pickupEssence: 1
    },
    siphon: {
        id: 'siphon',
        name: 'Siphon Priest',
        color: 0x14b8a6,
        maxHp: 85,
        speed: 2.9,
        attackRange: 4.5,
        chaseRange: 17,
        attackDamage: 8,
        attackStyle: 'support',
        supportHeal: 4,
        pickupEssence: 2
    },
    eliteWarden: {
        id: 'eliteWarden',
        name: 'Elite Warden',
        color: 0xf97316,
        maxHp: 140,
        speed: 3.4,
        attackRange: 2.4,
        chaseRange: 20,
        attackDamage: 28,
        attackStyle: 'melee',
        elite: true,
        pickupEssence: 3
    },
    bossOverseer: {
        id: 'bossOverseer',
        name: 'Overseer Prime',
        color: 0xef4444,
        maxHp: 260,
        speed: 2.8,
        attackRange: 8.5,
        chaseRange: 24,
        attackDamage: 34,
        attackStyle: 'ranged',
        elite: true,
        boss: true,
        pickupEssence: 6
    }
};

export function getEnemyArchetype(id) {
    return ENEMY_ARCHETYPES[id] || ENEMY_ARCHETYPES.scrapper;
}
