export class RunState {
    constructor(options = {}) {
        this.seed = options.seed || 'run-seed';
        this.loadoutId = options.loadoutId || 'vanguard';
        this.elapsedTime = 0;
        this.essence = 0;
        this.relics = [];
        this.roomsVisited = [];
        this.currentRoomId = null;
        this.status = 'active';
        this.extractionUnlocked = false;
        this.modifiers = {
            projectileDamage: 25,
            jumpVelocity: 9.5,
            dashCooldownScale: 1,
            fireRateScale: 1,
            maxHealth: 100,
            chainChance: 0,
            dashShield: 0
        };
        this.offeredChoices = [];
        this.summary = null;
    }

    addEssence(amount = 1) {
        this.essence += amount;
        return this.essence;
    }

    addRelic(relic, effectRegistry = null, context = {}) {
        if (!relic) return null;
        this.relics.push(relic.id);
        if (effectRegistry) {
            effectRegistry.applyAll(relic.effects || [], {
                runState: this,
                ...context,
                relic
            });
        }
        return relic;
    }

    getRelicCount() {
        return this.relics.length;
    }

    unlockExtraction() {
        this.extractionUnlocked = true;
    }

    visitRoom(roomId) {
        this.currentRoomId = roomId;
        if (roomId && !this.roomsVisited.includes(roomId)) {
            this.roomsVisited.push(roomId);
        }
    }

    setChoices(choices = []) {
        this.offeredChoices = choices;
    }

    update(delta) {
        if (this.status === 'active') {
            this.elapsedTime += delta;
        }
    }

    complete() {
        this.status = 'completed';
        this.summary = this.getSummary();
    }

    fail() {
        this.status = 'failed';
        this.summary = this.getSummary();
    }

    getSummary() {
        return {
            seed: this.seed,
            loadoutId: this.loadoutId,
            essence: this.essence,
            relicCount: this.getRelicCount(),
            roomsVisited: this.roomsVisited.slice(),
            elapsedTime: this.elapsedTime,
            status: this.status
        };
    }

    serialize() {
        return {
            seed: this.seed,
            loadoutId: this.loadoutId,
            elapsedTime: this.elapsedTime,
            essence: this.essence,
            relics: this.relics.slice(),
            roomsVisited: this.roomsVisited.slice(),
            currentRoomId: this.currentRoomId,
            status: this.status,
            extractionUnlocked: this.extractionUnlocked,
            modifiers: { ...this.modifiers }
        };
    }
}
