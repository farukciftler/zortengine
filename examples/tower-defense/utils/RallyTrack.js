import * as THREE from 'three';

/**
 * Premium decorative rally track around the game map.
 * Varied car types, realistic cornering physics, road details.
 */

// ─── Car Body Builders ───────────────────────────────────────

function buildSportsCar(color) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.15 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.9, roughness: 0.1 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.55, metalness: 1, roughness: 0 });

    // Low wide body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 1.4), mat);
    body.position.y = 0.15;
    g.add(body);
    // Sloped front
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.4), mat);
    nose.position.set(0, 0.12, 0.75);
    nose.rotation.x = -0.15;
    g.add(nose);
    // Low cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.55), dark);
    cabin.position.set(0, 0.3, -0.05);
    g.add(cabin);
    // Windshield
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.02), glassMat);
    ws.position.set(0, 0.32, 0.2);
    ws.rotation.x = -0.35;
    g.add(ws);
    // Rear spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.12), mat);
    spoiler.position.set(0, 0.35, -0.65);
    g.add(spoiler);
    const spoilerLegs = new THREE.BoxGeometry(0.04, 0.1, 0.04);
    for (let s = -1; s <= 1; s += 2) {
        const leg = new THREE.Mesh(spoilerLegs, dark);
        leg.position.set(s * 0.25, 0.3, -0.65);
        g.add(leg);
    }
    addWheels(g, 0.09, 0.06, [[0.33,0.08,0.45],[-0.33,0.08,0.45],[0.33,0.08,-0.5],[-0.33,0.08,-0.5]]);
    addLights(g, 0.04, 0.15, 0.9, 0.15, -0.7);
    return g;
}

function buildSUV(color) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.5, metalness: 1, roughness: 0 });

    // Tall boxy body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 1.5), mat);
    body.position.y = 0.28;
    g.add(body);
    // Cabin box
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.3, 0.8), dark);
    cabin.position.set(0, 0.52, -0.1);
    g.add(cabin);
    // Windshield
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.25, 0.02), glassMat);
    ws.position.set(0, 0.55, 0.3);
    ws.rotation.x = -0.2;
    g.add(ws);
    // Roof rack
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.7), dark);
    rack.position.set(0, 0.68, -0.1);
    g.add(rack);
    // Bull bar
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), dark);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.2, 0.78);
    g.add(bar);
    addWheels(g, 0.12, 0.08, [[0.38,0.12,0.5],[-0.38,0.12,0.5],[0.38,0.12,-0.55],[-0.38,0.12,-0.55]]);
    addLights(g, 0.05, 0.18, 0.78, 0.22, -0.76);
    return g;
}

function buildPickupTruck(color) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.35 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2d3436, metalness: 0.7, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.5, metalness: 1, roughness: 0 });

    // Front cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), mat);
    cab.position.set(0, 0.28, 0.35);
    g.add(cab);
    // Cabin top
    const cabTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.5), dark);
    cabTop.position.set(0, 0.52, 0.3);
    g.add(cabTop);
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.02), glassMat);
    ws.position.set(0, 0.52, 0.56);
    ws.rotation.x = -0.2;
    g.add(ws);
    // Open bed
    const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.8), mat);
    bedFloor.position.set(0, 0.15, -0.35);
    g.add(bedFloor);
    // Bed sides
    for (let s = -1; s <= 1; s += 2) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.8), mat);
        side.position.set(s * 0.35, 0.25, -0.35);
        g.add(side);
    }
    const tailgate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.04), mat);
    tailgate.position.set(0, 0.25, -0.75);
    g.add(tailgate);
    addWheels(g, 0.12, 0.08, [[0.36,0.12,0.5],[-0.36,0.12,0.5],[0.36,0.12,-0.55],[-0.36,0.12,-0.55]]);
    addLights(g, 0.05, 0.16, 0.72, 0.2, -0.77);
    return g;
}

