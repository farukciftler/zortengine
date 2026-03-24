import * as THREE from 'three';
import { Component } from 'zortengine';
import { isNpcWalkBlockedByBuilding } from '../buildings/StreetLayout.js';

/**
 * Batı kaldırımda rastgele noktalara yürüyen basit NPC.
 * alongStreetOnly: cadde boyunca (Z) akış; x dar şeritte kalır — yola çıkmaz.
 */
export class SidewalkNpcController extends Component {
    constructor(options = {}) {
        super();
        this.physics = options.physics;
        this.body = options.body;
        this.bounds = options.bounds;
        this.rng = options.rng;
        this.moveSpeed = options.moveSpeed ?? 2.6;
        /** Cadde ile mağaza arası kaldırımda, caddenin yönünde yürüme */
        this.alongStreetOnly = options.alongStreetOnly ?? false;
        this.peerNpcs = null;
        this.target = new THREE.Vector3();
        this.pauseTimer = 0;
        this._pickTarget();
    }

    _float(a, b) {
        const r = this.rng;
        if (r && typeof r.float === 'function') return r.float(a, b);
        return a + Math.random() * (b - a);
    }

    _pickTarget() {
        const { xMin, xMax, zMin, zMax } = this.bounds;
        const maxTry = 48;
        if (this.alongStreetOnly) {
            /** Caddeye yakın şerit (−21…−12); merkez −26 bina gövdeleriyle çakışıyordu */
            const roadSideX0 = Math.max(xMin, -21);
            const roadSideX1 = Math.min(xMax, -12);
            const spread = Math.min(2.8, (roadSideX1 - roadSideX0) * 0.45);
            const cx = (roadSideX0 + roadSideX1) / 2;
            for (let t = 0; t < maxTry; t++) {
                const tx = this._float(cx - spread, cx + spread);
                const tz = this._float(zMin, zMax);
                if (!isNpcWalkBlockedByBuilding(tx, tz)) {
                    this.target.set(tx, 0, tz);
                    return;
                }
            }
            this.target.set(cx, 0, this._float(zMin, zMax));
            return;
        }
        for (let t = 0; t < maxTry; t++) {
            const tx = this._float(xMin, xMax);
            const tz = this._float(zMin, zMax);
            if (!isNpcWalkBlockedByBuilding(tx, tz)) {
                this.target.set(tx, 0, tz);
                return;
            }
        }
        const rx0 = Math.max(xMin, -21);
        const rx1 = Math.min(xMax, -12);
        for (let t = 0; t < maxTry; t++) {
            const tx = this._float(rx0, rx1);
            const tz = this._float(zMin, zMax);
            if (!isNpcWalkBlockedByBuilding(tx, tz)) {
                this.target.set(tx, 0, tz);
                return;
            }
        }
        this.target.set((rx0 + rx1) / 2, 0, (zMin + zMax) / 2);
    }

    update(delta = 1 / 60) {
        const owner = this.owner;
        if (!owner || !this.body) return;

        if (this.pauseTimer > 0) {
            this.pauseTimer -= delta;
            this.body.velocity.x *= 0.88;
            this.body.velocity.z *= 0.88;
            if (owner.fsm) owner.fsm.setState('idle');
            if (this.pauseTimer <= 0) {
                this._pickTarget();
            }
            return;
        }

        const pos = owner.group.position;
        if (this.body && isNpcWalkBlockedByBuilding(this.body.position.x, this.body.position.z)) {
            this.body.position.x += 2.4 * delta;
            this.body.velocity.multiplyScalar(0.5);
            this._pickTarget();
        }

        const to = new THREE.Vector3().subVectors(this.target, pos);
        to.y = 0;
        const dist = to.length();

        if (dist < 0.55) {
            this.pauseTimer = this._float(0.4, 1.5);
            this.body.velocity.x = 0;
            this.body.velocity.z = 0;
            if (owner.fsm) owner.fsm.setState('idle');
            return;
        }

        to.normalize();
        let vx = to.x * this.moveSpeed;
        let vz = to.z * this.moveSpeed;

        const peers = this.peerNpcs;
        if (peers?.length) {
            const px = this.body.position.x;
            const pz = this.body.position.z;
            let sx = 0;
            let sz = 0;
            for (const other of peers) {
                if (!other?.body || other === owner) continue;
                const ox = other.body.position.x;
                const oz = other.body.position.z;
                const dx = px - ox;
                const dz = pz - oz;
                const d2 = dx * dx + dz * dz;
                if (d2 < 1e-5 || d2 > 16) continue;
                const dist = Math.sqrt(d2);
                const sep = 1.2;
                if (dist > sep) continue;
                const push = (1 - dist / sep) * 5.5;
                sx += (dx / dist) * push;
                sz += (dz / dist) * push;
            }
            vx += sx * delta;
            vz += sz * delta;
        }

        this.body.velocity.x = vx;
        this.body.velocity.z = vz;
        owner.group.rotation.y = Math.atan2(vx, vz);
        if (owner.fsm) owner.fsm.setState('walk');
    }
}
