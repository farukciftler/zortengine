import * as THREE from 'three';
import { createStreetLight, createBench, createTrashCan, createPlanter } from './StreetProps.js';
import { SittingNpcBench } from './SittingNpcBench.js';

/**
 * Ana cadde + mağaza tarafı taş kaldırım. Doğu kaldırım yok; harita yolun ötesinde biter.
 */

const ROAD_HALF_WIDTH = 9;
export const STREET_Z_HALF = 72;
const SIDEWALK_WEST_X0 = -44;
const SIDEWALK_WEST_X1 = -11;

/** İki şerit +Z, iki şerit −Z (karşı yön). */
export const LANE_DEFS = [
    { x: -6.75, dir: 1 },
    { x: -2.25, dir: 1 },
    { x: 2.25, dir: -1 },
    { x: 6.75, dir: -1 }
];

/** Aynı yönde bitişik şerit (sollama): 0↔1, 2↔3 */
export function lanePairAlternate(laneIndex) {
    if (laneIndex === 0) return 1;
    if (laneIndex === 1) return 0;
    if (laneIndex === 2) return 3;
    if (laneIndex === 3) return 2;
    return null;
}

export function getRoadZBounds() {
    return {
        zMin: -STREET_Z_HALF + 2,
        zMax: STREET_Z_HALF - 2
    };
}

/** Mağaza kaldırımı içinde yürüme alanı (yol ve bina kenarından pay). */
export function getWestSidewalkBounds() {
    return {
        xMin: -42,
        xMax: -12,
        zMin: -STREET_Z_HALF + 2,
        zMax: STREET_Z_HALF - 2
    };
}

/**
 * Kariyer binaları dünya XZ ayak izi (group y=-π/2: wx=cx−lz, wz=cz+lx).
 * NPC hedefleri bu kutuların dışında kalmalı.
 */
export const NPC_BUILDING_EXCLUSIONS = [
    { xMin: -36.8, xMax: -23.2, zMin: -33.8, zMax: -16.2 },
    { xMin: -37.8, xMax: -22.2, zMin: -9.8, zMax: 9.8 },
    { xMin: -35.8, xMax: -24.2, zMin: 17.8, zMax: 32.2 },
    { xMin: -35.8, xMax: -24.2, zMin: 17.8, zMax: 32.2 },
    // NewMind at [-30, 0, 50] (W=16, D=12 -> so x from -38 to -22, z from 44 to 56)
    { xMin: -38.0, xMax: -22.0, zMin: 44.0, zMax: 56.0 },
    // Info Booth at [-24.1, 11.5]
    { xMin: -25.2, xMax: -23.0, zMin: 10.4, zMax: 12.6 }
];

/** 
 * Circular Obstacles for Steering Avoidance 
 */
export const STREET_OBSTACLES = [
    // Street Lights
    ...[-60, -45, -30, -15, 0, 15, 30, 45, 60].map(z => ({ x: -11.5, z, radius: 1.0 })),
    // Benches and Trash stations (using multiple circles for the long shape)
    ...[-37.5, -7.5, 22.5, 52.5].flatMap(z => [
        { x: -18, z: z - 1.2, radius: 1.2 },
        { x: -18, z, radius: 1.2 },
        { x: -18, z: z + 1.2, radius: 1.2 },
        { x: -19, z: z + 2.5, radius: 0.8 } // Trash can
    ]),
    // Planters
    ...[-52.5, -22.5, 7.5, 37.5, 67.5].map(z => ({ x: -18, z, radius: 1.4 })),
    // Extra Entrance Planters
    ...[-30, -20, -5, 5, 20, 30, 45, 55].map(z => ({ x: -18, z, radius: 1.4 }))
];

/** 
 * Dedicated safe patrol lanes along the sidewalk.
 */
export const NPC_PATROL_PATHS = [
    { x: -20.8, name: 'inner' }, // Between buildings and props
    { x: -14.8, name: 'outer' }  // Between props and road
];

export function isNpcWalkBlockedByBuilding(x, z) {
    const isBuildingBlocked = NPC_BUILDING_EXCLUSIONS.some(
        b => x >= b.xMin && x <= b.xMax && z >= b.zMin && z <= b.zMax
    );
    return isBuildingBlocked;
}

function pushEnv(list, obj) {
    obj.traverse?.(ch => {
        if (ch.isMesh) {
            ch.castShadow = true;
            ch.receiveShadow = true;
        }
    });
    if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
    }
    list.push(obj);
    return obj;
}

