import * as THREE from 'three';
import { OBSTACLE_DEFINITIONS } from '../data/ObstacleDefinitions.js';

export class ObstacleActor {
    constructor(definitionId, laneIndex, z, lanePositions) {
        const def = OBSTACLE_DEFINITIONS.find(d => d.id === definitionId) || OBSTACLE_DEFINITIONS[0];
        this.definitionId = definitionId;
        this.laneIndex = laneIndex;
        this.z = z;
        this.collected = false;

        this.group = new THREE.Group();
        this.group.position.set(
            lanePositions[laneIndex] ?? 0,
            (def.height || 1) / 2,
            z
        );

        const geo = new THREE.BoxGeometry(def.width || 1, def.height || 1, def.depth || 1);
        const mat = new THREE.MeshStandardMaterial({ color: def.color ?? 0xe74c3c });
        this.mesh = new THREE.Mesh(geo, mat);
        this.group.add(this.mesh);
    }

    update(delta, time) {}

    get position() {
        return this.group.position;
    }

    serialize() {
        return {
            type: 'ObstacleActor',
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
