import * as THREE from 'three';

export class PathGenerator {
    constructor(seedOrRng = 'zigzag') {
        this.segments = [];
        this.totalLength = 0;
        this.rng = typeof seedOrRng === 'object' && seedOrRng?.float
            ? seedOrRng
            : null;
        this.seed = typeof seedOrRng === 'string' ? seedOrRng : 'zigzag';
        this._buildSegments();
    }

    _hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i) | 0;
        }
        return Math.abs(h);
    }

    _random(i) {
        if (this.rng) return this.rng.float(0, 1);
        const hash = this._hash(this.seed);
        const x = Math.sin(hash + i * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    _buildSegments() {
        let x = 0, z = 0, rot = 0;
        const segmentLength = 25;
        const maxCurve = 0.02;

        for (let i = 0; i < 300; i++) {
            const r = this._random(i);
            const curve = (r - 0.5) * 2 * maxCurve;
            this.segments.push({
                startX: x,
                startZ: z,
                startRot: rot,
                length: segmentLength,
                curve
            });
            const steps = 5;
            for (let s = 0; s < steps; s++) {
                const step = segmentLength / steps;
                x += Math.sin(rot) * step;
                z -= Math.cos(rot) * step;
                rot += curve * step;
            }
            this.totalLength += segmentLength;
        }
    }

    getInfoAtDistance(distance) {
        if (distance <= 0) {
            return {
                position: new THREE.Vector3(0, 0, 0),
                rotation: 0,
                tangent: new THREE.Vector3(0, 0, -1),
                curvature: 0
            };
        }
        let d = 0;
        for (const seg of this.segments) {
            if (d + seg.length >= distance) {
                const t = (distance - d) / seg.length;
                const steps = 10;
                let x = seg.startX, z = seg.startZ, rot = seg.startRot;
                const stepLen = seg.length * t / steps;
                for (let s = 0; s < steps; s++) {
                    x += Math.sin(rot) * stepLen;
                    z -= Math.cos(rot) * stepLen;
                    rot += seg.curve * stepLen;
                }
                return {
                    position: new THREE.Vector3(x, 0, z),
                    rotation: rot,
                    tangent: new THREE.Vector3(Math.sin(rot), 0, -Math.cos(rot)),
                    curvature: seg.curve
                };
            }
            d += seg.length;
        }
        const last = this.segments[this.segments.length - 1];
        let x = last.startX, z = last.startZ, rot = last.startRot;
        const steps = 10;
        for (let s = 0; s < steps; s++) {
            const step = last.length / steps;
            x += Math.sin(rot) * step;
            z -= Math.cos(rot) * step;
            rot += last.curve * step;
        }
        return {
            position: new THREE.Vector3(x, 0, z),
            rotation: rot,
            tangent: new THREE.Vector3(Math.sin(rot), 0, -Math.cos(rot)),
            curvature: last.curve
        };
    }

    getPositionAtDistance(distance, laneOffset = 0) {
        const info = this.getInfoAtDistance(distance);
        const perp = new THREE.Vector3(-info.tangent.z, 0, info.tangent.x);
        const pos = info.position.clone().add(perp.multiplyScalar(laneOffset));
        return pos;
    }

    getPathPoints(fromDist, toDist, step = 5) {
        const points = [];
        for (let d = fromDist; d <= toDist; d += step) {
            points.push(this.getInfoAtDistance(d).position.clone());
        }
        return points;
    }
}
