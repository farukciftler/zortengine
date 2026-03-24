import * as THREE from 'three';
import { Component } from 'zortengine';
import { isNpcWalkBlockedByBuilding, NPC_PATROL_PATHS } from '../buildings/StreetLayout.js';

/**
 * NPCs patroling back and forth along safe lanes.
 */
export class SidewalkNpcController extends Component {
    constructor(options = {}) {
        super();
        this.physics = options.physics;
        this.body = options.body;
        this.bounds = options.bounds; // { xMin, xMax, zMin, zMax }
        this.rng = options.rng;
        this.moveSpeed = options.moveSpeed ?? (2.4 + Math.random() * 0.8);
        this.peerNpcs = null;
        
        this.target = new THREE.Vector3();
        this.stuckTimer = 0;
        this.lastPos = new THREE.Vector3();
        
        // Pick a patrol lane
        this.patrolPath = this.rng.pick(NPC_PATROL_PATHS);
        this.laneOffset = (Math.random() - 0.5) * 0.8; // subtle variety
        this.direction = Math.random() > 0.5 ? 1 : -1;
        
        this._pickNextWayPoint();
    }

    _pickNextWayPoint() {
        // Walk to the far ends of the Z bounds
        const zTarget = this.direction > 0 ? this.bounds.zMax : this.bounds.zMin;
        this.target.set(this.patrolPath.x + this.laneOffset, 0, zTarget);
    }

    update(delta = 1 / 60) {
        const owner = this.owner;
        if (!owner || !this.body) return;

        const pos = owner.group.position;

        // 1. Stuck / Proximity Check
        const moveDist = pos.distanceTo(this.lastPos);
        this.lastPos.copy(pos);

        if (moveDist < 0.015) {
            this.stuckTimer += delta;
            if (this.stuckTimer > 1.5) {
                // Change direction if truly stuck
                this.direction *= -1;
                this._pickNextWayPoint();
                this.stuckTimer = 0;
                // small jitter to break physics lock
                this.body.position.x += (Math.random() - 0.5) * 0.2;
            }
        } else {
            this.stuckTimer = 0;
        }

        // 2. Waypoint reached?
        const distToTarget = Math.abs(pos.z - this.target.z);
        if (distToTarget < 1.0) {
            this.direction *= -1;
            this._pickNextWayPoint();
            return;
        }

        // 3. Simple Guidance
        const toTarget = new THREE.Vector3().subVectors(this.target, pos);
        toTarget.y = 0;
        toTarget.normalize();

        let vx = toTarget.x * this.moveSpeed * 0.5; // less aggression on X correction
        let vz = toTarget.z * this.moveSpeed;

        // 4. Peer Avoidance (Side-stepping only)
        const peers = this.peerNpcs;
        if (peers?.length) {
            for (const other of peers) {
                if (!other?.body || other === owner) continue;
                const dz = pos.z - other.body.position.z;
                // Only care if we are horizontally close AND vertically very close
                if (Math.abs(dz) < 2.5) {
                    const dx = pos.x - other.body.position.x;
                    const adx = Math.abs(dx);
                    if (adx < 1.25) {
                        // Push away sideways (X)
                        const push = (1.25 - adx) * (dx > 0 ? 4.0 : -4.0);
                        vx += push * delta * 10;
                    }
                }
            }
        }

        // 5. Apply Velocity
        this.body.velocity.x = vx;
        this.body.velocity.z = vz;
        
        if (Math.abs(vz) > 0.1 || Math.abs(vx) > 0.1) {
            owner.group.rotation.y = Math.atan2(vx, vz);
        }
        
        if (owner.fsm) owner.fsm.setState('walk');
    }
}
