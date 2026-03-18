export class StatusEffectSystem {
    constructor(options = {}) {
        this.effectRegistry = options.effectRegistry || null;
        this.entries = new Map();
    }

    addStatus(owner, status) {
        if (!owner || !status?.id) return null;
        if (!this.entries.has(owner)) {
            this.entries.set(owner, []);
        }

        const entry = {
            id: status.id,
            duration: status.duration ?? 0,
            tickInterval: status.tickInterval ?? 0,
            elapsed: 0,
            tickElapsed: 0,
            effects: status.effects || [],
            source: status.source || null
        };
        this.entries.get(owner).push(entry);
        return entry;
    }

    getStatuses(owner) {
        return this.entries.get(owner) || [];
    }

    update(delta) {
        for (const [owner, statuses] of this.entries.entries()) {
            const remaining = [];
            for (const status of statuses) {
                status.elapsed += delta;
                status.tickElapsed += delta;

                if (status.tickInterval > 0 && status.tickElapsed >= status.tickInterval) {
                    status.tickElapsed = 0;
                    this.effectRegistry?.applyAll(status.effects, {
                        owner,
                        status
                    });
                }

                if (status.duration <= 0 || status.elapsed < status.duration) {
                    remaining.push(status);
                }
            }
            this.entries.set(owner, remaining);
        }
    }
}
