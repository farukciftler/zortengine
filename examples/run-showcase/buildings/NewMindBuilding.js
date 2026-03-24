import * as THREE from 'three';
import {
    addBuildingShellPhysics,
    buildRectDoorShellBoxes,
    createBuildingInteractionHandle
} from './buildingPhysics.js';

/**
 * NewMindBuilding — Legal Tech / Law firm style building.
 * Refined for premium look and functional entrance.
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
    const navyMat      = new THREE.MeshStandardMaterial({ color: 0x0d47a1, roughness: 0.2, metalness: 0.2 }); // Deep Royal Navy
    const marbleMat    = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.4 }); // Bright Marble
    const darkWoodMat  = new THREE.MeshStandardMaterial({ color: 0x1a110a, roughness: 0.7 });
    const goldMat      = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    const glassMat     = new THREE.MeshStandardMaterial({ 
        color: 0x00bcd4, 
        transparent: true, 
        opacity: 0.3, 
        metalness: 0.8, 
        roughness: 0.05,
        side: THREE.DoubleSide 
    });
    const leatherMat   = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
    const screenMat    = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x0091ea, emissiveIntensity: 0.8 });

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
    const backZ  = (D / 2) + T / 2;
    const leftX  = -(W / 2) - T / 2;
    const rightX = (W / 2) + T / 2;

    // ── Structure ────────────────────────────────────────────────────────────
    box(W + T * 2, FLOOR_Y * 2, D + T * 2, marbleMat, 0, FLOOR_Y, 0); // Floor base
    box(W, H, T, marbleMat, 0, H / 2, backZ); // Back wall
    box(T, H, D, marbleMat, leftX, H / 2, 0); // Left wall
    box(T, H, D, marbleMat, rightX, H / 2, 0); // Right wall
    box(W + T * 2, 0.4, D + T * 2, navyMat, 0, H + 0.2, 0); // Roof (Navy)

    // ── Front Facade ────────────────────────────────────────────────────────
    // Columns (Navy with Gold vertical stripes)
    box(W * 0.1, H, T * 1.2, navyMat, -W * 0.45, H / 2, frontZ);
    box(W * 0.1, H, T * 1.2, navyMat,  W * 0.45, H / 2, frontZ);
    box(0.1, H, 0.5, goldMat, -W * 0.45, H / 2, frontZ - 0.1);
    box(0.1, H, 0.5, goldMat,  W * 0.45, H / 2, frontZ - 0.1);
    
    // Top Fascia
    box(W, 1.2, T * 1.1, navyMat, 0, H - 0.6, frontZ);

    // Front Windows
    const winW = W * 0.32;
    const winH = H - 1.2;
    box(winW, winH, 0.05, glassMat, -W * 0.24, winH / 2, frontZ);
    box(winW, winH, 0.05, glassMat,  W * 0.24, winH / 2, frontZ);

    // ── Doors (Pivot Fix) ───────────────────────────────────────────────────
    const doorW = 3.2; 
    const leafW = doorW / 2;
    const doorH = 3.8;
    const doors = [];

    // Left Leaf
    const leafL = new THREE.Group();
    leafL.position.set(-leafW, 0, frontZ);
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(leafW, doorH, 0.1), glassMat);
    m1.position.set(leafW / 2, doorH / 2, 0); leafL.add(m1);
    const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, doorH, 0.15), goldMat);
    f1.position.set(0, doorH / 2, 0); leafL.add(f1); 
    group.add(leafL); doors.push(leafL);

    // Right Leaf
    const leafR = new THREE.Group();
    leafR.position.set(leafW, 0, frontZ);
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(leafW, doorH, 0.1), glassMat);
    m2.position.set(-leafW / 2, doorH / 2, 0); leafR.add(m2);
    const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, doorH, 0.15), goldMat);
    f2.position.set(0, doorH / 2, 0); leafR.add(f2);
    group.add(leafR); doors.push(leafR);

    // ── Rooftop Signage (Wugo Style) ─────────────────────────────────────────
    const signGroup = new THREE.Group();
    signGroup.position.set(0, H + 0.9, frontZ - 0.2);
    group.add(signGroup);

    const sCanvas = document.createElement('canvas');
    sCanvas.width = 1024; sCanvas.height = 256;
    const sCtx = sCanvas.getContext('2d');
    sCtx.fillStyle = '#0d47a1'; sCtx.fillRect(0,0,1024, 256);
    sCtx.strokeStyle = '#ffd700'; sCtx.lineWidth = 20; sCtx.strokeRect(10,10,1004,236);
    sCtx.fillStyle = '#ffffff'; sCtx.font = 'bold 120px serif'; sCtx.textAlign = 'center'; sCtx.textBaseline = 'middle';
    sCtx.fillText('NEWMIND.AI', 512, 100);
    sCtx.fillStyle = '#ffb300'; sCtx.font = 'bold 50px Courier'; sCtx.fillText('LEGAL TECH SOLUTIONS', 512, 190);
    
    const sTex = new THREE.CanvasTexture(sCanvas);
    const sMat = new THREE.MeshStandardMaterial({ map: sTex, emissive: 0x0d47a1, emissiveIntensity: 0.5 });
    const sBoard = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), sMat);
    sBoard.rotation.y = Math.PI; 
    sBoard.position.z = -0.11;
    signGroup.add(sBoard);
    
    box(8.2, 2.2, 0.2, navyMat, 0, 0, 0).parent = signGroup; // Backing
    box(0.2, 1.2, 0.2, goldMat, -3.5, -0.6, 0).parent = signGroup; // Pole L
    box(0.2, 1.2, 0.2, goldMat,  3.5, -0.6, 0).parent = signGroup; // Pole R

    // ── Interior ────────────────────────────────────────────────────────────
    // Tech Desk Refinement
    const deskG = new THREE.Group();
    deskG.position.set(0, 0, 1.5);
    box(6, 0.8, 2, darkWoodMat, 0, 0.4, 0).parent = deskG;
    // Curved Multi-Monitor setup
    for (let i = -1; i <= 1; i++) {
        const mon = new THREE.Group();
        box(1.8, 1.1, 0.05, screenMat, 0, 1.6, 0.6).parent = mon;
        mon.rotation.y = i * 0.4;
        mon.position.x = i * 2;
        deskG.add(mon);
    }
    group.add(deskG);

    // Conference Area
    box(8, 0.8, 3, darkWoodMat, 0, 0.4, -2.5);
    // Add glowing "Data" strips on floor
    box(W - 2, 0.01, 0.2, goldMat, 0, 0.02, -1);
    box(W - 2, 0.01, 0.2, goldMat, 0, 0.02, 1);

    // Bookcases (Filled with glowing files)
    box(4, H * 0.8, 0.8, darkWoodMat, -5.5, H * 0.4, backZ - 0.5);
    box(4, H * 0.8, 0.8, darkWoodMat,  5.5, H * 0.4, backZ - 0.5);

    // ── Finalization ────────────────────────────────────────────────────────
    group.rotation.y = -Math.PI / 2;
    group.position.set(px, 0, pz);
    scene.add(group);

    if (physics && groundMaterial) {
        addBuildingShellPhysics(physics, groundMaterial, group, buildRectDoorShellBoxes({ W, D, H, wallT: T, doorW: doorW + 0.2, doorH }));
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