function buildRallyCar(color) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.75, roughness: 0.2 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.5, metalness: 1, roughness: 0 });

    // Rounded body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 1.3), mat);
    body.position.y = 0.2;
    g.add(body);
    // Racing stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.01, 1.3), accentMat);
    stripe.position.set(0, 0.32, 0);
    g.add(stripe);
    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.5), dark);
    cabin.position.set(0, 0.36, -0.05);
    g.add(cabin);
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.02), glassMat);
    ws.position.set(0, 0.38, 0.2);
    ws.rotation.x = -0.3;
    g.add(ws);
    // Rally number plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.01), accentMat);
    plate.position.set(0.2, 0.28, 0.66);
    g.add(plate);
    // Mud flaps
    for (let s = -1; s <= 1; s += 2) {
        const flap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.15), dark);
        flap.position.set(s * 0.34, 0.1, -0.55);
        g.add(flap);
    }
    addWheels(g, 0.1, 0.07, [[0.32,0.1,0.42],[-0.32,0.1,0.42],[0.32,0.1,-0.48],[-0.32,0.1,-0.48]]);
    addLights(g, 0.04, 0.16, 0.68, 0.15, -0.66);
    return g;
}

function buildMiniVan(color) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.6, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.5, metalness: 1, roughness: 0 });

    // Tall rounded body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.4, 1.4), mat);
    body.position.set(0, 0.3, 0);
    g.add(body);
    // Windshield (big & steep)
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.02), glassMat);
    ws.position.set(0, 0.45, 0.68);
    ws.rotation.x = -0.15;
    g.add(ws);
    // Side windows
    for (let s = -1; s <= 1; s += 2) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.18, 0.35), glassMat);
        win.position.set(s * 0.33, 0.42, 0.1);
        g.add(win);
    }
    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 1.0), dark);
    roof.position.set(0, 0.52, -0.1);
    g.add(roof);
    addWheels(g, 0.1, 0.07, [[0.33,0.1,0.48],[-0.33,0.1,0.48],[0.33,0.1,-0.5],[-0.33,0.1,-0.5]]);
    addLights(g, 0.04, 0.14, 0.72, 0.18, -0.72);
    return g;
}

// ─── Shared Helpers ──────────────────────────────────────────

function addWheels(group, radius, width, positions) {
    const wheelGeo = new THREE.CylinderGeometry(radius, radius, width, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.1 });
    for (const [x, y, z] of positions) {
        const wg = new THREE.Group();
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wg.add(wheel);
        // Hub cap
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, width + 0.01, 6), hubMat);
        hub.rotation.z = Math.PI / 2;
        wg.add(hub);
        wg.position.set(x, y, z);
        wg.userData.isWheel = true;
        group.add(wg);
    }
}

