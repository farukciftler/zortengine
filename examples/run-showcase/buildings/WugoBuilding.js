import * as THREE from 'three';
import {
    addBuildingShellPhysics,
    buildRectDoorShellBoxes,
    createBuildingInteractionHandle
} from './buildingPhysics.js';
import { resources } from 'zortengine';

/**
 * WugoBuilding — Modern Event Discovery Hub.
 * Boyner-level detail: 4-wall architecture with windows, interior floor,
 * decorative facade columns, detailed interior furnishing.
 */
export function buildWugoBuilding(scene, physics, groundMaterial, position = [0, 0, 0]) {
    const [px, , pz] = position;
    const group = new THREE.Group();

    // ── Dimensions ───────────────────────────────────────────────────────────
    const W = 14;
    const H = 7;
    const D = 10;
    const WALL_T = 0.4;
    const FLOOR_Y = 0.011;

    // ── Palette ───────────────────────────────────────────────────────────────
    const blueMat = resources.getMaterial('wugo_blue', () => new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.4, metalness: 0.15 }));
    const lightBlueMat = resources.getMaterial('wugo_light_blue', () => new THREE.MeshStandardMaterial({ color: 0xbbdefb, roughness: 0.6 }));
    const whiteMat = resources.getMaterial('shared_white', () => new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 }));
    const darkMat = resources.getMaterial('dark_navy', () => new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7, metalness: 0.1 }));
    const accentMat = resources.getMaterial('wugo_accent', () => new THREE.MeshStandardMaterial({ color: 0xff6f00, emissive: 0x993300, emissiveIntensity: 0.25, roughness: 0.35, metalness: 0.2 }));
    const glassMat = resources.getMaterial('wugo_glass', () => new THREE.MeshStandardMaterial({
        color: 0xaed6f1, transparent: true, opacity: 0.25,
        roughness: 0.05, metalness: 0.5, side: THREE.DoubleSide, depthWrite: false
    }));
    const frameMat = resources.getMaterial('dark_frame', () => new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.4, metalness: 0.8 }));
    const steelMat = resources.getMaterial('shared_steel', () => new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.9, roughness: 0.1 }));
    const woodMat = resources.getMaterial('wugo_wood', () => new THREE.MeshStandardMaterial({ color: 0x8d6e3e, roughness: 0.7 }));
    const colMat = resources.getMaterial('wugo_column', () => new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.5, metalness: 0.3 }));
    const intFloorMat = resources.getMaterial('wugo_floor', () => new THREE.MeshStandardMaterial({ color: 0xe3f2fd, roughness: 0.45 }));
    const recMat = resources.getMaterial('wugo_rec_blue', () => new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.5, metalness: 0.3 }));

    // ── Helpers ───────────────────────────────────────────────────────────────
    const add = (mesh, shadow = true) => {
        if (shadow) { mesh.castShadow = true; mesh.receiveShadow = true; }
        group.add(mesh);
        return mesh;
    };
    const box = (w, h, d, mat, x, y, z) => {
        const m = new THREE.Mesh(resources.getBox(w, h, d), mat);
        m.position.set(x, y, z);
        return add(m);
    };

    // ── Interior Floor ───────────────────────────────────────────────────────
    const floor = new THREE.Mesh(resources.getPlane(W + WALL_T * 2, D + WALL_T * 2), intFloorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR_Y, 0);
    add(floor);

    const frontZ = -(D / 2) - WALL_T / 2;
    const backZ  = (D / 2) + WALL_T / 2;
    const leftX  = -(W / 2) - WALL_T / 2;
    const rightX = (W / 2) + WALL_T / 2;

    // ── FRONT WALL — Modern Facade ──────────────────────────────────────────
    const doorW = 2.8;
    const doorH = H - 0.4;
    box(3.5, H, WALL_T, blueMat, -(W / 2) + 1.75, H / 2, frontZ);
    box(3.5, H, WALL_T, blueMat,  (W / 2) - 1.75, H / 2, frontZ);
    box(0.5, H, WALL_T, blueMat, -doorW / 2 - 0.25, H / 2, frontZ);
    box(0.5, H, WALL_T, blueMat,  doorW / 2 + 0.25, H / 2, frontZ);
    box(W, 0.8, WALL_T, blueMat, 0, H - 0.4, frontZ);

    // Front Glass Panels
    const winH = H - 1.6;
    const winY = 0.8 + winH / 2;
    const addWindowFrame = (cx, cy, cz, fw, fh) => {
        [[-fw / 2, 0], [fw / 2, 0]].forEach(([ox]) =>
            box(WALL_T * 0.5, fh, WALL_T * 0.4, frameMat, cx + ox, cy, cz));
        [0, fh / 2, -fh / 2].forEach(oy =>
            box(fw, WALL_T * 0.5, WALL_T * 0.4, frameMat, cx, cy + oy, cz));
        box(WALL_T * 0.4, fh, WALL_T * 0.4, frameMat, cx, cy, cz); // mullion
    };
    [-4.5, 4.5].forEach(cx => {
        const g = new THREE.Mesh(resources.getPlane(3.5, winH), glassMat);
        g.position.set(cx, winY, frontZ - 0.01);
        add(g, false);
        addWindowFrame(cx, winY, frontZ - 0.05, 3.65, winH + 0.1);
    });

    // ── BACK WALL ────────────────────────────────────────────────────────────
    box(W, H * 0.55, WALL_T, blueMat, 0, H * 0.55 / 2, backZ);
    box(W, H * 0.25, WALL_T, blueMat, 0, H - H * 0.25 / 2, backZ);
    const backGlass = new THREE.Mesh(resources.getPlane(W - 2, H * 0.2), glassMat);
    backGlass.rotation.y = Math.PI;
    backGlass.position.set(0, H * 0.55 + H * 0.1, backZ + 0.01);
    add(backGlass, false);
    box(W, 0.1, WALL_T * 0.4, frameMat, 0, H * 0.55, backZ + 0.02);
    box(W, 0.1, WALL_T * 0.4, frameMat, 0, H * 0.55 + H * 0.2, backZ + 0.02);

    // ── LEFT WALL (with side windows) ────────────────────────────────────────
    box(WALL_T, 1.0, D, blueMat, leftX, 0.5, 0);
    box(WALL_T, 1.2, D, blueMat, leftX, H - 0.6, 0);
    box(WALL_T, H, 1.0, blueMat, leftX, H / 2, -(D / 2) + 0.5);
    box(WALL_T, H, 1.0, blueMat, leftX, H / 2, (D / 2) - 0.5);
    box(WALL_T, H, 0.6, blueMat, leftX, H / 2, 0);
    const sideWinH = H - 2.2;
    const sideWinW = (D - 4) / 2 - 0.3;
    [-2.5, 2.5].forEach(zo => {
        const sg = new THREE.Mesh(resources.getPlane(sideWinW, sideWinH), glassMat);
        sg.rotation.y = Math.PI / 2;
        sg.position.set(leftX - 0.01, 1.0 + sideWinH / 2, zo);
        add(sg, false);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, leftX, 1.0, zo);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, leftX, 1.0 + sideWinH, zo);
    });

    // ── RIGHT WALL (with side windows) ───────────────────────────────────────
    box(WALL_T, 1.0, D, blueMat, rightX, 0.5, 0);
    box(WALL_T, 1.2, D, blueMat, rightX, H - 0.6, 0);
    box(WALL_T, H, 1.0, blueMat, rightX, H / 2, -(D / 2) + 0.5);
    box(WALL_T, H, 1.0, blueMat, rightX, H / 2, (D / 2) - 0.5);
    box(WALL_T, H, 0.6, blueMat, rightX, H / 2, 0);
    [-2.5, 2.5].forEach(zo => {
        const sg = new THREE.Mesh(resources.getPlane(sideWinW, sideWinH), glassMat);
        sg.rotation.y = -Math.PI / 2;
        sg.position.set(rightX + 0.01, 1.0 + sideWinH / 2, zo);
        add(sg, false);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, rightX, 1.0, zo);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, rightX, 1.0 + sideWinH, zo);
    });

    // ── DOOR GROUP (Boyner-style pivot) ──────────────────────────────────────
    const doorGroup = new THREE.Group();
    doorGroup.position.set(-doorW / 2, 0, frontZ);
    group.add(doorGroup);

    const doorGlass = new THREE.Mesh(resources.getPlane(doorW, doorH), glassMat);
    doorGlass.position.set(doorW / 2, doorH / 2 + 0.1, 0.04);
    doorGroup.add(doorGlass);

    const doorFrameGeo = resources.getBox(0.12, doorH, WALL_T * 0.5);
    const df1 = new THREE.Mesh(doorFrameGeo, frameMat);
    df1.position.set(0, doorH / 2 + 0.1, 0);
    doorGroup.add(df1);
    const df2 = new THREE.Mesh(doorFrameGeo, frameMat);
    df2.position.set(doorW, doorH / 2 + 0.1, 0);
    doorGroup.add(df2);
    const topDoorF = new THREE.Mesh(resources.getBox(doorW + 0.12, 0.12, WALL_T * 0.5), frameMat);
    topDoorF.position.set(doorW / 2, doorH + 0.1, 0);
    doorGroup.add(topDoorF);

    // Handle
    const handleBar = new THREE.Mesh(resources.getCylinder(0.04, 0.04, 0.6, 8), steelMat);
    handleBar.position.set(doorW - 0.2, 1.2, 0.12);
    handleBar.rotation.z = Math.PI / 2;
    doorGroup.add(handleBar);

    // Fixed frame above door
    box(doorW + 0.25, 0.15, WALL_T * 0.6, frameMat, 0, doorH + 0.15, frontZ);

    // ── DECORATIVE COLUMNS (facade) ──────────────────────────────────────────
    [-6, -1.8, 1.8, 6].forEach(cx => {
        const col = new THREE.Mesh(resources.getCylinder(0.2, 0.24, H + 0.4, 10), colMat);
        col.position.set(cx, (H + 0.4) / 2, frontZ - 0.2);
        col.castShadow = true;
        group.add(col);
        const cap = new THREE.Mesh(resources.getCylinder(0.3, 0.2, 0.2, 10), colMat);
        cap.position.set(cx, H + 0.5, frontZ - 0.2);
        group.add(cap);
    });

    // ── ROOF SLAB + PARAPET ──────────────────────────────────────────────────
    box(W + WALL_T * 2 + 0.2, 0.35, D + WALL_T * 2 + 0.2, darkMat, 0, H + 0.17, 0);
    const pH = 0.8;
    box(W + WALL_T * 2 + 0.6, pH + 0.3, WALL_T, accentMat, 0, H + 0.35 + (pH + 0.3) / 2, frontZ - 0.1);
    box(W + WALL_T * 2 + 0.6, pH, WALL_T, accentMat, 0, H + 0.35 + pH / 2, backZ + 0.1);
    box(WALL_T, pH, D + WALL_T * 2 + 0.6, accentMat, leftX - 0.05, H + 0.35 + pH / 2, 0);
    box(WALL_T, pH, D + WALL_T * 2 + 0.6, accentMat, rightX + 0.05, H + 0.35 + pH / 2, 0);

    // HVAC
    box(2.5, 1.0, 1.5, steelMat, -3, H + 0.8, 2);
    const fan1 = new THREE.Mesh(resources.getCylinder(0.4, 0.4, 0.1, 16), frameMat);
    fan1.position.set(-3, H + 1.55, 2); add(fan1);
    box(2.5, 1.0, 1.5, steelMat, 3, H + 0.8, -2);

    // ── ROOF SIGN ────────────────────────────────────────────────────────────
    const signY = H + 0.35 + pH + 0.3 + 0.9;
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 200;
    const sCtx = signCanvas.getContext('2d');
    sCtx.save(); sCtx.translate(1024, 0); sCtx.scale(-1, 1);
    sCtx.fillStyle = '#ff6f00';
    sCtx.fillRect(0, 0, 1024, 200);
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 130px Arial';
    sCtx.textAlign = 'center'; sCtx.textBaseline = 'middle';
    sCtx.fillText('WUGO', 512, 100);
    sCtx.restore();
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signBoard = new THREE.Mesh(
        resources.getPlane(W - 1, 1.8),
        new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, signY, frontZ - 0.25);
    group.add(signBoard);
    box(W, 2.0, 0.18, accentMat, 0, signY, frontZ - 0.14);

    // ── INTERIOR ─────────────────────────────────────────────────────────────

    // Ticket Desk
    box(3.5, 0.88, 0.75, recMat, 2, 0.44, -(D / 2) + 2.5);
    box(3.5, 0.06, 0.75, recMat, 2, 0.92, -(D / 2) + 2.5);
    box(3.5, 0.45, 0.08, recMat, 2, 1.16, -(D / 2) + 2.15);
    // Logo on desk
    const deskCanvas = document.createElement('canvas');
    deskCanvas.width = 256; deskCanvas.height = 64;
    const dCtx = deskCanvas.getContext('2d');
    dCtx.fillStyle = '#ff6f00'; dCtx.fillRect(0, 0, 256, 64);
    dCtx.fillStyle = '#fff'; dCtx.font = 'bold 36px Arial'; dCtx.textAlign = 'center'; dCtx.textBaseline = 'middle';
    dCtx.fillText('WUGO', 128, 32);
    const dTex = new THREE.CanvasTexture(deskCanvas);
    const dPlacard = new THREE.Mesh(resources.getPlane(1.5, 0.37), new THREE.MeshBasicMaterial({ map: dTex, side: THREE.DoubleSide }));
    dPlacard.rotation.y = Math.PI;
    dPlacard.position.set(2, 1.16, -(D / 2) + 2.12);
    group.add(dPlacard);

    // Sofas (Boyner-quality)
    const addSofa = (x, z, ry) => {
        const sg = new THREE.Group();
        // Seat
        const seat = new THREE.Mesh(resources.getBox(2.2, 0.45, 0.9), lightBlueMat);
        seat.position.y = 0.22; sg.add(seat);
        // Back
        const back = new THREE.Mesh(resources.getBox(2.2, 0.6, 0.2), blueMat);
        back.position.set(0, 0.55, 0.35); sg.add(back);
        // Arms
        const arm = new THREE.Mesh(resources.getBox(0.2, 0.5, 0.9), blueMat);
        [-1.0, 1.0].forEach(ax => {
            const a = arm.clone(); a.position.set(ax, 0.45, 0); sg.add(a);
        });
        // Legs
        [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(resources.getCylinder(0.04, 0.04, 0.15, 6), steelMat);
            leg.position.set(lx, 0.075, lz); sg.add(leg);
        });

        sg.position.set(x, FLOOR_Y, z);
        sg.rotation.y = ry;
        group.add(sg);
    };
    addSofa(-4, 2.5, Math.PI / 2);
    addSofa(-4, -0.5, Math.PI / 2);

    // Event Screens on walls
    const addScreen = (x, y, z, ry, label, color) => {
        const scG = new THREE.Group();
        box(2.5, 1.5, 0.1, frameMat, 0, 0, 0).parent = scG;
        const screen = new THREE.Mesh(resources.getPlane(2.3, 1.3),
            resources.getMaterial('wugo_screen_' + color, () => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: 0.8 })));
        screen.position.z = 0.06; scG.add(screen);
        const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 128;
        const cx2 = c2.getContext('2d');
        cx2.fillStyle = '#111'; cx2.fillRect(0, 0, 256, 128);
        cx2.fillStyle = '#fff'; cx2.font = 'bold 28px Arial'; cx2.textAlign = 'center';
        cx2.fillText(label, 128, 64);
        const tex2 = new THREE.CanvasTexture(c2);
        const labelMesh = new THREE.Mesh(resources.getPlane(2, 1), new THREE.MeshBasicMaterial({ map: tex2, transparent: true }));
        labelMesh.position.z = 0.07; scG.add(labelMesh);
        scG.position.set(x, y, z);
        scG.rotation.y = ry;
        group.add(scG);
    };
    addScreen(rightX - 0.25, 3, 2, -Math.PI / 2, "Concerts Near You", 0x9c27b0);
    addScreen(rightX - 0.25, 3, -2, -Math.PI / 2, "Tech Workshops", 0x00bcd4);
    addScreen(0, 3, backZ - 0.25, 0, "Explore Events", 0xff6f00);

    // Kiosks (Ticket Machines)
    const addKiosk = (x, z, ry) => {
        const kg = new THREE.Group();
        // Body
        const body = new THREE.Mesh(resources.getBox(0.6, 1.5, 0.4), frameMat);
        body.position.y = 0.75; kg.add(body);
        // Screen
        const screen = new THREE.Mesh(resources.getPlane(0.5, 0.4), resources.getMaterial('shared_kiosk_screen', () => new THREE.MeshBasicMaterial({ color: 0x00bcd4 })));
        screen.position.set(0, 1.1, 0.21); kg.add(screen);
        // Base
        const base = new THREE.Mesh(resources.getCylinder(0.3, 0.35, 0.05, 12), steelMat);
        base.position.y = 0.025; kg.add(base);

        kg.position.set(x, FLOOR_Y, z);
        kg.rotation.y = ry;
        group.add(kg);
    };
    addKiosk(5, 3, -Math.PI / 4);
    addKiosk(5, 1, -Math.PI / 4);

    // Event Posters on left wall
    const posterColors = [0xf1c40f, 0xe67e22, 0xe74c3c];
    [-2, 0, 2].forEach((zo, i) => {
        const p = new THREE.Mesh(resources.getPlane(0.8, 1.1),
            resources.getMaterial('poster_' + posterColors[i], () => new THREE.MeshStandardMaterial({ color: posterColors[i], roughness: 0.9 })));
        p.position.set(leftX + 0.21, 2.5, zo);
        p.rotation.y = Math.PI / 2;
        add(p, false);
    });

    // ── POSITION + PHYSICS ──────────────────────────────────────────────────
    group.rotation.y = -Math.PI / 2;
    group.position.set(px, 0, pz);
    scene.add(group);

    if (physics && groundMaterial) {
        const boxes = buildRectDoorShellBoxes({ W, D, H, wallT: WALL_T, doorW, lintel: { type: 'wugo', doorH } });
        // Interior colliders
        boxes.push({ x: 2, y: 0.44, z: -(D / 2) + 2.5, w: 3.5, h: 0.9, d: 0.8 }); // Desk
        boxes.push({ x: -4, y: 0.3, z: 2.5, w: 2.2, h: 0.6, d: 0.9 }); // Sofa 1
        boxes.push({ x: -4, y: 0.3, z: -0.5, w: 2.2, h: 0.6, d: 0.9 }); // Sofa 2
        boxes.push({ x: 5, y: 0.75, z: 3, w: 0.6, h: 1.5, d: 0.4 }); // Kiosk 1
        boxes.push({ x: 5, y: 0.75, z: 1, w: 0.6, h: 1.5, d: 0.4 }); // Kiosk 2
        addBuildingShellPhysics(physics, groundMaterial, group, boxes);
    }

    return {
        group,
        doorGroup,
        id: 'wugo',
        interaction: createBuildingInteractionHandle({
            group, W, D,
            doorLocalZ: frontZ,
            buildingName: 'wugo'
        })
    };
}
