import * as THREE from 'three';
import { COLLECTIBLE_DEFINITIONS } from '../data/CollectibleDefinitions.js';

export class ZigzagCollectibleActor {
    constructor(definitionId, laneIndex, pathDistance, scene) {
        const def = COLLECTIBLE_DEFINITIONS.find(d => d.id === definitionId) || COLLECTIBLE_DEFINITIONS[0];
        this.definitionId = definitionId;
        this.laneIndex = laneIndex;
        this.pathDistance = pathDistance;
        this.score = def.score ?? 10;
        this.collected = false;

        this.group = new THREE.Group();

        const geo = new THREE.SphereGeometry(0.4, 12, 12);
        const mat = new THREE.MeshStandardMaterial({ color: def.color ?? 0xf1c40f });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.y = 0.4;
        this.group.add(this.mesh);
    }

    update(delta, time) {}

    get position() {
        return this.group.position;
    }

    serialize() {
        return {
            type: 'ZigzagCollectibleActor',
            definitionId: this.definitionId,
            laneIndex: this.laneIndex,
            position: {
                x: this.group.position.x,
                y: this.group.position.y,
                z: this.group.position.z
            }
        };
    }
}
