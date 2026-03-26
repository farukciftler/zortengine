import * as THREE from 'three';
import {
    addBuildingShellPhysics,
    buildRectDoorShellBoxes,
    createBuildingInteractionHandle
} from './buildingPhysics.js';
import { resources } from 'zortengine';
import { RenderSettings } from '../data/RenderSettings.js';

/**
 * NewMindBuilding — Premium Legal-Tech AI Office.
 * Boyner-level detail: 4-wall windows, facade columns, interior floor,
 * detailed workstations, server room, meeting area.
 */
export function buildNewMindBuilding(scene, physics, groundMaterial, position = [0, 0, 0]) {
    const [px, , pz] = position;
    const group = new THREE.Group();

    // ── Dimensions ───────────────────────────────────────────────────────────
    const W = 16;
    const H = 7;
    const D = 12;
    const WALL_T = 0.4;
    const FLOOR_Y = 0.011;

    // ── Palette ───────────────────────────────────────────────────────────────
    const navyMat = resources.getMaterial('newmind_navy', () => new THREE.MeshStandardMaterial({ color: 0x0d47a1, roughness: 0.35, metalness: 0.15 }));
    const marbleMat = resources.getMaterial('newmind_marble', () => new THREE.MeshStandardMaterial({ color: 0xeceff1, roughness: 0.4 }));
    const darkMat = resources.getMaterial('dark_navy', () => new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7, metalness: 0.1 }));
    const goldAccent = resources.getMaterial('newmind_gold', () => new THREE.MeshStandardMaterial({ color: 0xffc107, emissive: 0x996600, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.5 }));
    const glassMat = resources.getMaterial('newmind_glass', () => new THREE.MeshStandardMaterial({
        color: 0x90caf9, transparent: true, opacity: 0.25,
        roughness: 0.05, metalness: 0.5, side: THREE.DoubleSide, depthWrite: false
    }));
    const frameMat = resources.getMaterial('dark_frame', () => new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.4, metalness: 0.8 }));
    const steelMat = resources.getMaterial('shared_steel', () => new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.85, roughness: 0.15 }));
    const woodMat = resources.getMaterial('newmind_wood', () => new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.7 }));
    const colMat = resources.getMaterial('newmind_column', () => new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.4, metalness: 0.4 }));
    const screenMat = resources.getMaterial('monitor_screen', () => new THREE.MeshStandardMaterial({ color: 0x0a1628, emissive: 0x0d47a1, emissiveIntensity: 0.7, roughness: 0.1 }));
    const chairMat = resources.getMaterial('office_chair', () => new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.8 }));
    const rackGlow = resources.getMaterial('server_glow', () => new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 1.2 }));
    const intFloorMat = resources.getMaterial('newmind_floor', () => new THREE.MeshStandardMaterial({ color: 0xe8eaf6, roughness: 0.3 }));
    const handleMat = resources.getMaterial('gold_handle', () => new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 }));

    // ── Helpers ───────────────────────────────────────────────────────────────
    const add = (mesh, shadow = true) => {
        if (shadow) { 
            mesh.castShadow = RenderSettings.policy.cast.buildings; 
            mesh.receiveShadow = RenderSettings.policy.receive.buildings; 
        }
        group.add(mesh);
        return mesh;
    };
    const box = (w, h, d, mat, x, y, z) => {
        const m = new THREE.Mesh(resources.getBox(w, h, d), mat);
        m.position.set(x, y, z);
        return add(m);
    };
    const cyl = (rt, rb, h, mat, x, y, z, segs = 12) => {
        const m = new THREE.Mesh(resources.getCylinder(rt, rb, h, segs), mat);
        m.position.set(x, y, z);
        return add(m);
    };

    // ── Interior Floor ───────────────────────────────────────────────────────
    const floor = new THREE.Mesh(resources.getPlane(W + WALL_T * 2, D + WALL_T * 2), intFloorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR_Y, 0);
    add(floor);

    const frontZ = -(D / 2) - WALL_T / 2;
    const backZ = (D / 2) + WALL_T / 2;
    const leftX = -(W / 2) - WALL_T / 2;
    const rightX = (W / 2) + WALL_T / 2;

    // ── FRONT WALL — Law Firm Storefront ─────────────────────────────────────
    const doorW = 3.0;
    const doorH = H - 0.4;
    box(3.5, H, WALL_T, marbleMat, -(W / 2) + 1.75, H / 2, frontZ);
    box(3.5, H, WALL_T, marbleMat, (W / 2) - 1.75, H / 2, frontZ);
    box(0.5, H, WALL_T, marbleMat, -doorW / 2 - 0.25, H / 2, frontZ);
    box(0.5, H, WALL_T, marbleMat, doorW / 2 + 0.25, H / 2, frontZ);

    // Front Windows with full frame system
    const winH = H - 1.6;
    const winY = 0.8 + winH / 2;
    const addWindowFrame = (cx, cy, cz, fw, fh) => {
        [[-fw / 2, 0], [fw / 2, 0]].forEach(([ox]) =>
            box(WALL_T * 0.5, fh, WALL_T * 0.4, frameMat, cx + ox, cy, cz));
        [0, fh / 2, -fh / 2].forEach(oy =>
            box(fw, WALL_T * 0.5, WALL_T * 0.4, frameMat, cx, cy + oy, cz));
        box(WALL_T * 0.4, fh, WALL_T * 0.4, frameMat, cx, cy, cz);
    };
    [-5.5, 5.5].forEach(cx => {
        const g = new THREE.Mesh(resources.getPlane(3.8, winH), glassMat);
        g.position.set(cx, winY, frontZ - 0.01);
        add(g, false);
        addWindowFrame(cx, winY, frontZ - 0.05, 3.95, winH + 0.15);
    });

    // ── BACK WALL ────────────────────────────────────────────────────────────
    box(W, H * 0.55, WALL_T, marbleMat, 0, H * 0.55 / 2, backZ);
    box(W, H * 0.25, WALL_T, marbleMat, 0, H - H * 0.25 / 2, backZ);
    const backGlass = new THREE.Mesh(resources.getPlane(W - 2, H * 0.2), glassMat);
    backGlass.rotation.y = Math.PI;
    backGlass.position.set(0, H * 0.55 + H * 0.1, backZ + 0.01);
    add(backGlass, false);
    box(W, 0.1, WALL_T * 0.4, frameMat, 0, H * 0.55, backZ + 0.02);
    box(W, 0.1, WALL_T * 0.4, frameMat, 0, H * 0.55 + H * 0.2, backZ + 0.02);

    // ── LEFT WALL (with windows) ─────────────────────────────────────────────
    box(WALL_T, 1.0, D, marbleMat, leftX, 0.5, 0);
    box(WALL_T, 1.2, D, marbleMat, leftX, H - 0.6, 0);
    box(WALL_T, H, 1.0, marbleMat, leftX, H / 2, -(D / 2) + 0.5);
    box(WALL_T, H, 1.0, marbleMat, leftX, H / 2, (D / 2) - 0.5);
    box(WALL_T, H, 0.6, marbleMat, leftX, H / 2, 0);
    const sideWinH = H - 2.2;
    const sideWinW = (D - 4) / 2 - 0.3;
    [-3.2, 3.2].forEach(zo => {
        const sg = new THREE.Mesh(resources.getPlane(sideWinW, sideWinH), glassMat);
        sg.rotation.y = Math.PI / 2;
        sg.position.set(leftX - 0.01, 1.0 + sideWinH / 2, zo);
        add(sg, false);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, leftX, 1.0, zo);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, leftX, 1.0 + sideWinH, zo);
    });

    // ── RIGHT WALL (with windows) ────────────────────────────────────────────
    box(WALL_T, 1.0, D, marbleMat, rightX, 0.5, 0);
    box(WALL_T, 1.2, D, marbleMat, rightX, H - 0.6, 0);
    box(WALL_T, H, 1.0, marbleMat, rightX, H / 2, -(D / 2) + 0.5);
    box(WALL_T, H, 1.0, marbleMat, rightX, H / 2, (D / 2) - 0.5);
    box(WALL_T, H, 0.6, marbleMat, rightX, H / 2, 0);
    [-3.2, 3.2].forEach(zo => {
        const sg = new THREE.Mesh(resources.getPlane(sideWinW, sideWinH), glassMat);
        sg.rotation.y = -Math.PI / 2;
        sg.position.set(rightX + 0.01, 1.0 + sideWinH / 2, zo);
        add(sg, false);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, rightX, 1.0, zo);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, rightX, 1.0 + sideWinH, zo);
    });

    // ── DOOR GROUP ───────────────────────────────────────────────────────────
    const doorGroup = new THREE.Group();
    doorGroup.position.set(-doorW / 2, 0, frontZ);
    group.add(doorGroup);

    const doorGlass = new THREE.Mesh(resources.getPlane(doorW, doorH), glassMat);
    doorGlass.position.set(doorW / 2, doorH / 2 + 0.1, 0.04);
    doorGroup.add(doorGlass);

    const doorFrameGeo = resources.getBox(0.12, doorH, WALL_T * 0.5);
    const df1 = new THREE.Mesh(doorFrameGeo, frameMat);
    df1.position.set(0, doorH / 2 + 0.1, 0); doorGroup.add(df1);
    const df2 = new THREE.Mesh(doorFrameGeo, frameMat);
    df2.position.set(doorW, doorH / 2 + 0.1, 0); doorGroup.add(df2);
    const topDoorF = new THREE.Mesh(resources.getBox(doorW + 0.12, 0.12, WALL_T * 0.5), frameMat);
    topDoorF.position.set(doorW / 2, doorH + 0.1, 0); doorGroup.add(topDoorF);

    // Gold handle
    const hBar = new THREE.Mesh(resources.getCylinder(0.04, 0.04, 0.6, 8), handleMat);
    hBar.position.set(doorW - 0.2, 1.2, 0.12);
    hBar.rotation.z = Math.PI / 2;
    doorGroup.add(hBar);

    box(doorW + 0.25, 0.15, WALL_T * 0.6, frameMat, 0, doorH + 0.15, frontZ);

    // ── DECORATIVE COLUMNS ───────────────────────────────────────────────────
    [-7, -3.2, 3.2, 7].forEach(cx => {
        const col = new THREE.Mesh(resources.getCylinder(0.22, 0.26, H + 0.4, 10), colMat);
        col.position.set(cx, (H + 0.4) / 2, frontZ - 0.22);
        col.castShadow = true;
        group.add(col);
        const cap = new THREE.Mesh(resources.getCylinder(0.32, 0.22, 0.2, 10), colMat);
        cap.position.set(cx, H + 0.5, frontZ - 0.22);
        group.add(cap);
    });

    // ── ROOF SLAB + PARAPET ──────────────────────────────────────────────────
    box(W + WALL_T * 2 + 0.2, 0.35, D + WALL_T * 2 + 0.2, darkMat, 0, H + 0.17, 0);
    const pH = 0.9;
    box(W + WALL_T * 2 + 0.6, pH + 0.3, WALL_T, goldAccent, 0, H + 0.35 + (pH + 0.3) / 2, frontZ - 0.1);
    box(W + WALL_T * 2 + 0.6, pH, WALL_T, goldAccent, 0, H + 0.35 + pH / 2, backZ + 0.1);
    box(WALL_T, pH, D + WALL_T * 2 + 0.6, goldAccent, leftX - 0.05, H + 0.35 + pH / 2, 0);
    box(WALL_T, pH, D + WALL_T * 2 + 0.6, goldAccent, rightX + 0.05, H + 0.35 + pH / 2, 0);

    // HVAC
    box(2, 1.0, 1.4, steelMat, -4, H + 0.8, 3);
    cyl(0.35, 0.3, 0.5, steelMat, -4, H + 1.55, 3, 8);

    // ── ROOF SIGN ────────────────────────────────────────────────────────────
    const signY = H + 0.35 + pH + 0.3 + 0.9;
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 200;
    const sCtx = signCanvas.getContext('2d');
    sCtx.save(); sCtx.translate(1024, 0); sCtx.scale(-1, 1);
    sCtx.fillStyle = '#0d47a1';
    sCtx.fillRect(0, 0, 1024, 200);
    sCtx.fillStyle = '#ffc107';
    sCtx.font = 'bold 120px Arial';
    sCtx.textAlign = 'center'; sCtx.textBaseline = 'middle';
    sCtx.fillText('NEWMIND.AI', 512, 100);
    sCtx.restore();
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signBoard = new THREE.Mesh(
        resources.getPlane(W - 1, 1.8),
        new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, signY, frontZ - 0.25);
    group.add(signBoard);
    box(W, 2.0, 0.18, goldAccent, 0, signY, frontZ - 0.14);

    // ── INTERIOR ─────────────────────────────────────────────────────────────

    // Workstation helper (Inveon quality)
    const addWorkstation = (x, z, ry = 0) => {
        const wg = new THREE.Group();
        // Desk
        const desk = new THREE.Mesh(resources.getBox(1.6, 0.06, 0.75), woodMat);
        desk.position.y = 0.78; wg.add(desk);
        // Legs
        [[-0.7, -0.32], [0.7, -0.32], [-0.7, 0.32], [0.7, 0.32]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(resources.getBox(0.05, 0.78, 0.05), steelMat);
            leg.position.set(lx, 0.39, lz); wg.add(leg);
        });
        // Monitor
        const mon = new THREE.Mesh(resources.getBox(0.7, 0.42, 0.05), screenMat);
        mon.position.set(0, 1.24, -0.2); wg.add(mon);
        const bezel = new THREE.Mesh(resources.getBox(0.74, 0.46, 0.03), resources.getMaterial('bezel_dark', () => new THREE.MeshStandardMaterial({ color: 0x1c1c1c })));
        bezel.position.set(0, 1.24, -0.17); wg.add(bezel);
        // Keyboard
        const kb = new THREE.Mesh(resources.getBox(0.52, 0.02, 0.18), frameMat);
        kb.position.set(0, 0.815, 0.1); wg.add(kb);
        // Chair
        const seat = new THREE.Mesh(resources.getBox(0.52, 0.07, 0.5), chairMat);
        seat.position.set(0, 0.52, 0.48); wg.add(seat);
        const back = new THREE.Mesh(resources.getBox(0.5, 0.6, 0.07), chairMat);
        back.position.set(0, 0.88, 0.26); wg.add(back);

        wg.position.set(x, 0, z);
        wg.rotation.y = ry;
        group.add(wg);
    };

    // Workstation rows
    addWorkstation(-5.5, -2);
    addWorkstation(-2.8, -2);
    addWorkstation(0, -2);
    addWorkstation(2.8, -2);
    addWorkstation(5.5, -2);
    addWorkstation(-5.5, 0, Math.PI);
    addWorkstation(-2.8, 0, Math.PI);
    addWorkstation(0, 0, Math.PI);
    addWorkstation(2.8, 0, Math.PI);
    addWorkstation(5.5, 0, Math.PI);

    // Server Rack (back-right corner)
    const addServerRack = (x, z) => {
        const rack = new THREE.Group();
        const cab = new THREE.Mesh(resources.getBox(0.8, 2.0, 0.6), darkMat);
        cab.position.y = 1.0; rack.add(cab);
        for (let su = 0; su < 8; su++) {
            const unit = new THREE.Mesh(resources.getBox(0.72, 0.18, 0.05), darkMat);
            unit.position.set(0, 0.2 + su * 0.22, 0.28); rack.add(unit);
            const led = new THREE.Mesh(resources.getBox(0.04, 0.04, 0.02),
                su % 3 === 0 ? rackGlow : resources.getMaterial('server_orange', () => new THREE.MeshStandardMaterial({ color: 0xffa726, emissive: 0xffa726, emissiveIntensity: 1.0 })));
            led.position.set(0.32, 0.2 + su * 0.22, 0.31); rack.add(led);
        }
        rack.position.set(x, 0, z);
        group.add(rack);
    };
    addServerRack(rightX - 1.2, backZ - 1.5);
    addServerRack(rightX - 2.2, backZ - 1.5);

    // Whiteboard on back wall
    const wb = new THREE.Mesh(resources.getBox(4, 1.8, 0.06), resources.getMaterial('whiteboard_02', () => new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6 })));
    wb.position.set(-2, 4, backZ - WALL_T - 0.05);
    group.add(wb);
    box(4.1, 0.08, 0.1, frameMat, -2, 3.1, backZ - WALL_T - 0.06);
    box(4.1, 0.08, 0.1, frameMat, -2, 4.9, backZ - WALL_T - 0.06);

    // Meeting Table (center-back)
    box(4, 0.06, 2, woodMat, 0, 0.82, 3.5);
    [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].forEach(([lx, lz]) => {
        box(0.07, 0.82, 0.07, steelMat, lx * 2, 0.41, 3.5 + lz * 2);
    });

    // ── POSITION + PHYSICS ──────────────────────────────────────────────────
    group.rotation.y = -Math.PI / 2;
    group.position.set(px, 0, pz);
    scene.add(group);

    if (physics && groundMaterial) {
        const boxes = buildRectDoorShellBoxes({ W, D, H, wallT: WALL_T, doorW, lintel: 'boyner' });
        // Interior colliders
        boxes.push({ x: 0, y: 0.4, z: -2, w: 12.5, h: 0.8, d: 0.8 }); // Row 1
        boxes.push({ x: 0, y: 0.4, z: 0, w: 12.5, h: 0.8, d: 0.8 }); // Row 2
        boxes.push({ x: 0, y: 0.45, z: 3.5, w: 4, h: 0.9, d: 2 }); // Table
        boxes.push({ x: rightX - 1.7, y: 1.0, z: backZ - 1.5, w: 2.0, h: 2.0, d: 0.6 }); // Servers
        addBuildingShellPhysics(physics, groundMaterial, group, boxes);
    }

    return {
        group,
        doorGroup,
        id: 'newmind',
        interaction: createBuildingInteractionHandle({
            group, W, D,
            doorLocalZ: frontZ,
            buildingName: 'newmind',
            doorOpenDistance: 5
        })
    };
}
