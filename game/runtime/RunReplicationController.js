import * as THREE from 'three';
import { WebSocketTransport } from 'zortengine/networking';

export class RunReplicationController {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = options || {};
        this.transport = null;
    }

    connect() {
        if (!this.options?.enabled || this.transport) return;

        this.transport = new WebSocketTransport({
            url: this.options.url
        });

        this.transport.on('open', () => {
            this.transport.send('hello', {
                roomId: this.options.roomId,
                playerId: this.options.playerId,
                playerName: this.options.playerId
            });
        });
        this.transport.on('message', message => this.handleMessage(message));
        this.transport.connect();
    }

    disconnect() {
        this.transport?.disconnect();
        this.transport = null;
    }

    handlePeerJoined(peer) {
        if (!peer?.playerId || this.scene.remotePlayers.has(peer.playerId)) return;
        this.scene.networkPeers.set(peer.playerId, peer);
    }

    handlePeerLeft(peer) {
        const actor = this.scene.remotePlayers.get(peer.playerId);
        if (actor) {
            this.scene.remove(actor);
            this.scene.players = this.scene.players.filter(item => item !== actor);
            this.scene.remotePlayers.delete(peer.playerId);
        }
        this.scene.networkPeers.delete(peer.playerId);
    }

    handleMessage(message) {
        if (message.type === 'peer_joined') {
            this.handlePeerJoined(message.payload);
            return;
        }

        if (message.type === 'peer_left') {
            this.handlePeerLeft(message.payload);
            return;
        }

        if (message.type === 'state') {
            this.applyRemoteState(message.payload);
        }
    }

    applyRemoteState(payload) {
        if (!payload?.playerId || payload.playerId === this.options.playerId) return;

        let actor = this.scene.remotePlayers.get(payload.playerId);
        if (!actor) {
            actor = this.scene._createPlayer({
                profile: `remote-${payload.playerId}`,
                colorSuit: 0x8b5cf6,
                spawn: new THREE.Vector3(payload.position?.x || 0, 5, payload.position?.z || 0),
                networkId: payload.playerId,
                isRemote: true
            }, this.scene.getSystem('physics'), this.scene.getSystem('input'), this.scene.getSystem('particles'), this.scene.getCamera());
            actor.removeComponent('movement');
            this.scene.remotePlayers.set(payload.playerId, actor);
        }

        if (payload.position) {
            actor.group.position.set(payload.position.x, payload.position.y, payload.position.z);
        }
        actor.group.rotation.y = payload.rotationY || 0;
        const health = actor.getComponent('health');
        if (health && payload.health !== undefined) {
            health.setHealth(payload.health);
        }
    }

    syncLocalState() {
        if (!this.transport || !this.scene.player || this.scene.runState.status !== 'active') return;
        const health = this.scene.player.getComponent('health');
        this.transport.send('state', {
            roomId: this.options.roomId,
            position: {
                x: this.scene.player.group.position.x,
                y: this.scene.player.group.position.y,
                z: this.scene.player.group.position.z
            },
            rotationY: this.scene.player.group.rotation.y,
            health: health?.health ?? 100
        });
    }
}