function addLights(group, r, headX, headZ, tailX, tailZ) {
    // Headlights
    for (let s = -1; s <= 1; s += 2) {
        const hl = new THREE.Mesh(
            new THREE.SphereGeometry(r, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xffeaa7 })
        );
        hl.position.set(s * headX, 0.2, headZ);
        group.add(hl);
    }
    // Tail lights
    for (let s = -1; s <= 1; s += 2) {
        const tl = new THREE.Mesh(
            new THREE.SphereGeometry(r * 0.75, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        tl.position.set(s * tailX, 0.2, tailZ);
        group.add(tl);
    }
}

const CAR_BUILDERS = [buildSportsCar, buildSUV, buildPickupTruck, buildRallyCar, buildMiniVan];
const CAR_COLORS = [
    0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6,
    0xe84393, 0x00cec9, 0xfdcb6e, 0x6c5ce7, 0xff7675
];

// ─── Rally Track ─────────────────────────────────────────────

export class RallyTrack {
    constructor(threeScene, mapCols, mapRows, tileSize) {
        this.threeScene = threeScene;
        this.cars = [];
        this.trackCurve = null;
        this.trackLength = 0;

        this._buildTrack(mapCols, mapRows, tileSize);
        this._addBarriers();
        this._spawnCars(8);
    }

    _buildTrack(cols, rows, tileSize) {
        const hw = (cols / 2) * tileSize + 7;
        const hh = (rows / 2) * tileSize + 7;

        // Organic winding rally circuit with varied curvature
        const cp = [
            new THREE.Vector3(-hw + 2,  0, -hh - 4),
            new THREE.Vector3(-hw - 6,  0, -hh + 6),
            new THREE.Vector3(-hw - 10, 0, -3),
            new THREE.Vector3(-hw - 7,  0, 5),
            new THREE.Vector3(-hw - 11, 0, hh - 4),
            new THREE.Vector3(-hw - 3,  0, hh + 3),
            new THREE.Vector3(-4,       0, hh + 7),
            new THREE.Vector3(5,        0, hh + 10),
            new THREE.Vector3(hw - 2,   0, hh + 5),
            new THREE.Vector3(hw + 7,   0, hh - 5),
            new THREE.Vector3(hw + 11,  0, 4),
            new THREE.Vector3(hw + 8,   0, -3),
            new THREE.Vector3(hw + 6,   0, -hh + 3),
            new THREE.Vector3(hw + 1,   0, -hh - 3),
            new THREE.Vector3(6,        0, -hh - 8),
            new THREE.Vector3(-3,       0, -hh - 11),
            new THREE.Vector3(-hw + 5,  0, -hh - 7),
        ];

        this.trackCurve = new THREE.CatmullRomCurve3(cp, true, 'centripetal', 0.5);
        this.trackLength = this.trackCurve.getLength();

        const segCount = 400;
        const trackPoints = this.trackCurve.getPoints(segCount);
        const roadWidth = 3.0;

        // ── Road surface ──
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i < trackPoints.length; i++) {
            const p = trackPoints[i];
            const t = i / (trackPoints.length - 1);
            const tangent = this.trackCurve.getTangentAt(t).normalize();
            const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

            const lp = p.clone().add(right.clone().multiplyScalar(-roadWidth / 2));
            const rp = p.clone().add(right.clone().multiplyScalar(roadWidth / 2));

            positions.push(lp.x, 0.02, lp.z, rp.x, 0.02, rp.z);
            normals.push(0, 1, 0, 0, 1, 0);
            uvs.push(0, t * 40, 1, t * 40);

            if (i < trackPoints.length - 1) {
                const b = i * 2;
                indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
            }
        }

        const roadGeo = new THREE.BufferGeometry();
        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        roadGeo.setIndex(indices);

        const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({
            color: 0x2c2c2c, roughness: 0.92, metalness: 0.05
        }));
        road.receiveShadow = true;
        this.threeScene.add(road);

        // ── Edge curbs (red-white) ──
        for (let side = -1; side <= 1; side += 2) {
            const curbPositions = [];
            const curbNormals = [];
            const curbUvs = [];
            const curbIndices = [];
            const curbW = 0.3;
            const curbH = 0.12;

            for (let i = 0; i < trackPoints.length; i++) {
                const p = trackPoints[i];
                const t = i / (trackPoints.length - 1);
                const tangent = this.trackCurve.getTangentAt(t).normalize();
                const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
                const offset = roadWidth / 2 + curbW / 2;

                const inner = p.clone().add(right.clone().multiplyScalar(side * (roadWidth / 2)));
                const outer = p.clone().add(right.clone().multiplyScalar(side * offset));

                curbPositions.push(inner.x, curbH, inner.z, outer.x, curbH, outer.z);
                curbNormals.push(0, 1, 0, 0, 1, 0);
                curbUvs.push(0, t * 80, 1, t * 80);

                if (i < trackPoints.length - 1) {
                    const b = i * 2;
                    curbIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
                }
            }

            const curbGeo = new THREE.BufferGeometry();
            curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
            curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
            curbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
            curbGeo.setIndex(curbIndices);

            const curb = new THREE.Mesh(curbGeo, new THREE.MeshStandardMaterial({
                color: side === -1 ? 0xe74c3c : 0xecf0f1, roughness: 0.7
            }));
            this.threeScene.add(curb);
        }

        // ── Center dashed line ──
        const centerMat = new THREE.LineDashedMaterial({
            color: 0xf1c40f, dashSize: 1.2, gapSize: 0.8,
            transparent: true, opacity: 0.6
        });
        const centerGeo = new THREE.BufferGeometry().setFromPoints(
            trackPoints.map(p => new THREE.Vector3(p.x, 0.06, p.z))
        );
        const centerLine = new THREE.Line(centerGeo, centerMat);
        centerLine.computeLineDistances();
        this.threeScene.add(centerLine);

        // ── Shoulder gravel strips ──
        for (let side = -1; side <= 1; side += 2) {
            const shoulderW = 1.2;
            const sPositions = [];
            const sIndices = [];

            for (let i = 0; i < trackPoints.length; i++) {
                const p = trackPoints[i];
                const t = i / (trackPoints.length - 1);
                const tangent = this.trackCurve.getTangentAt(t).normalize();
                const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
                const startOffset = roadWidth / 2 + 0.35;

                const inner = p.clone().add(right.clone().multiplyScalar(side * startOffset));
                const outer = p.clone().add(right.clone().multiplyScalar(side * (startOffset + shoulderW)));

                sPositions.push(inner.x, 0.01, inner.z, outer.x, 0.01, outer.z);

                if (i < trackPoints.length - 1) {
                    const b = i * 2;
                    sIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
                }
            }

            const sGeo = new THREE.BufferGeometry();
            sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPositions, 3));
            sGeo.setIndex(sIndices);
            sGeo.computeVertexNormals();

            const shoulder = new THREE.Mesh(sGeo, new THREE.MeshStandardMaterial({
                color: 0x5d4037, roughness: 1.0, metalness: 0
            }));
            shoulder.receiveShadow = true;
            this.threeScene.add(shoulder);
        }

        // Store precomputed curvature for cornering speed
        this._curvatures = [];
        for (let i = 0; i < segCount; i++) {
            const t0 = i / segCount;
            const t1 = (i + 1) / segCount;
            const d0 = this.trackCurve.getTangentAt(t0);
            const d1 = this.trackCurve.getTangentAt(t1);
            this._curvatures.push(1 - d0.dot(d1)); // Higher = sharper turn
        }
    }

    _addBarriers() {
        // Place small barrier posts at intervals on outside
        const barrierMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e9, metalness: 0.6, roughness: 0.4 });
        const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);

        for (let i = 0; i < 60; i++) {
            const t = i / 60;
            const pos = this.trackCurve.getPointAt(t);
            const tangent = this.trackCurve.getTangentAt(t).normalize();
            const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

            for (let side = -1; side <= 1; side += 2) {
                const p = pos.clone().add(right.clone().multiplyScalar(side * 2.8));
                const post = new THREE.Mesh(postGeo, barrierMat);
                post.position.set(p.x, 0.25, p.z);
                post.castShadow = true;
                this.threeScene.add(post);
            }
        }
    }

    _spawnCars(count) {
        for (let i = 0; i < count; i++) {
            const builderFn = CAR_BUILDERS[i % CAR_BUILDERS.length];
            const color = CAR_COLORS[i % CAR_COLORS.length];
            const mesh = builderFn(color);
            mesh.scale.setScalar(0.75);
            this.threeScene.add(mesh);

            this.cars.push({
                mesh,
                t: i / count,
                baseSpeed: 0.018 + Math.random() * 0.014,
                currentSpeed: 0.02,
                targetSpeed: 0.02,
                lateralOffset: (Math.random() - 0.5) * 0.8, // Lane preference
                tilt: 0,
            });
        }
    }

    _getCurvatureAt(t) {
        const idx = Math.floor(t * this._curvatures.length) % this._curvatures.length;
        return this._curvatures[idx];
    }

    update(delta, time) {
        for (const car of this.cars) {
            // Cornering speed adjustment
            const curvature = this._getCurvatureAt(car.t);
            const cornerFactor = Math.max(0.35, 1 - curvature * 25);
            car.targetSpeed = car.baseSpeed * cornerFactor;

            // Smooth speed interpolation (braking/accelerating)
            car.currentSpeed += (car.targetSpeed - car.currentSpeed) * delta * 4;

            car.t += car.currentSpeed * delta;
            if (car.t > 1) car.t -= 1;

            const pos = this.trackCurve.getPointAt(car.t);
            const tangent = this.trackCurve.getTangentAt(car.t).normalize();
            const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

            // Lateral lane offset
            const lateralPos = pos.clone().add(right.clone().multiplyScalar(car.lateralOffset));
            car.mesh.position.set(lateralPos.x, 0.02, lateralPos.z);

            // Face direction
            const lookTarget = pos.clone().add(tangent);
            car.mesh.lookAt(lookTarget.x, 0.02, lookTarget.z);

            // Body roll in corners (tilt toward outside of turn)
            const targetTilt = -curvature * 15 * Math.sign(car.lateralOffset || 0.1);
            car.tilt += (targetTilt - car.tilt) * delta * 5;
            car.mesh.rotation.z = car.tilt * 0.3;

            // Spin wheels
            car.mesh.traverse(child => {
                if (child.userData && child.userData.isWheel) {
                    child.children.forEach(w => {
                        w.rotation.x += car.currentSpeed * delta * 200;
                    });
                }
            });
        }
    }
}