/** Düzensiz taş döşeme — canvas dokusu */
function createStonePavementTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6e6e6c';
    ctx.fillRect(0, 0, 512, 512);
    const base = [105, 108, 106];
    for (let row = 0; row < 14; row++) {
        for (let col = 0; col < 14; col++) {
            const ox = col * 36 + (row % 2) * 18;
            const oy = row * 36;
            const w = 32 + Math.random() * 6;
            const h = 30 + Math.random() * 8;
            const jitter = () => (Math.random() - 0.5) * 8;
            ctx.fillStyle = `rgb(${base[0] + jitter()},${base[1] + jitter()},${base[2] + jitter()})`;
            ctx.beginPath();
            const rx = 4;
            ctx.moveTo(ox + rx, oy);
            ctx.lineTo(ox + w - rx, oy);
            ctx.quadraticCurveTo(ox + w, oy, ox + w, oy + rx);
            ctx.lineTo(ox + w, oy + h - rx);
            ctx.quadraticCurveTo(ox + w, oy + h, ox + w - rx, oy + h);
            ctx.lineTo(ox + rx, oy + h);
            ctx.quadraticCurveTo(ox, oy + h, ox, oy + h - rx);
            ctx.lineTo(ox, oy + rx);
            ctx.quadraticCurveTo(ox, oy, ox + rx, oy);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.strokeStyle = '#4a4a48';
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, Math.random() * 512);
        ctx.lineTo(Math.random() * 512, Math.random() * 512);
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 18);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/** 
 * Create a simple license plate texture.
 */
function createLicensePlateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 32);
    
    ctx.fillStyle = '#003399';
    ctx.fillRect(0, 0, 16, 32);
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 126, 30);
    
    const city = Math.floor(Math.random() * 81 + 1).toString().padStart(2, '0');
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + (Math.random() > 0.5 ? String.fromCharCode(65 + Math.floor(Math.random() * 26)) : '');
    const numbers = Math.floor(Math.random() * 9000 + 100).toString().slice(0, 4);
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${city} ${letters} ${numbers}`, 72, 24);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/**
 * Düşük poli ama okunaklı otomobil (şasi, kabin, cam, jant, far).
 * @param {number} bodyColor
 * @returns {THREE.Group}
 */
export function createDetailedCarGroup(bodyColor) {
    const group = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.38,
        metalness: 0.55,
        envMapIntensity: 0.9
    });
    const plastic = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.65, metalness: 0.15 });
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x0d1520,
        roughness: 0.08,
        metalness: 0.65,
        transparent: true,
        opacity: 0.82
    });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.98, metalness: 0.02 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xd5dbe0, roughness: 0.18, metalness: 0.88 });
    const emissiveHead = new THREE.MeshStandardMaterial({
        color: 0xfff8e8,
        emissive: 0xffe8b8,
        emissiveIntensity: 0.45,
        roughness: 0.35
    });
    const emissiveTail = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        emissive: 0xff2200,
        emissiveIntensity: 0.35,
        roughness: 0.4
    });

    const wr = 0.34;
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.52, 4.35), paint);
    chassis.position.set(0, wr + 0.26, 0);
    group.add(chassis);

    const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.12, 4.42), plastic);
    skirt.position.set(0, wr + 0.06, 0);
    group.add(skirt);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.68, 2.15), paint);
    cabin.position.set(0, wr + 0.52 + 0.34, -0.2);
    group.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.1, 1.75), paint);
    roof.position.set(0, wr + 0.52 + 0.68 + 0.05, -0.15);
    group.add(roof);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.22, 1.15), paint);
    hood.position.set(0, wr + 0.45, 1.15);
    group.add(hood);

    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.2, 0.95), paint);
    trunk.position.set(0, wr + 0.42, -1.35);
    group.add(trunk);

    const wind = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.62), glassMat);
    wind.position.set(0, wr + 0.95, 0.72);
    wind.rotation.x = -0.32;
    group.add(wind);

    const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.45), glassMat);
    rearGlass.position.set(0, wr + 0.88, -0.95);
    rearGlass.rotation.x = 0.28;
    group.add(rearGlass);

    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.2, 0.22), plastic);
    bumperF.position.set(0, wr + 0.18, 2.28);
    group.add(bumperF);
    const bumperR = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.2, 0.22), plastic);
    bumperR.position.set(0, wr + 0.18, -2.28);
    group.add(bumperR);

    const wheelGeo = new THREE.CylinderGeometry(wr, wr, 0.22, 20);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.24, 14);
    rimGeo.rotateZ(Math.PI / 2);
    [[-0.86, 1.32], [0.86, 1.32], [-0.86, -1.32], [0.86, -1.32]].forEach(([wx, wz]) => {
        const w = new THREE.Mesh(wheelGeo, rubber);
        w.position.set(wx, wr, wz);
        group.add(w);
        const rim = new THREE.Mesh(rimGeo, chrome);
        rim.position.set(wx, wr, wz);
        group.add(rim);
    });

    [[-0.55, 2.18], [0.55, 2.18]].forEach(([hx, hz]) => {
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.08), emissiveHead.clone());
        h.position.set(hx, wr + 0.35, hz);
        h.name = 'car_front_light';
        group.add(h);
    });
    [[-0.5, -2.2], [0.5, -2.2]].forEach(([tx, tz]) => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.06), emissiveTail.clone());
        t.position.set(tx, wr + 0.32, tz);
        t.name = 'car_back_light';
        group.add(t);
    });

    const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.18), chrome);
    mirrorL.position.set(-1.02, wr + 0.78, 0.45);
    group.add(mirrorL);
    const mirrorR = mirrorL.clone();
    mirrorR.position.x = 1.02;
    group.add(mirrorR);
    
    // License Plates
    const plateTex = createLicensePlateTexture();
    const plateMat = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.5 });
    const plateGeo = new THREE.PlaneGeometry(0.5, 0.12);
    
    const plateF = new THREE.Mesh(plateGeo, plateMat);
    plateF.position.set(0, wr + 0.2, 2.4);
    group.add(plateF);
    
    const plateR = new THREE.Mesh(plateGeo, plateMat);
    plateR.position.set(0, wr + 0.2, -2.4);
    plateR.rotation.y = Math.PI;
    group.add(plateR);

    group.traverse(o => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
        }
    });
    return group;
}

/**
 * @param {THREE.Scene} scene
 * @param {Array<THREE.Object3D>} environmentMeshes
 */
export function buildMainStreet(scene, environmentMeshes, physics, propMaterial) {
    const asphaltMat = new THREE.MeshStandardMaterial({
        name: 'asphalt',
        color: 0x2a2a2a,
        roughness: 0.92,
        metalness: 0.06
    });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x6a6a68, roughness: 0.82 });
    const stoneTex = createStonePavementTexture();
    const sidewalkMat = new THREE.MeshStandardMaterial({
        name: 'sidewalk',
        map: stoneTex,
        roughness: 0.88,
        metalness: 0.02
    });
    const lineYellow = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    const lineWhite = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });

    const road = new THREE.Mesh(
        new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 2, STREET_Z_HALF * 2),
        asphaltMat
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.045, 0);
    scene.add(road);
    pushEnv(environmentMeshes, road);

    const swW = new THREE.Mesh(
        new THREE.PlaneGeometry(SIDEWALK_WEST_X1 - SIDEWALK_WEST_X0, STREET_Z_HALF * 2),
        sidewalkMat
    );
    swW.rotation.x = -Math.PI / 2;
    swW.position.set((SIDEWALK_WEST_X0 + SIDEWALK_WEST_X1) / 2, 0.052, 0);
    scene.add(swW);
    pushEnv(environmentMeshes, swW);

    const curbH = 0.14;
    const curbLen = STREET_Z_HALF * 2;
    const westCurb = new THREE.Mesh(new THREE.BoxGeometry(0.28, curbH, curbLen), curbMat);
    westCurb.position.set(-ROAD_HALF_WIDTH - 0.14, curbH / 2 + 0.02, 0);
    scene.add(westCurb);
    pushEnv(environmentMeshes, westCurb);

    const eastCurb = new THREE.Mesh(new THREE.BoxGeometry(0.28, curbH, curbLen), curbMat);
    eastCurb.position.set(ROAD_HALF_WIDTH + 0.14, curbH / 2 + 0.02, 0);
    scene.add(eastCurb);
    pushEnv(environmentMeshes, eastCurb);

    const centerLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.03, curbLen - 4),
        lineYellow
    );
    centerLine.position.set(0, 0.08, 0);
    scene.add(centerLine);
    pushEnv(environmentMeshes, centerLine);

    const dashLen = 3;
    const dashGap = 3;
    /** Kuzey yönü iki şerit arası (−6.75 ile −2.25 ortası), güney yönü (2.25 ile 6.75 ortası). */
    for (let z = -STREET_Z_HALF + 2; z < STREET_Z_HALF - 2; z += dashLen + dashGap) {
        [-4.5, 4.5].forEach(lx => {
            const d = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.02, dashLen),
                lineWhite
            );
            d.position.set(lx, 0.07, z + dashLen / 2);
            scene.add(d);
            pushEnv(environmentMeshes, d);
        });
    }

    const edgeGeo = new THREE.BoxGeometry(0.1, 0.02, curbLen - 4);
    [-ROAD_HALF_WIDTH + 0.15, ROAD_HALF_WIDTH - 0.15].forEach(ex => {
        const e = new THREE.Mesh(edgeGeo, lineWhite);
        e.position.set(ex, 0.07, 0);
        scene.add(e);
        pushEnv(environmentMeshes, e);
    });

    decorateStreet(scene, environmentMeshes, physics, propMaterial);

    return {
        roadHalfWidth: ROAD_HALF_WIDTH,
        streetZHalf: STREET_Z_HALF
    };
}

/**
 * Adds decorative props (lights, benches, etc.) along the western sidewalk.
 */
function decorateStreet(scene, environmentMeshes, physics, propMaterial) {
    const lightZPositions = [-60, -45, -30, -15, 0, 15, 30, 45, 60];

    // 1. Street Lights
    for (const z of lightZPositions) {
        const light = createStreetLight();
        light.rotation.y = -Math.PI / 2; // Arm points toward the road (+X)
        // Adjust arm direction: rotation.y = -PI/2 means local +Z points to World -X
        // Wait, local arm is at +X world (if local X arm points to world Z?)
        // Let's check createStreetLight: arm is at X=0.5, head at 1.1, bulb at 1.1
        // So local +X points to the road. 
        // If we want it pointing to World +X, we need rotation.y = 0.
        light.rotation.y = 0;
        const yPos = 0.05;
        light.position.set(-11.5, yPos, z);
        scene.add(light);

        if (physics && propMaterial) {
            const body = physics.createBox(
                0.4, 6, 0.4, 0,
                { x: -11.5, y: 3 + yPos, z },
                light.quaternion,
                { material: propMaterial }
            );
            physics.addBody(body, light, { offset: new THREE.Vector3(0, -3, 0) });
        }

        // Add to environment meshes only the pole for collision/occlusion if needed
        environmentMeshes.push(light);
    }

    // 2. Benches and Planters (alternating)
    const midZPositions = [-52.5, -37.5, -22.5, -7.5, 7.5, 22.5, 37.5, 52.5, 67.5];
    const sittingBenches = [];

    for (let i = 0; i < midZPositions.length; i++) {
        const z = midZPositions[i];
        if (i % 2 === 0) {
            let bench;
            let rotationY = Math.PI / 2; // Default facing road (+X)

            if (i === 1 || i === 5 || i === 7) {
                // Use a Sitting NPC variant for some benches
                const sitBench = new SittingNpcBench(scene, -18, z, rotationY);
                bench = sitBench.group;
                sittingBenches.push(sitBench);
            } else {
                bench = createBench();
                bench.rotation.y = rotationY;
                bench.position.set(-18, 0.05, z);
                scene.add(bench);
            }

            const bY = 0.5; // Half of height 1
            if (physics && propMaterial) {
                const body = physics.createBox(
                    1.4, 1, 3.2, 0,
                    { x: -18, y: bY + 0.05, z: z },
                    bench.quaternion, // Sync rotation!
                    { material: propMaterial }
                );
                physics.addBody(body, bench, { offset: new THREE.Vector3(0, -0.5, 0) });
            }

            // Add a trash can nearby
            const trash = createTrashCan();
            trash.position.set(-18.5, 0.05, z + 2.5);
            scene.add(trash);

            if (physics && propMaterial) {
                const body = physics.createBox(
                    0.7, 1.0, 0.7, 0,
                    { x: -18.5, y: 0.5 + 0.05, z: z + 2.5 },
                    trash.quaternion,
                    { material: propMaterial }
                );
                physics.addBody(body, trash, { offset: new THREE.Vector3(0, -0.5, 0) });
            }
        } else {
            const planter = createPlanter();
            planter.position.set(-18, 0.05, z);
            scene.add(planter);

            if (physics && propMaterial) {
                const body = physics.createBox(
                    1.5, 0.6, 1.5, 0,
                    { x: -18, y: 0.3 + 0.05, z: z },
                    null,
                    { material: propMaterial }
                );
                physics.addBody(body, planter, { offset: new THREE.Vector3(0, -0.3, 0) });
            }
        }
    }

    // 3. Extra planters near building entrances (at x=0 local to buildings)
    // Buildings are at z = -25, 0, 25, 50
    [-25, 0, 25, 50].forEach(bz => {
        const spots = [bz - 5, bz + 5];
        for (const sz of spots) {
            const p = createPlanter();
            p.position.set(-18, 0.05, sz);
            scene.add(p);

            if (physics && propMaterial) {
                const body = physics.createBox(
                    1.5, 0.6, 1.5, 0,
                    { x: -18, y: 0.3 + 0.05, z: sz },
                    null,
                    { material: propMaterial }
                );
                physics.addBody(body, p, { offset: new THREE.Vector3(0, -0.3, 0) });
            }
        }
    });

    return { sittingBenches };
}

