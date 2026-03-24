import * as THREE from 'three';
import {
    addBuildingShellPhysics,
    buildRectDoorShellBoxes,
    createBuildingInteractionHandle
} from './buildingPhysics.js';

/**
 * NewMindBuilding — Premium Legal Tech / AI Solution Center.
 * High-detail interior featuring server racks, workstations, and meeting hubs.
 */
export function buildNewMindBuilding(scene, physics, groundMaterial, position = [0, 0, 0]) {
    const [px, , pz] = position;
    const group = new THREE.Group();

    // ── Dimensions ───────────────────────────────────────────────────────────
    const W = 16;
    const H = 7;
    const D = 12;
    const T = 0.4;
    const FLOOR_Y = 0.011;

    // ── Palette ───────────────────────────────────────────────────────────────
    const navyMat = new THREE.MeshStandardMaterial({ color: 0x01579b, roughness: 0.1, metalness: 0.4 });
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, metalness: 0.8, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x81d4fa, transparent: true, opacity: 0.25, metalness: 0.7, roughness: 0.05, side: THREE.DoubleSide
    });
    const blueLedMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2.0 });
    const greenLedMat = new THREE.MeshStandardMaterial({ color: 0x00c853, emissive: 0x00c853, emissiveIntensity: 1.5 });

    const add = (mesh, shadow = true) => {
        if (shadow) { mesh.castShadow = true; mesh.receiveShadow = true; }
        group.add(mesh);
        return mesh;
    };
    const box = (w, h, d, mat, x, y, z) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        return add(m);
    };

    const frontZ = -(D / 2) - T / 2;
    const backZ = (D / 2) + T / 2;
    const leftX = -(W / 2) - T / 2;
    const rightX = (W / 2) + T / 2;

    // ── Structural Foundation ───────────────────────────────────────────────
    box(W + T * 2, FLOOR_Y * 2, D + T * 2, marbleMat, 0, FLOOR_Y, 0); // Floor base
    box(W, H, T, marbleMat, 0, H / 2, backZ); // Back wall
    box(T, H, D, marbleMat, leftX, H / 2, 0); // Left wall
    box(T, H, D, marbleMat, rightX, H / 2, 0); // Right wall
    box(W + T * 2, 0.4, D + T * 2, navyMat, 0, H + 0.2, 0); // Roof slab

    // ── Front Facade (High Detail) ──────────────────────────────────────────
    // Side Columns with Gold Accents
    [-W * 0.45, W * 0.45].forEach(x => {
        box(W * 0.1, H, T * 1.5, navyMat, x, H / 2, frontZ);
        box(0.1, H, 0.6, goldMat, x, H / 2, frontZ - 0.2);
    });
    // Top Fascia with horizontal gold line
    box(W, 1.4, T * 1.2, navyMat, 0, H - 0.7, frontZ);
    box(W, 0.05, 0.7, goldMat, 0, H - 1.2, frontZ - 0.25);

    // Precise Window Frames (Boyner style)
    const winW = W * 0.32;
    const winH = H - 1.8;
    const winY = winH / 2 + 0.4;
    [-W * 0.25, W * 0.25].forEach(x => {
        // Glass
        const g = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
        g.position.set(x, winY, frontZ - 0.02);
        add(g, false);
        // Frames
        box(winW + 0.1, 0.1, 0.2, steelMat, x, winY + winH / 2, frontZ - 0.1);
        box(winW + 0.1, 0.1, 0.2, steelMat, x, winY - winH / 2, frontZ - 0.1);
        box(0.1, winH, 0.2, steelMat, x - winW / 2, winY, frontZ - 0.1);
        box(0.1, winH, 0.2, steelMat, x + winW / 2, winY, frontZ - 0.1);
        // Vertical mullion
        box(0.05, winH, 0.1, goldMat, x, winY, frontZ - 0.15);
    });

    // ── Doors (Double Tech-Glass) ───────────────────────────────────────────
    const doorW = 3.2;
    const leafW = doorW / 2;
    const doorH = 3.8;
    const doors = [];

    const createDoorLeaf = (isRight) => {
        const leaf = new THREE.Group();
        const pivotX = isRight ? leafW : -leafW;
        leaf.position.set(pivotX, 0, frontZ);

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(leafW, doorH, 0.1), glassMat);
        mesh.position.set(isRight ? -leafW / 2 : leafW / 2, doorH / 2, 0);
        leaf.add(mesh);

        // Leaf Frames
        const fH = new THREE.Mesh(new THREE.BoxGeometry(0.1, doorH, 0.15), goldMat);
        fH.position.set(0, doorH / 2, 0); leaf.add(fH);

        const fV = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.1, 0.15), goldMat);
        fV.position.set(isRight ? -leafW / 2 : leafW / 2, doorH, 0); leaf.add(fV);

        // Digital handle (blue glowing bar)
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.08), blueLedMat);
        hand.position.set(isRight ? -leafW + 0.2 : leafW - 0.2, 1.2, 0.1);
        leaf.add(hand);

        group.add(leaf);
        return leaf;
    };
    doors.push(createDoorLeaf(false), createDoorLeaf(true));

    // ── Rooftop Signage (NEWMIND.AI) ────────────────────────────────────────
    const signGroup = new THREE.Group();
    signGroup.position.set(0, H + 0.9, frontZ - 0.2);
    group.add(signGroup);

    const sCanvas = document.createElement('canvas'); sCanvas.width = 1024; sCanvas.height = 256;
    const sCtx = sCanvas.getContext('2d');
    sCtx.fillStyle = '#01579b'; sCtx.fillRect(0, 0, 1024, 256);
    sCtx.strokeStyle = '#ffd700'; sCtx.lineWidth = 15; sCtx.strokeRect(10, 10, 1004, 236);
    sCtx.shadowColor = 'rgba(0,0,0,0.5)'; sCtx.shadowBlur = 10;
    sCtx.fillStyle = '#ffffff'; sCtx.font = 'bold 130px Arial'; sCtx.textAlign = 'center'; sCtx.textBaseline = 'middle';
    sCtx.fillText('NEWMIND.AI', 512, 100);
    sCtx.font = 'bold 50px Courier'; sCtx.fillStyle = '#ffb300';
    sCtx.fillText('LEGAL TECH SOLUTIONS', 512, 195);

    const sTex = new THREE.CanvasTexture(sCanvas);
    const sBoard = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshStandardMaterial({ map: sTex, emissive: 0x01579b, emissiveIntensity: 0.4 }));
    sBoard.rotation.y = Math.PI; sBoard.position.z = -0.11; signGroup.add(sBoard);
    box(8.2, 2.2, 0.2, darkMat, 0, 0, 0).parent = signGroup;
    box(0.2, 1.2, 0.2, goldMat, -3.5, -0.6, 0).parent = signGroup;
    box(0.2, 1.2, 0.2, goldMat, 3.5, -0.6, 0).parent = signGroup;

    // ── HIGH-DETAIL INTERIOR ────────────────────────────────────────────────

    // 1. Server Cluster (Back-Left Area)
    const createServerRack = (x, z) => {
        const rack = new THREE.Group();
        box(1.2, 3.5, 1.2, darkMat, 0, 1.75, 0).parent = rack;
        // Front glowing units
        for (let y = 0.4; y < 3.2; y += 0.3) {
            box(1.0, 0.1, 0.05, Math.random() > 0.3 ? blueLedMat : greenLedMat, 0, y, 0.61).parent = rack;
        }
        rack.position.set(x, FLOOR_Y, z);
        group.add(rack);
    };
    createServerRack(-5.5, 4);
    createServerRack(-4.0, 4);
    createServerRack(-2.5, 4);

    // 2. Main Tech Desk (Curved AI Workstation)
    const mainDesk = new THREE.Group();
    box(6, 0.8, 2.5, darkMat, 0, 0.4, 0).parent = mainDesk;
    box(6.2, 0.1, 2.6, steelMat, 0, 0.85, 0).parent = mainDesk;
    // 3 Monitors
    for (let i = -1; i <= 1; i++) {
        const mon = new THREE.Group();
        box(1.8, 1.1, 0.1, darkMat, 0, 1.6, 0.5).parent = mon;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ color: 0x0d47a1 }));
        screen.position.set(0, 1.6, 0.56); mon.add(screen);
        mon.rotation.y = i * 0.5; mon.position.x = i * 2.2;
        mainDesk.add(mon);
    }
    mainDesk.position.set(0, FLOOR_Y, 1.5);
    group.add(mainDesk);

    // 3. Meeting Hub (Glass Chamber)
    const chamber = new THREE.Group();
    // Glass Walls
    const cW = 6, cD = 4, cH = 4;
    box(cW, cH, 0.05, glassMat, 0, cH / 2, -cD / 2).parent = chamber;
    box(0.05, cH, cD, glassMat, -cW / 2, cH / 2, 0).parent = chamber;
    box(0.05, cH, cD, glassMat, cW / 2, cH / 2, 0).parent = chamber;
    // Meeting Table
    box(4, 0.1, 2, steelMat, 0, 0.95, 0).parent = chamber;
    box(0.2, 0.9, 0.2, goldMat, 0, 0.45, 0).parent = chamber;
    // Chairs
    const addChair = (x, z, ry) => {
        const c = new THREE.Group();
        box(0.6, 0.1, 0.6, darkMat, 0, 0.55, 0).parent = c;
        box(0.6, 0.6, 0.1, darkMat, 0, 0.85, -0.3).parent = c;
        box(0.1, 0.5, 0.1, goldMat, 0, 0.25, 0).parent = c;
        c.position.set(x, 0, z); c.rotation.y = ry;
        chamber.add(c);
    };
    for (let x = -1.5; x <= 1.5; x += 1.5) {
        addChair(x, 0.7, 0); addChair(x, -0.7, Math.PI);
    }
    chamber.position.set(4, FLOOR_Y, -2.5);
    group.add(chamber);

    // 4. Data Streams (Gold lines on floor)
    for (let i = -6; i <= 6; i += 3) {
        box(0.1, 0.01, D - 1, goldMat, i, 0.02, 0);
    }

    // ── Final Position + Physics ────────────────────────────────────────────
    group.rotation.y = -Math.PI / 2;
    group.position.set(px, 0, pz);
    scene.add(group);

    if (physics && groundMaterial) {
        const boxes = buildRectDoorShellBoxes({ W, D, H, wallT: T, doorW: doorW + 0.2, doorH });
        
        // Add Interior Colliders
        // Server Racks
        boxes.push({ x: -5.5, y: 1.75, z: 4, w: 1.2, h: 3.5, d: 1.2 });
        boxes.push({ x: -4.0, y: 1.75, z: 4, w: 1.2, h: 3.5, d: 1.2 });
        boxes.push({ x: -2.5, y: 1.75, z: 4, w: 1.2, h: 3.5, d: 1.2 });
        
        // Main Tech Desk
        boxes.push({ x: 0, y: 0.4, z: 1.5 + FLOOR_Y, w: 6, h: 0.8, d: 2.5 });
        
        // Meeting Table (Chamber area)
        boxes.push({ x: 4, y: 0.45, z: -2.5, w: 4, h: 0.9, d: 2 });

        addBuildingShellPhysics(physics, groundMaterial, group, boxes);
    }

    return {
        group,
        doors,
        id: 'newmind',
        interaction: createBuildingInteractionHandle({
            group,
            W,
            D,
            doorLocalZ: frontZ,
            buildingName: 'newmind',
            doorOpenDistance: 5
        })
    };
}
