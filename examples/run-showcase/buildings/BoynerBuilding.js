import * as THREE from 'three';
import {
    addBuildingShellPhysics,
    buildRectDoorShellBoxes,
    createBuildingInteractionHandle
} from './buildingPhysics.js';
import { resources } from 'zortengine';
import { RenderSettings } from '../data/RenderSettings.js';

/**
 * BoynerBuilding — 4-walled enclosed clothing store.
 * Changes:
 *  - Awning/canopy removed
 *  - Interior clothing items added (racks, mannequins, folding table)
 *  - Sign canvas horizontally flipped (group.rotation.y = -PI/2)
 */
export function buildBoynerBuilding(scene, physics, groundMaterial, position = [0, 0, 0]) {
    const [px, , pz] = position;
    const group = new THREE.Group();

    // ── Dimensions ───────────────────────────────────────────────────────────
    const W = 16;
    const H = 7;
    const D = 12;
    const WALL_T = 0.4;
    const FLOOR_Y = 0.011;

    // ── Palette ───────────────────────────────────────────────────────────────
    const brickMat = resources.getMaterial('boyner_brick', () => new THREE.MeshStandardMaterial({ color: 0xd6b896, roughness: 0.88, metalness: 0.02 }));
    const concreteMat = resources.getMaterial('concrete_gray', () => new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.9, metalness: 0.05 }));
    const darkMat = resources.getMaterial('dark_navy', () => new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7, metalness: 0.1 }));
    const accentMat = resources.getMaterial('boyner_accent', () => new THREE.MeshStandardMaterial({
        color: 0xb5161e, emissive: 0x7a0009, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.2
    }));
    const glassMat = resources.getMaterial('shared_glass', () => new THREE.MeshStandardMaterial({
        color: 0x9ecde8, transparent: true, opacity: 0.28,
        roughness: 0.05, metalness: 0.5, side: THREE.DoubleSide, depthWrite: false
    }));
    const frameMat = resources.getMaterial('dark_frame', () => new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.4, metalness: 0.8 }));
    const colMat = resources.getMaterial('boyner_column', () => new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.7 }));
    const handleMat = resources.getMaterial('gold_handle', () => new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 }));
    const woodMat = resources.getMaterial('furniture_wood', () => new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.8 }));
    const metalPole = resources.getMaterial('furniture_metal', () => new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 }));
    const intFloorMat = resources.getMaterial('boyner_floor', () => new THREE.MeshStandardMaterial({ color: 0xf4e8d0, roughness: 0.6 }));

    // ── Helper ────────────────────────────────────────────────────────────────
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

    // ── FLOOR — Flush with plaza (y=0.01) ───────────────────────────────────
    const floorGeo = resources.getPlane(W + WALL_T * 2, D + WALL_T * 2);
    const floor = new THREE.Mesh(floorGeo, intFloorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.011, 0); // Tiny offset to avoid z-fight with plaza
    add(floor);

    // ── FRONT WALL — Modern store facade ─────────────────────────────────────
    const frontZ = -(D / 2) - WALL_T / 2;
    box(3.5, H, WALL_T, brickMat, -(W / 2) + 1.75, H / 2, frontZ);
    box(3.5, H, WALL_T, brickMat,  (W / 2) - 1.75, H / 2, frontZ);
    box(0.5, H, WALL_T, brickMat, -2.5, H / 2, frontZ);
    box(0.5, H, WALL_T, brickMat,  2.5, H / 2, frontZ);
    box(3.0, 0.8, WALL_T, brickMat, 0, H - 0.4, frontZ);
    box(W, 0.8, WALL_T, brickMat, 0, H - 0.4, frontZ);

    // Front glass panels
    const winH = H - 1.6;
    const winY = 0.8 + winH / 2;
    const addPane = (x, z, w, h, ry = 0) => {
        const g = new THREE.Mesh(resources.getPlane(w, h), glassMat);
        g.rotation.y = ry;
        g.position.set(x, winY, z);
        add(g, false);
        return g;
    };

    const lglass = new THREE.Mesh(resources.getPlane(3.8, winH), glassMat);
    lglass.position.set(-5.5, winY, frontZ - 0.01);
    lglass.name = 'window_glow';
    add(lglass, false);

    const rglass = new THREE.Mesh(resources.getPlane(3.8, winH), glassMat);
    rglass.position.set(5.5, winY, frontZ - 0.01);
    rglass.name = 'window_glow';
    add(rglass, false);

    // Window frames
    const addWindowFrame = (cx, cy, cz, fw, fh) => {
        [[-fw/2, 0], [fw/2, 0]].forEach(([ox]) =>
            box(WALL_T * 0.5, fh, WALL_T * 0.4, frameMat, cx + ox, cy, cz));
        [0, fh/2, -fh/2].forEach(oy =>
            box(fw, WALL_T * 0.5, WALL_T * 0.4, frameMat, cx, cy + oy, cz));
        box(WALL_T * 0.4, fh, WALL_T * 0.4, frameMat, cx, cy, cz);
    };
    addWindowFrame(-5.5, winY, frontZ - 0.05, 3.95, winH + 0.15);
    addWindowFrame( 5.5, winY, frontZ - 0.05, 3.95, winH + 0.15);

    // ── DOOR GROUP ───────────────────────────────────────────────────────────
    const doorGroup = new THREE.Group();
    const doorH = H - 0.4;
    const doorW = 3.0;
    
    // Rotating door pivot (on the side)
    doorGroup.position.set(-doorW / 2, 0, frontZ);
    group.add(doorGroup);

    const doorGlass = new THREE.Mesh(resources.getPlane(doorW, doorH), glassMat);
    doorGlass.position.set(doorW / 2, doorH / 2 + 0.1, 0.04);
    doorGroup.add(doorGlass);

    // Frame on the door itself
    const doorFrameGeo = resources.getBox(0.12, doorH, WALL_T * 0.5);
    const df1 = new THREE.Mesh(doorFrameGeo, frameMat);
    df1.position.set(0, doorH / 2 + 0.1, 0);
    doorGroup.add(df1);
    
    const df2 = new THREE.Mesh(doorFrameGeo, frameMat);
    df2.position.set(doorW, doorH / 2 + 0.1, 0);
    doorGroup.add(df2);

    const topF = new THREE.Mesh(resources.getBox(doorW + 0.12, 0.12, WALL_T * 0.5), frameMat);
    topF.position.set(doorW / 2, doorH + 0.1, 0);
    doorGroup.add(topF);

    // Handle
    const hGroup = new THREE.Group();
    const hBar = new THREE.Mesh(resources.getCylinder(0.04, 0.04, 0.6, 8), handleMat);
    hBar.position.y = 0.3;
    hGroup.add(hBar);
    hGroup.position.set(doorW - 0.2, 1.2, 0.1);
    doorGroup.add(hGroup);

    // Fixed Outer Frame (in 'group', not 'doorGroup')
    box(doorW + 0.25, 0.15, WALL_T * 0.6, frameMat, 0, doorH + 0.15, frontZ);


    // ── BACK WALL ─────────────────────────────────────────────────────────────
    const backZ = (D / 2) + WALL_T / 2;
    box(W, H * 0.55, WALL_T, brickMat, 0, H * 0.55 / 2, backZ);
    box(W, H * 0.25, WALL_T, brickMat, 0, H - H * 0.25 / 2, backZ);
    const backGlass = new THREE.Mesh(resources.getPlane(W - 2, H * 0.2), glassMat);
    backGlass.rotation.y = Math.PI;
    backGlass.position.set(0, H * 0.55 + H * 0.1, backZ + 0.01);
    add(backGlass, false);
    box(W, 0.12, WALL_T * 0.4, frameMat, 0, H * 0.55, backZ + 0.02);
    box(W, 0.12, WALL_T * 0.4, frameMat, 0, H * 0.55 + H * 0.2, backZ + 0.02);

    // ── LEFT WALL ─────────────────────────────────────────────────────────────
    const leftX = -(W / 2) - WALL_T / 2;
    box(WALL_T, 1.0, D, brickMat, leftX, 0.5, 0);
    box(WALL_T, 1.2, D, brickMat, leftX, H - 0.6, 0);
    box(WALL_T, H, 1.0, brickMat, leftX, H/2, -(D/2) + 0.5);
    box(WALL_T, H, 1.0, brickMat, leftX, H/2,  (D/2) - 0.5);
    box(WALL_T, H, 0.6, brickMat, leftX, H/2, 0);
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

    // ── RIGHT WALL ────────────────────────────────────────────────────────────
    const rightX = (W / 2) + WALL_T / 2;
    box(WALL_T, 1.0, D, brickMat, rightX, 0.5, 0);
    box(WALL_T, 1.2, D, brickMat, rightX, H - 0.6, 0);
    box(WALL_T, H, 1.0, brickMat, rightX, H/2, -(D/2) + 0.5);
    box(WALL_T, H, 1.0, brickMat, rightX, H/2,  (D/2) - 0.5);
    box(WALL_T, H, 0.6, brickMat, rightX, H/2, 0);
    [-3.2, 3.2].forEach(zo => {
        const sg = new THREE.Mesh(resources.getPlane(sideWinW, sideWinH), glassMat);
        sg.rotation.y = -Math.PI / 2;
        sg.position.set(rightX + 0.01, 1.0 + sideWinH / 2, zo);
        add(sg, false);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, rightX, 1.0, zo);
        box(WALL_T * 0.4, 0.1, sideWinW, frameMat, rightX, 1.0 + sideWinH, zo);
    });

    // (Removed old bulky interior floor)

    // ── INTERIOR FURNISHINGS ──────────────────────────────────────────────────
    const clothColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0x9b59b6, 0xf39c12, 0x1abc9c, 0xe91e63];

    // Helper: clothing rack (horizontal bar + 2 vertical legs)
    const addRack = (x, y_height, z, rackW = 2.5, ry = 0) => {
        const rg = new THREE.Group();
        const y = y_height;
        // Horizontal bar
        const bar = new THREE.Mesh(resources.getCylinder(0.04, 0.04, rackW, 8), metalPole);
        bar.rotation.z = Math.PI / 2;
        rg.add(bar);
        // Two legs
        [-rackW/2 + 0.05, rackW/2 - 0.05].forEach(lx => {
            const leg = new THREE.Mesh(resources.getCylinder(0.04, 0.04, y, 8), metalPole);
            leg.position.set(lx, -y/2, 0);
            rg.add(leg);
            // Feet
            const foot = new THREE.Mesh(resources.getCylinder(0.15, 0.15, 0.05, 8), metalPole);
            foot.position.set(lx, -y + 0.025, 0);
            rg.add(foot);
        });
        // Hanging clothes (small coloured quads dangling from bar)
        const count = Math.floor(rackW / 0.35);
        for (let i = 0; i < count; i++) {
            const col = clothColors[i % clothColors.length];
            const garment = new THREE.Mesh(
                resources.getBox(0.28, 0.55, 0.04),
                resources.getMaterial('cloth_' + col, () => new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 }))
            );
            garment.position.set(-rackW/2 + 0.2 + i * 0.35, -0.32, 0);
            rg.add(garment);
        }
        rg.position.set(x, FLOOR_Y + y, z); // Lifted to sit on floor
        rg.rotation.y = ry;
        group.add(rg);
    };

    // Four clothing racks arranged inside
    addRack(-4.5, 1.6, -2.0, 3.0);          // left-front
    addRack( 4.5, 1.6, -2.0, 3.0);          // right-front
    addRack(-4.5, 1.6,  2.5, 3.0);          // left-back
    addRack( 4.5, 1.6,  2.5, 3.0);          // right-back
    addRack( 0.0, 1.6,  3.5, 4.0, Math.PI / 2); // centre back (perpendicular)

    // Helper: simple mannequin
    const addMannequin = (x, z, color = 0xf5e6da, ry = 0) => {
        const mg = new THREE.Group();
        const bodyMc = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        // Torso
        const torso = new THREE.Mesh(resources.getBox(0.5, 0.75, 0.3), bodyMc);
        torso.position.y = 1.15;
        mg.add(torso);
        // Neck
        const neck = new THREE.Mesh(resources.getCylinder(0.07, 0.07, 0.18, 8), bodyMc);
        neck.position.y = 1.62;
        mg.add(neck);
        // Head (sphere)
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), bodyMc);
        head.position.y = 1.9;
        mg.add(head);
        // Hips
        const hips = new THREE.Mesh(resources.getBox(0.45, 0.4, 0.28), bodyMc);
        hips.position.y = 0.72;
        mg.add(hips);
        // Stand pole
        const standPole = new THREE.Mesh(resources.getCylinder(0.03, 0.03, 0.65, 8), metalPole);
        standPole.position.y = 0.33;
        mg.add(standPole);
        // Base disc
        const base = new THREE.Mesh(resources.getCylinder(0.22, 0.22, 0.05, 16), metalPole);
        base.position.y = 0.025;
        mg.add(base);
        // Clothes on mannequin: a dress/shirt quad
        const dressColor = clothColors[Math.floor(Math.random() * clothColors.length)];
        const dress = new THREE.Mesh(
            resources.getBox(0.55, 0.9, 0.08),
            resources.getMaterial('cloth_' + dressColor, () => new THREE.MeshStandardMaterial({ color: dressColor, roughness: 0.85 }))
        );
        dress.position.y = 0.9;
        dress.position.z = 0.17;
        mg.add(dress);

        mg.position.set(x, FLOOR_Y, z); // Lifted to sit on floor
        mg.rotation.y = ry;
        group.add(mg);
    };

    // Mannequins in front window display areas
    addMannequin(-5.5, -(D/2) + 1.8, 0xf5e6da, Math.PI * 0.1);
    addMannequin(-4.3, -(D/2) + 1.8, 0xd4a0a0, -Math.PI * 0.05);
    addMannequin( 4.3, -(D/2) + 1.8, 0xf5e6da, Math.PI * 0.05);
    addMannequin( 5.5, -(D/2) + 1.8, 0xb0c8d4, -Math.PI * 0.1);

    // Helper: folding/display table with stacked clothes
    const addFoldTable = (x, z, ry = 0) => {
        const tg = new THREE.Group();
        // Table surface
        const top = new THREE.Mesh(resources.getBox(1.8, 0.08, 0.9), woodMat);
        top.position.y = 0.82;
        tg.add(top);
        // 4 legs
        [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(resources.getBox(0.07, 0.82, 0.07), woodMat);
            leg.position.set(lx, 0.41, lz);
            tg.add(leg);
        });
        // Stacked folded clothes (coloured slabs)
        for (let s = 0; s < 3; s++) {
            const col = clothColors[s % clothColors.length];
            const folded = new THREE.Mesh(
                resources.getBox(0.5, 0.07, 0.35),
                resources.getMaterial('cloth_' + col, () => new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 }))
            );
            folded.position.set(-0.5 + s * 0.5, 0.9 + s * 0.075, 0);
            tg.add(folded);
        }
        tg.position.set(x, 0, z);
        tg.rotation.y = ry;
        group.add(tg);
    };

    addFoldTable(0, -1.0);
    addFoldTable(0,  1.5, Math.PI);

    // ── ROOF SLAB ─────────────────────────────────────────────────────────────
    box(W + WALL_T * 2 + 0.2, 0.35, D + WALL_T * 2 + 0.2, darkMat, 0, H + 0.17, 0);

    // ── PARAPET ───────────────────────────────────────────────────────────────
    const parapetH = 0.9;
    box(W + WALL_T * 2 + 0.6, parapetH + 0.3, WALL_T, accentMat, 0, H + 0.35 + (parapetH+0.3)/2, frontZ - 0.1);
    box(W + WALL_T * 2 + 0.6, parapetH, WALL_T, accentMat, 0, H + 0.35 + parapetH/2, backZ + 0.1);
    box(WALL_T, parapetH, D + WALL_T * 2 + 0.6, accentMat, leftX  - 0.05, H + 0.35 + parapetH/2, 0);
    box(WALL_T, parapetH, D + WALL_T * 2 + 0.6, accentMat, rightX + 0.05, H + 0.35 + parapetH/2, 0);

    // ── ROOF SIGN — canvas mirrored to compensate group.rotation.y = PI ───────
    const signY = H + 0.35 + parapetH + 0.3 + 0.9;
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 200;
    const sCtx = signCanvas.getContext('2d');
    // Mirror horizontally so text reads correctly after 180° group rotation
    sCtx.save();
    sCtx.translate(1024, 0);
    sCtx.scale(-1, 1);
    sCtx.fillStyle = '#b5161e';
    sCtx.fillRect(0, 0, 1024, 200);
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 130px Arial';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('BOYNER', 512, 100);
    sCtx.restore();
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signBoard = new THREE.Mesh(
        resources.getPlane(W - 1, 1.8),
        new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, signY, frontZ - 0.25);
    group.add(signBoard);
    box(W, 2.0, 0.18, accentMat, 0, signY, frontZ - 0.14);

    // ── DECORATIVE COLUMNS (front facade, no awning) ──────────────────────────
    [-7, -3.2, 3.2, 7].forEach(cx => {
        const col = new THREE.Mesh(resources.getCylinder(0.22, 0.26, H + 0.4, 10), colMat);
        col.position.set(cx, (H + 0.4) / 2, frontZ - 0.2);
        col.castShadow = true;
        group.add(col);
        const cap = new THREE.Mesh(resources.getCylinder(0.32, 0.22, 0.2, 10), colMat);
        cap.position.set(cx, H + 0.5, frontZ - 0.2);
        group.add(cap);
    });

    // ── POSITION + ROTATION ───────────────────────────────────────────────────
    group.rotation.y = -Math.PI / 2; // Face world +X (plaza center)
    group.position.set(px, 0, pz);
    scene.add(group);

    // ── PHYSICS — buildingPhysics.buildRectDoorShellBoxes ────────────────────
    if (physics && groundMaterial) {
        const boxes = buildRectDoorShellBoxes({
            W,
            D,
            H,
            wallT: WALL_T,
            doorW,
            lintel: 'boyner'
        });

        // Interior Colliders
        // Clothing Racks (Grouped or individual)
        boxes.push({ x: -4.5, y: 0.8, z: -2.0, w: 3.0, h: 1.6, d: 0.5 });
        boxes.push({ x:  4.5, y: 0.8, z: -2.0, w: 3.0, h: 1.6, d: 0.5 });
        boxes.push({ x: -4.5, y: 0.8, z:  2.5, w: 3.0, h: 1.6, d: 0.5 });
        boxes.push({ x:  4.5, y: 0.8, z:  2.5, w: 3.0, h: 1.6, d: 0.5 });
        boxes.push({ x:  0.0, y: 0.8, z:  3.5, w: 0.5, h: 1.6, d: 4.0 }); // Center back rack

        // Folding Tables
        boxes.push({ x: 0, y: 0.45, z: -1.0, w: 1.8, h: 0.9, d: 0.9 });
        boxes.push({ x: 0, y: 0.45, z:  1.5, w: 1.8, h: 0.9, d: 0.9 });

        addBuildingShellPhysics(physics, groundMaterial, group, boxes);
    }

    return {
        group,
        doorGroup,
        id: 'boyner',
        interaction: createBuildingInteractionHandle({
            group,
            W,
            D,
            doorLocalZ: frontZ,
            buildingName: 'boyner'
        })
    };
}
