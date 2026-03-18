export function registerRunEffects(effectRegistry) {
    effectRegistry.register('modifier', (effect, context) => {
        const runState = context.runState;
        if (!runState || !effect.stat) return;

        if (effect.op === 'mul') {
            runState.modifiers[effect.stat] = (runState.modifiers[effect.stat] ?? 1) * effect.value;
        } else {
            runState.modifiers[effect.stat] = (runState.modifiers[effect.stat] ?? 0) + effect.value;
        }
    });

    effectRegistry.register('statusOnHit', (effect, context) => {
        const runState = context.runState;
        if (!runState) return;
        runState.modifiers.statusOnHit = {
            statusId: effect.statusId,
            chance: effect.chance ?? 1
        };
    });

    effectRegistry.register('damageTarget', (effect, context) => {
        context.damageSystem?.applyDamage?.(context.owner, effect.amount ?? 0, {
            type: effect.damageType || 'status',
            source: effect.source || 'effect'
        });
    });
}
