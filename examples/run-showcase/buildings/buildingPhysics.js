import * as THREE from 'three';

/**
 * Etkileşimli bina kuralları (fizik + TPS/izometrik + kapı):
 * 1) Mesh yerel eksende (ön yüz genelde local -Z); group.position/rotation set et, scene.add.
 * 2) addBuildingShellPhysics(buildRectDoorShellBoxes({...})) veya özel kutu listesi.
 * 3) return { ..., interaction: createBuildingInteractionHandle({ group, W, D, doorLocalZ: frontZ }) }
 *    — W,D zemin iç dikdörtgen; doorLocalZ kapı önü yerel z (mesh frontZ ile aynı).
 */

// ── Sabitler: içeride / dışarıda + kapı animasyonu ───────────────────────────
export const DEFAULT_ENTER_MARGIN = 0.5;
export const DEFAULT_EXIT_BUFFER = 1.0;
export const DEFAULT_DOOR_OPEN_DISTANCE = 6;

// ── Fizik: yerel kutu listesi → Cannon (grup rotasyonu ile) ───────────────────
/**
 * @param {import('zortengine/physics').PhysicsManager} physics
 * @param {object} material
 * @param {THREE.Group} group - scene.add sonrası, position/rotation set edilmiş kök
 * @param {Array<{ x: number, y: number, z: number, w: number, h: number, d: number }>} boxes
 */
export function addBuildingShellPhysics(physics, material, group, boxes) {
    group.updateMatrixWorld(true);
    const worldPos = new THREE.Vector3();
    const q = group.quaternion;
    for (const b of boxes) {
        worldPos.set(b.x, b.y, b.z);
        group.localToWorld(worldPos);
        physics.addBody(
            physics.createBox(b.w, b.h, b.d, 0, worldPos, q, { material })
        );
    }
}

/**
 * Standart dikdörtgen zemin, ön yüz local -Z tarafında kapı boşluğu + lentis.
 * Yeni bina: W, D, H, wallT, doorW ve lintel tipini ver; mesh ile aynı yerel eksende kal.
 *
 * @param {object} o
 * @param {number} o.W - yerel x genişliği (iç zemin)
 * @param {number} o.D - yerel z derinliği
 * @param {number} o.H - duvar yüksekliği
 * @param {number} o.wallT - duvar kalınlığı
 * @param {number} o.doorW - kapı genişliği
 * @param {null|'boyner'|{ type: 'wugo', doorH: number }|{ type: 'inveon', doorH: number, doorBaseY?: number }} o.lintel
 */
export function buildRectDoorShellBoxes(o) {
    const { W, D, H, wallT, doorW, lintel } = o;
    const frontZ = -(D / 2) - wallT / 2;
    const backZ = (D / 2) + wallT / 2;
    const leftX = -(W / 2) - wallT / 2;
    const rightX = (W / 2) + wallT / 2;
    const wallH = H;
    const frontWallW = (W - doorW) / 2;
    const boxes = [
        { x: 0, y: wallH / 2, z: backZ, w: W, h: wallH, d: wallT },
        { x: leftX, y: wallH / 2, z: 0, w: wallT, h: wallH, d: D },
        { x: rightX, y: wallH / 2, z: 0, w: wallT, h: wallH, d: D },
        { x: -W / 2 + frontWallW / 2, y: wallH / 2, z: frontZ, w: frontWallW, h: wallH, d: wallT },
        { x: W / 2 - frontWallW / 2, y: wallH / 2, z: frontZ, w: frontWallW, h: wallH, d: wallT }
    ];
    if (lintel === 'boyner') {
        boxes.push({ x: 0, y: H - 0.4, z: frontZ, w: doorW, h: 0.8, d: wallT });
    } else if (lintel && lintel.type === 'wugo') {
        const { doorH } = lintel;
        boxes.push({
            x: 0,
            y: doorH + (H - doorH) / 2,
            z: frontZ,
            w: doorW + 1.2,
            h: H - doorH,
            d: wallT
        });
    } else if (lintel && lintel.type === 'inveon') {
        const { doorH, doorBaseY = 0.4 } = lintel;
        const doorTopY = doorBaseY + doorH;
        const lintelH = H - doorTopY - 0.15;
        const lintelY = doorTopY + lintelH / 2;
        boxes.push({ x: 0, y: lintelY, z: frontZ, w: doorW, h: lintelH, d: wallT });
    }
    return boxes;
}

// ── Etkileşim: TPS / izometrik, kapı mesafesi (yerel zemin = worldToLocal ile) ─

const _scratchWorld = new THREE.Vector3();

/**
 * @param {object} opts
 * @param {THREE.Group} opts.group
 * @param {number} opts.W - yerel zemin x aralığı ±W/2
 * @param {number} opts.D - yerel zemin z: [-D/2, D/2]
 * @param {number} opts.doorLocalZ - kapı merkezi yerel z (genelde frontZ)
 * @param {number} [opts.doorOpenDistance]
 * @param {number} [opts.enterMargin]
 * @param {number} [opts.exitBuffer]
 */
export function createBuildingInteractionHandle(opts) {
    const {
        group,
        W,
        D,
        doorLocalZ,
        doorOpenDistance = DEFAULT_DOOR_OPEN_DISTANCE,
        enterMargin = DEFAULT_ENTER_MARGIN,
        exitBuffer = DEFAULT_EXIT_BUFFER
    } = opts;
    return {
        group,
        halfW: W / 2,
        halfD: D / 2,
        doorLocal: new THREE.Vector3(0, 0, doorLocalZ),
        doorOpenDistance,
        enterMargin,
        exitBuffer,
        buildingName: opts.buildingName
    };
}

/**
 * Oyuncu zemin projeksiyonu yerel zemin dikdörtgeninde mi (histerezis)?
 * Dünya AABB yerine worldToLocal — döndürülmüş bina ile uyumlu.
 */
export function isPlayerInsideBuildingFloor(playerPos, interaction, wasInside) {
    const { group, halfW, halfD, enterMargin, exitBuffer } = interaction;
    const em = enterMargin ?? DEFAULT_ENTER_MARGIN;
    const eb = exitBuffer ?? DEFAULT_EXIT_BUFFER;
    group.updateMatrixWorld(true);
    _scratchWorld.set(playerPos.x, playerPos.y, playerPos.z);
    group.worldToLocal(_scratchWorld);
    const lx = _scratchWorld.x;
    const lz = _scratchWorld.z;
    const hw = wasInside ? halfW + eb : halfW - em;
    const hd = wasInside ? halfD + eb : halfD - em;
    return Math.abs(lx) < hw && Math.abs(lz) < hd;
}

/** Kapı önü dünya konumu (yerel doorLocal → localToWorld). */
export function getDoorWorldPosition(interaction) {
    const { group, doorLocal } = interaction;
    const v = doorLocal.clone();
    group.updateMatrixWorld(true);
    return group.localToWorld(v);
}
