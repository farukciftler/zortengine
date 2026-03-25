import * as THREE from 'three';
import {
    addBuildingShellPhysics,
    buildRectDoorShellBoxes,
    createBuildingInteractionHandle
} from './buildingPhysics.js';
import { resources } from './ResourceLibrary.js';

/**
 * InveonBuilding — 4-walled software development office.
 *
 * Structure:
 *  - Modern concrete + glass facade (more glass than Boyner)
 *  - Full-height curtain-wall glass front
 *  - Interior: workstations, monitors, chairs, server rack, whiteboard, coffee corner
 *  - Flat roof with HVAC unit
 *  - Roof parapet + lit "INVEON" sign (canvas mirrored, group.rotation.y = -PI/2)
 */
export function buildInveonBuilding(scene, physics, groundMaterial, position = [0, 0, 0]) {
    const [px, , pz] = position;
    const group = new THREE.Group();

    // ── Dimensions ───────────────────────────────────────────────────────────
    const W = 18;
    const H = 8;
    const D = 14;
    const T = 0.35; // wall thickness
    const FLOOR_Y = 0.011;

    // ── Palette ───────────────────────────────────────────────────────────────
    const concreteMat = resources.getMaterial('concrete_gray', () => new THREE.MeshStandardMaterial({ color: 0xd0cec8, roughness: 0.85, metalness: 0.05 }));
    const darkConcrete = resources.getMaterial('dark_concrete', () => new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.9, metalness: 0.05 }));
    const accentMat = resources.getMaterial('inveon_accent', () => new THREE.MeshStandardMaterial({
        color: 0x1565c0, emissive: 0x0d3b7a, emissiveIntensity: 0.35,
        roughness: 0.3, metalness: 0.4
    }));
    const steelMat = resources.getMaterial('shared_steel', () => new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.3, metalness: 0.9 }));
    const glassMat = resources.getMaterial('shared_glass', () => new THREE.MeshStandardMaterial({
        color: 0xaed6f1, transparent: true, opacity: 0.22,
        roughness: 0.05, metalness: 0.6, side: THREE.DoubleSide, depthWrite: false
    }));
    const glassDark = resources.getMaterial('inveon_glass_dark', () => new THREE.MeshStandardMaterial({
        color: 0x2c3e50, transparent: true, opacity: 0.35,
        roughness: 0.05, metalness: 0.7, side: THREE.DoubleSide, depthWrite: false
    }));
    const frameMat = resources.getMaterial('dark_frame', () => new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.4, metalness: 0.85 }));
    const woodMat = resources.getMaterial('furniture_wood', () => new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.75 }));
    const whiteboardM = resources.getMaterial('whiteboard', () => new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6 }));
    const screenMat = resources.getMaterial('monitor_screen', () => new THREE.MeshStandardMaterial({
        color: 0x0a1628, emissive: 0x1565c0, emissiveIntensity: 0.7, roughness: 0.1
    }));
    const chairMat = resources.getMaterial('office_chair', () => new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.8, metalness: 0.2 }));
    const keyboardMat = resources.getMaterial('keyboard', () => new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.85 }));
    const tileMat = resources.getMaterial('inveon_floor', () => new THREE.MeshStandardMaterial({ color: 0xe8eaf6, roughness: 0.25, metalness: 0.1 }));

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
    const cyl = (rt, rb, h, mat, x, y, z, segs = 12) => {
        const m = new THREE.Mesh(resources.getCylinder(rt, rb, h, segs), mat);
        m.position.set(x, y, z);
        return add(m);
    };

    const frontZ = -(D / 2) - T / 2;
    const backZ  =  (D / 2) + T / 2;
    const leftX  = -(W / 2) - T / 2 - 0.01; // Tiny nudge to prevent Z-fighting at corners
    const rightX =  (W / 2) + T / 2 + 0.01;

    // ── FLOOR — Flush with plaza (y=0.01) ───────────────────────────────────
    const floorGeo = resources.getPlane(W + T * 2, D + T * 2);
    const floor = new THREE.Mesh(floorGeo, tileMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR_Y, 0); 
    add(floor);


    // ── FRONT WALL — curtain glass wall with column grid ─────────────────────
    // Structural columns dividing the facade into bays
    const colSpacing = W / 3;
    for (let i = -1; i <= 1; i++) {
        if (i === 0) continue; // Don't put a column in front of the door at x=0
        box(0.5, H, T * 1.2, concreteMat, i * colSpacing, H / 2, frontZ);
    }
    // Left and right edge columns (widened to penetrate side walls and avoid flickering)
    box(0.7, H, T * 1.2, concreteMat, -(W / 2) + 0.15, H / 2, frontZ);
    box(0.7, H, T * 1.2, concreteMat,  (W / 2) - 0.15, H / 2, frontZ);

    // Horizontal spandrel bands (SPLIT sill to clear door)
    box(W * 0.35, 0.4, T, darkConcrete, -W * 0.325, 0.2, frontZ); // Sill Left
    box(W * 0.35, 0.4, T, darkConcrete,  W * 0.325, 0.2, frontZ); // Sill Right
    box(W + T * 2, 0.6, T, darkConcrete, 0, H - 0.3, frontZ); // lintel
    box(W + T * 2, 0.3, T, darkConcrete, 0, H / 2, frontZ);   // mid spandrel

    // Glass panels per bay (skip middle bay for door)
    const bayW = colSpacing - 0.55;
    const bayOffsets = [-colSpacing, colSpacing];
    bayOffsets.forEach(bx => {
        // Lower glass panel
        const lg = new THREE.Mesh(resources.getPlane(bayW, H / 2 - 0.65), glassMat);
        lg.position.set(bx, H / 4 + 0.4, frontZ - 0.02);
        lg.name = 'window_glow';
        add(lg, false);
        // Upper glass panel
        const ug = new THREE.Mesh(resources.getPlane(bayW, H / 2 - 0.6), glassDark);
        ug.position.set(bx, H * 0.75 - 0.15, frontZ - 0.02);
        ug.name = 'window_glow';
        add(ug, false);
        // Vertical steel mullions
        box(0.06, H, 0.08, frameMat, bx - bayW / 2, H / 2, frontZ - 0.04);
        box(0.06, H, 0.08, frameMat, bx + bayW / 2, H / 2, frontZ - 0.04);
        // Horizontal transom
        box(bayW, 0.06, 0.08, frameMat, bx, H / 2, frontZ - 0.04);
    });

    // ── DOUBLE DOOR GROUP ────────────────────────────────────────────────────
    const doorH = 3.6; // Increased to compensate lowering
    const doorW = 3.2; 
    
    // Left Door Pivot
    const doorL = new THREE.Group();
    doorL.position.set(-(doorW / 2), 0, frontZ);
    group.add(doorL);
    
    // Right Door Pivot
    const doorR = new THREE.Group();
    doorR.position.set( (doorW / 2), 0, frontZ);
    group.add(doorR);

    // Door glass panels (centered on pivots)
    const dlMesh = new THREE.Mesh(resources.getPlane(doorW / 2, doorH), glassMat);
    dlMesh.position.set(doorW / 4, doorH / 2, 0.05);
    doorL.add(dlMesh);

    const drMesh = new THREE.Mesh(resources.getPlane(doorW / 2, doorH), glassMat);
    drMesh.position.set(-(doorW / 4), doorH / 2, 0.05);
    doorR.add(drMesh);

    // Frame on doors
    const dFrame = new THREE.Mesh(resources.getBox(0.08, doorH, 0.1), frameMat);
    dFrame.position.y = doorH / 2;
    doorL.add(dFrame.clone());
    doorR.add(dFrame.clone());

    // Push bars
    const pushBarL = new THREE.Mesh(resources.getCylinder(0.03, 0.03, 0.5, 8), steelMat);
    pushBarL.rotation.z = Math.PI / 2;
    pushBarL.position.set(doorW / 4, 1.1, 0.1);
    doorL.add(pushBarL);

    const pushBarR = pushBarL.clone();
    pushBarR.position.set(-(doorW / 4), 1.1, 0.1);
    doorR.add(pushBarR);

    // Fixed frame above
    box(doorW + 0.15, 0.15, 0.12, frameMat, 0, doorH + 0.47, frontZ - 0.04);


    // ── BACK WALL — mostly solid concrete ────────────────────────────────────
    box(W, H, T, concreteMat, 0, H / 2, backZ);
    // Single high strip window
    const bwg = new THREE.Mesh(resources.getPlane(W - 3, 1.4), glassDark);
    bwg.rotation.y = Math.PI;
    bwg.position.set(0, H - 1.4, backZ + 0.02);
    bwg.name = 'window_glow';
    add(bwg, false);
    // Blank wall over/under strip — already covered by base wall

    // ── LEFT WALL ─────────────────────────────────────────────────────────────
    box(T, H, D, concreteMat, leftX, H / 2, 0);
    // Two windows
    [-D / 4, D / 4].forEach(zo => {
        const sg = new THREE.Mesh(resources.getPlane(3.5, 2.2), glassDark);
        sg.rotation.y = Math.PI / 2;
        sg.position.set(leftX - 0.02, H * 0.6, zo);
        add(sg, false);
        box(T * 0.4, 0.08, 3.5, frameMat, leftX, H * 0.6 - 1.1, zo);
        box(T * 0.4, 0.08, 3.5, frameMat, leftX, H * 0.6 + 1.1, zo);
        box(T * 0.4, 2.2, 0.06, frameMat, leftX, H * 0.6, zo - 1.75);
        box(T * 0.4, 2.2, 0.06, frameMat, leftX, H * 0.6, zo + 1.75);
    });

    // ── RIGHT WALL ────────────────────────────────────────────────────────────
    box(T, H, D, concreteMat, rightX, H / 2, 0);
    [-D / 4, D / 4].forEach(zo => {
        const sg = new THREE.Mesh(resources.getPlane(3.5, 2.2), glassDark);
        sg.rotation.y = -Math.PI / 2;
        sg.position.set(rightX + 0.02, H * 0.6, zo);
        add(sg, false);
        box(T * 0.4, 0.08, 3.5, frameMat, rightX, H * 0.6 - 1.1, zo);
        box(T * 0.4, 0.08, 3.5, frameMat, rightX, H * 0.6 + 1.1, zo);
        box(T * 0.4, 2.2, 0.06, frameMat, rightX, H * 0.6, zo - 1.75);
        box(T * 0.4, 2.2, 0.06, frameMat, rightX, H * 0.6, zo + 1.75);
    });

    // ── ROOFTOP DESIGN ──────────────────────────────────────────────────────
    const roofY = H + 0.4;
    box(W + T * 2 + 0.3, 0.4, D + T * 2 + 0.3, darkConcrete, 0, H + 0.2, 0);

    // Modern Industrial HVAC
    const createHvac = (x, z) => {
        const hg = new THREE.Group();
        box(2.5, 1.2, 1.8, concreteMat, 0, 0.6, 0).parent = hg;
        cyl(0.8, 0.7, 0.4, steelMat, 0, 1.4, 0).parent = hg; // Fan vent
        box(0.1, 0.1, 0.1, resources.getMaterial('safety_red', () => new THREE.MeshBasicMaterial({ color: 0xff0000 })), 0, 1.6, 0).parent = hg; // Safety light
        hg.position.set(x, roofY, z);
        group.add(hg);
    };
    createHvac(-4.5, 3);
    createHvac(4.5, 3);

    // Solar Panel Array (Sustainable Tech)
    const solarMat = resources.getMaterial('solar_panel', () => new THREE.MeshStandardMaterial({ color: 0x1a237e, metalness: 0.8, roughness: 0.1 }));
    for (let x = -5; x <= 5; x += 2.5) {
        for (let z = -2.5; z <= 0; z += 1.5) {
            const p = new THREE.Mesh(resources.getPlane(2, 1.2), solarMat);
            p.rotation.x = -Math.PI / 6; // Angled
            p.position.set(x, roofY + 0.5, z);
            add(p);
            // Support legs
            box(0.05, 0.6, 0.05, steelMat, x, roofY + 0.2, z);
        }
    }

    // Safety Beacons (Red glowing lights)
    const addBeacon = (x, z) => {
        const b = new THREE.Mesh(resources.getMaterial('shared_sphere_015', () => new THREE.SphereGeometry(0.15, 8, 8)), resources.getMaterial('safety_red', () => new THREE.MeshBasicMaterial({ color: 0xff0000 })));
        b.position.set(x, roofY + 1.2, z);
        add(b);
        // Base pole
        box(0.08, 1.2, 0.08, steelMat, x, roofY + 0.6, z);
    };
    addBeacon(leftX + 0.5, backZ - 0.5);
    addBeacon(rightX - 0.5, backZ - 0.5);

    // ── PARAPET ───────────────────────────────────────────────────────────────
    const pH = 0.8;
    // Front (taller for sign backing)
    box(W + T * 2 + 0.6, pH + 0.5, T, accentMat, 0, H + 0.4 + (pH + 0.5) / 2, frontZ - 0.1);
    box(W + T * 2 + 0.6, pH, T, accentMat, 0, H + 0.4 + pH / 2, backZ + 0.1);
    box(T, pH, D + T * 2 + 0.6, accentMat, leftX - 0.05, H + 0.4 + pH / 2, 0);
    box(T, pH, D + T * 2 + 0.6, accentMat, rightX + 0.05, H + 0.4 + pH / 2, 0);

    // ── "INVEON" SIGN — canvas yatay aynalı (group -90° ile okunur yüz, Boyner ile aynı mantık)
    const signY = H + 0.4 + pH + 0.5 + 0.85;
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 210;
    const sc = signCanvas.getContext('2d');
    sc.save();
    sc.translate(1024, 0);
    sc.scale(-1, 1);
    // Background
    sc.fillStyle = '#1565c0';
    sc.fillRect(0, 0, 1024, 210);
    // Subtle grid pattern
    sc.strokeStyle = 'rgba(255,255,255,0.07)';
    sc.lineWidth = 1;
    for (let gx = 0; gx < 1024; gx += 40) {
        sc.beginPath(); sc.moveTo(gx, 0); sc.lineTo(gx, 210); sc.stroke();
    }
    for (let gy = 0; gy < 210; gy += 40) {
        sc.beginPath(); sc.moveTo(0, gy); sc.lineTo(1024, gy); sc.stroke();
    }
    sc.fillStyle = '#ffffff';
    sc.font = 'bold 120px Arial';
    sc.textAlign = 'center';
    sc.textBaseline = 'middle';
    sc.fillText('INVEON', 512, 105);
    // Underline accent
    sc.strokeStyle = '#64b5f6';
    sc.lineWidth = 5;
    sc.beginPath(); sc.moveTo(150, 170); sc.lineTo(874, 170); sc.stroke();
    sc.restore();

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signBoard = new THREE.Mesh(
        resources.getPlane(W - 1, 2.0),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide })
    );
    // Boyner ile aynı: canvas aynalı, ekstra rotation yok (metin düz okunur)
    signBoard.position.set(0, signY, frontZ - 0.24);
    group.add(signBoard);
    // Backing panel (depth 0.2, center at 0.12 means face is at 0.22)
    box(W, 2.2, 0.2, accentMat, 0, signY, frontZ - 0.12);

    // ── INTERIOR FURNISHINGS ──────────────────────────────────────────────────

    // ── Helper: single workstation (desk + monitor + keyboard + chair) ─────────
    const addWorkstation = (x, z, ry = 0) => {
        const wg = new THREE.Group();

        // Desk surface
        const desk = new THREE.Mesh(resources.getBox(1.6, 0.06, 0.75), woodMat);
        desk.position.y = 0.78;
        wg.add(desk);

        // Desk legs (metal trestle style)
        [[-0.7, -0.32], [0.7, -0.32], [-0.7, 0.32], [0.7, 0.32]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(resources.getBox(0.05, 0.78, 0.05), steelMat);
            leg.position.set(lx, 0.39, lz);
            wg.add(leg);
        });

        // Monitor base
        const monBase = new THREE.Mesh(resources.getBox(0.25, 0.03, 0.2), steelMat);
        monBase.position.set(0, 0.82, -0.2);
        wg.add(monBase);
        // Monitor stand
        const monStand = new THREE.Mesh(resources.getBox(0.04, 0.28, 0.04), steelMat);
        monStand.position.set(0, 0.95, -0.2);
        wg.add(monStand);
        // Monitor screen
        const monScreen = new THREE.Mesh(resources.getBox(0.7, 0.42, 0.05), screenMat);
        monScreen.position.set(0, 1.24, -0.2);
        monScreen.name = 'screen_glow';
        wg.add(monScreen);
        // Screen bezel
        const bezel = new THREE.Mesh(resources.getBox(0.74, 0.46, 0.03),
            resources.getMaterial('bezel_dark', () => new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 })));
        bezel.position.set(0, 1.24, -0.17);
        wg.add(bezel);

        // Second monitor (dual setup, at an angle)
        const mon2 = new THREE.Mesh(resources.getBox(0.6, 0.36, 0.05), screenMat);
        mon2.position.set(0.52, 1.22, -0.16);
        mon2.rotation.y = -0.3;
        wg.add(mon2);
        const bezel2 = new THREE.Mesh(resources.getBox(0.64, 0.4, 0.03),
            resources.getMaterial('bezel_dark', () => new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7 })));
        bezel2.position.set(0.52, 1.22, -0.13);
        bezel2.rotation.y = -0.3;
        wg.add(bezel2);

        // Keyboard
        const kb = new THREE.Mesh(resources.getBox(0.52, 0.02, 0.18), keyboardMat);
        kb.position.set(-0.1, 0.815, 0.1);
        wg.add(kb);

        // Mouse
        const mouse = new THREE.Mesh(resources.getMaterial('mouse_geo', () => new THREE.SphereGeometry(0.04, 8, 6)), steelMat);
        mouse.scale.set(1, 0.5, 1.4);
        mouse.position.set(0.28, 0.815, 0.1);
        wg.add(mouse);

        // Coffee mug
        const mug = new THREE.Mesh(resources.getCylinder(0.05, 0.04, 0.1, 10),
            resources.getMaterial('shared_mug_red', () => new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.8 })));
        mug.position.set(-0.55, 0.84, 0.05);
        wg.add(mug);

        // Office chair
        const cg = new THREE.Group();
        // Seat
        const seat = new THREE.Mesh(resources.getBox(0.52, 0.07, 0.5), chairMat);
        seat.position.y = 0.52;
        cg.add(seat);
        // Backrest
        const back = new THREE.Mesh(resources.getBox(0.5, 0.6, 0.07), chairMat);
        back.position.set(0, 0.88, -0.22);
        cg.add(back);
        // Central pole
        const cpole = new THREE.Mesh(resources.getCylinder(0.04, 0.04, 0.52, 8), steelMat);
        cpole.position.y = 0.26;
        cg.add(cpole);
        // 5-star base with wheels
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const arm = new THREE.Mesh(resources.getBox(0.35, 0.03, 0.05), steelMat);
            arm.position.set(Math.cos(angle) * 0.17, 0.04, Math.sin(angle) * 0.17);
            arm.rotation.y = angle;
            cg.add(arm);
            const wheel = new THREE.Mesh(resources.getCylinder(0.035, 0.035, 0.04, 8), chairMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(Math.cos(angle) * 0.32, 0.04, Math.sin(angle) * 0.32);
            cg.add(wheel);
        }
        cg.position.set(0, 0, 0.48); // pulled out from desk
        wg.add(cg);

        wg.position.set(x, 0, z);
        wg.rotation.y = ry;
        group.add(wg);
    };

    // ── Workstation rows ──────────────────────────────────────────────────────
    // Row 1 (facing front)
    addWorkstation(-5.5, -2.5);
    addWorkstation(-2.8, -2.5);
    addWorkstation( 0.0, -2.5);
    addWorkstation( 2.8, -2.5);
    addWorkstation( 5.5, -2.5);

    // Row 2 (facing back, back-to-back with row 1)
    const r2ry = Math.PI;
    addWorkstation(-5.5, -0.7, r2ry);
    addWorkstation(-2.8, -0.7, r2ry);
    addWorkstation( 0.0, -0.7, r2ry);
    addWorkstation( 2.8, -0.7, r2ry);
    addWorkstation( 5.5, -0.7, r2ry);

    // Row 3 (back area)
    addWorkstation(-4.0,  3.2);
    addWorkstation(-1.5,  3.2);
    addWorkstation( 1.5,  3.2);
    addWorkstation( 4.0,  3.2);

    // ── Whiteboard on back wall ───────────────────────────────────────────────
    const wb = new THREE.Mesh(resources.getBox(5, 2.2, 0.06), whiteboardM);
    wb.position.set(0, 4.0, backZ - T - 0.05);
    group.add(wb);
    // Whiteboard frame
    box(5.1, 0.08, 0.1, frameMat, 0, 2.9, backZ - T - 0.06);
    box(5.1, 0.08, 0.1, frameMat, 0, 5.1, backZ - T - 0.06);
    box(0.08, 2.2, 0.1, frameMat, -2.55, 4.0, backZ - T - 0.06);
    box(0.08, 2.2, 0.1, frameMat,  2.55, 4.0, backZ - T - 0.06);
    // Writing on whiteboard (canvas texture)
    const wbCanvas = document.createElement('canvas');
    wbCanvas.width = 512; wbCanvas.height = 256;
    const wbCtx = wbCanvas.getContext('2d');
    wbCtx.fillStyle = '#fafafa';
    wbCtx.fillRect(0, 0, 512, 256);
    wbCtx.fillStyle = '#1565c0';
    wbCtx.font = 'bold 28px monospace';
    wbCtx.fillText('SPRINT 47', 30, 45);
    wbCtx.strokeStyle = '#1565c0';
    wbCtx.lineWidth = 2;
    wbCtx.beginPath(); wbCtx.moveTo(30, 55); wbCtx.lineTo(200, 55); wbCtx.stroke();
    wbCtx.fillStyle = '#e53935';
    wbCtx.font = '22px monospace';
    ['☐ API refactor', '☐ Auth module', '☑ DB migration', '☑ Unit tests'].forEach((txt, i) => {
        wbCtx.fillStyle = txt.startsWith('☑') ? '#43a047' : '#333';
        wbCtx.fillText(txt, 30, 90 + i * 36);
    });
    // Arrows / diagram on right side
    wbCtx.strokeStyle = '#555';
    wbCtx.lineWidth = 2;
    wbCtx.beginPath();
    wbCtx.roundRect(300, 30, 180, 60, 8);
    wbCtx.stroke();
    wbCtx.fillStyle = '#333';
    wbCtx.font = '18px monospace';
    wbCtx.fillText('Frontend', 360, 65);
    wbCtx.beginPath();
    wbCtx.roundRect(300, 120, 180, 60, 8);
    wbCtx.stroke();
    wbCtx.fillText('Backend', 360, 155);
    wbCtx.setLineDash([4, 4]);
    wbCtx.beginPath(); wbCtx.moveTo(390, 90); wbCtx.lineTo(390, 120); wbCtx.stroke();
    wbCtx.setLineDash([]);
    const wbTex = new THREE.CanvasTexture(wbCanvas);
    const wbLabel = new THREE.Mesh(
        resources.getPlane(4.9, 2.1),
        new THREE.MeshBasicMaterial({ map: wbTex, side: THREE.DoubleSide })
    );
    wbLabel.rotation.y = Math.PI; // Face local -z (into room)
    wbLabel.position.set(0, 4.0, backZ - T - 0.09);
    group.add(wbLabel);

    // ── Server rack (right back corner) ──────────────────────────────────────
    const rackMat = resources.getMaterial('server_rack', () => new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.6, metalness: 0.5 }));
    const rackGlow = resources.getMaterial('server_glow', () => new THREE.MeshStandardMaterial({
        color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 1.2, roughness: 0.3
    }));
    const serverRack = new THREE.Group();
    // Cabinet
    const cabinet = new THREE.Mesh(resources.getBox(0.8, 2.0, 0.6), rackMat);
    cabinet.position.y = 1.0;
    serverRack.add(cabinet);
    // Server units (glowing lines)
    for (let su = 0; su < 8; su++) {
        const unit = new THREE.Mesh(resources.getBox(0.72, 0.18, 0.05), rackMat);
        unit.position.set(0, 0.2 + su * 0.22, 0.28);
        serverRack.add(unit);
        const led = new THREE.Mesh(resources.getBox(0.04, 0.04, 0.02),
            su % 3 === 0 ? rackGlow :
            resources.getMaterial('server_orange', () => new THREE.MeshStandardMaterial({ color: 0xffa726, emissive: 0xffa726, emissiveIntensity: 1.0 }))
        );
        led.position.set(0.32, 0.2 + su * 0.22, 0.31);
        serverRack.add(led);
    }
    serverRack.position.set(rightX - 1.2, 0, backZ - 1.5);
    group.add(serverRack);

    // Second rack next to it
    const rack2 = serverRack.clone();
    rack2.position.set(rightX - 2.2, 0, backZ - 1.5);
    group.add(rack2);

    // ── Coffee corner (left back) ─────────────────────────────────────────────
    // Small counter
    box(2.0, 0.06, 0.7, woodMat, leftX + 1.6, 0.98, backZ - 1.2);
    box(2.0, 0.98, 0.7, new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 }),
        leftX + 1.6, 0.49, backZ - 1.2);
    // Coffee machine (blocky)
    const cmMat = resources.getMaterial('coffee_machine', () => new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.4, metalness: 0.6 }));
    const cm = new THREE.Group();
    const cmBody = new THREE.Mesh(resources.getBox(0.35, 0.42, 0.3), cmMat);
    cmBody.position.y = 0.21;
    cm.add(cmBody);
    const cmDrip = new THREE.Mesh(resources.getCylinder(0.04, 0.04, 0.15, 8), steelMat);
    cmDrip.position.set(0, 0.18, 0.18);
    cm.add(cmDrip);
    const cmLight = new THREE.Mesh(resources.getCylinder(0.025, 0.025, 0.02, 8),
        resources.getMaterial('shared_cyan_glow', () => new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2.0 })));
    cmLight.position.set(0.1, 0.38, 0.16);
    cm.add(cmLight);
    cm.position.set(leftX + 0.9, 1.01, backZ - 1.05);
    group.add(cm);
    // Mugs on counter
    [0, 1, 2].forEach(i => {
        const mugColors = [0xe53935, 0x1565c0, 0x388e3c];
        const mug2 = new THREE.Mesh(
            resources.getCylinder(0.05, 0.04, 0.1, 10),
            resources.getMaterial('shared_mug_' + mugColors[i], () => new THREE.MeshStandardMaterial({ color: mugColors[i], roughness: 0.8 }))
        );
        mug2.position.set(leftX + 1.8 + i * 0.18, 1.07, backZ - 1.25);
        group.add(mug2);
    });

    // ── Reception/front desk near entrance ───────────────────────────────────
    const recMat = resources.getMaterial('inveon_rec_desk', () => new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.5, metalness: 0.4 }));
    // L-shaped desk
    box(3.5, 0.06, 0.75, recMat, 0, 0.92, -(D / 2) + 3.0);
    box(3.5, 0.88, 0.75, recMat, 0, 0.44, -(D / 2) + 3.0);
    // Tall front panel facing visitor
    box(3.5, 0.45, 0.08, recMat, 0, 1.16, -(D / 2) + 2.65);
    // Monitor on reception desk
    const recScreen = new THREE.Mesh(resources.getBox(0.5, 0.33, 0.04), screenMat);
    recScreen.position.set(-1.0, 1.37, -(D / 2) + 2.88);
    group.add(recScreen);
    // INVEON logo placard on reception desk front panel
    const placardCanvas = document.createElement('canvas');
    placardCanvas.width = 256; placardCanvas.height = 64;
    const pc = placardCanvas.getContext('2d');
    pc.fillStyle = '#1565c0';
    pc.fillRect(0, 0, 256, 64);
    pc.fillStyle = '#ffffff';
    pc.font = 'bold 36px Arial';
    pc.textAlign = 'center';
    pc.textBaseline = 'middle';
    pc.fillText('INVEON', 128, 32);

    const placardTex = new THREE.CanvasTexture(placardCanvas);
    const placard = new THREE.Mesh(
        resources.getPlane(1.5, 0.37),
        new THREE.MeshBasicMaterial({ map: placardTex, side: THREE.DoubleSide })
    );
    placard.rotation.y = Math.PI; // Face local -z (toward entrance)
    placard.position.set(0, 1.16, -(D / 2) + 2.61);
    group.add(placard);

    // ── POSITION + ROTATION — Boyner / Wugo ile aynı: plaza merkezine doğru +X cephe
    group.rotation.y = -Math.PI / 2;
    group.position.set(px, 0, pz);
    scene.add(group);

    if (physics && groundMaterial) {
        const boxes = buildRectDoorShellBoxes({
            W,
            D,
            H,
            wallT: T,
            doorW,
            lintel: { type: 'inveon', doorH, doorBaseY: 0 } 
        });

        // Interior Colliders
        // Reception Desk
        boxes.push({ x: 0, y: 0.44, z: -(D / 2) + 3.0, w: 3.5, h: 0.9, d: 0.8 });
        
        // Workstations - Row 1 (Grouped)
        boxes.push({ x: 0, y: 0.4, z: -2.5, w: 12.5, h: 0.8, d: 0.8 });
        // Workstations - Row 2 (Grouped)
        boxes.push({ x: 0, y: 0.4, z: -0.7, w: 12.5, h: 0.8, d: 0.8 });
        // Workstations - Row 3 (Grouped)
        boxes.push({ x: 0, y: 0.4, z: 3.2, w: 9.0, h: 0.8, d: 0.8 });

        // Server Racks
        boxes.push({ x: rightX - 1.2, y: 1.0, z: backZ - 1.5, w: 0.8, h: 2.0, d: 0.6 });
        boxes.push({ x: rightX - 2.2, y: 1.0, z: backZ - 1.5, w: 0.8, h: 2.0, d: 0.6 });

        // Coffee Counter
        boxes.push({ x: leftX + 1.6, y: 0.5, z: backZ - 1.2, w: 2.0, h: 1.0, d: 0.7 });

        addBuildingShellPhysics(physics, groundMaterial, group, boxes);
    }

    return {
        group,
        doors: [doorL, doorR],
        id: 'inveon',
        interaction: createBuildingInteractionHandle({
            group,
            W,
            D,
            doorLocalZ: frontZ,
            buildingName: 'inveon'
        })
    };
}
