import * as THREE from 'three';

/**
 * InteractionSystem — Manages proximity-based triggers and world-space interactions.
 */
export class InteractionSystem {
    constructor() {
        this.context = null;
        this.interactions = [];
        this.activeInteraction = null;
        this._playerRef = null;
    }

    onAttach(context) {
        this.context = context;
    }

    /**
     * Set the player object to check distance against.
     */
    setPlayer(player) {
        this._playerRef = player;
    }

    /**
     * Register a new interactive point in the world.
     */
    addInteraction(id, position, radius, callbacks = {}) {
        const interaction = {
            id,
            pos: position instanceof THREE.Vector3 ? position : new THREE.Vector3(...position),
            radius,
            onEnter: callbacks.onEnter,
            onLeave: callbacks.onLeave,
            data: callbacks.data || {}
        };
        this.interactions.push(interaction);
        return interaction;
    }

    removeInteraction(id) {
        this.interactions = this.interactions.filter(i => i.id !== id);
    }

    update(delta) {
        const player = this._playerRef || this.context?.scene?.player;
        if (!player) return;

        const pPos = player.position || player.group?.position;
        if (!pPos) return;

        let closestInteraction = null;
        let minDist = Infinity;

        // Find the closest interaction within radius
        for (const inter of this.interactions) {
            const dist = pPos.distanceTo(inter.pos);
            if (dist < inter.radius) {
                if (dist < minDist) {
                    minDist = dist;
                    closestInteraction = inter;
                }
            }
        }

        // Handle enter/leave transitions
        if (closestInteraction && this.activeInteraction !== closestInteraction) {
            if (this.activeInteraction?.onLeave) {
                this.activeInteraction.onLeave(this.activeInteraction);
            }
            this.activeInteraction = closestInteraction;
            if (this.activeInteraction.onEnter) {
                this.activeInteraction.onEnter(this.activeInteraction);
            }
        } else if (!closestInteraction && this.activeInteraction) {
            if (this.activeInteraction.onLeave) {
                this.activeInteraction.onLeave(this.activeInteraction);
            }
            this.activeInteraction = null;
        }
    }
}
