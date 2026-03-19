import * as THREE from 'three';
import { OBSTACLE_DEFINITIONS } from '../data/ObstacleDefinitions.js';

export class ObstacleActor {
    constructor(definitionId, laneIndex, pathDistance, scene) {
        const def = OBSTACLE_DEFINITIONS.find(d => d.id === definitionId) || OBSTACLE_DEFINITIONS[0];
        this.definition = def;
        this.definitionId = definitionId;
        this.laneIndex = laneIndex;
        this.pathDistance = pathDistance;
        this.collected = false;

        const h = def.height || 1;
        this.group = new THREE.Group();
        const geo = new THREE.BoxGeometry(def.width || 1, h, def.depth || 1);
        const mat = new THREE.MeshStandardMaterial({ color: def.color ?? 0xe74c3c });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.y = h / 2;
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
