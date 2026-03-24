import * as THREE from 'three';
import {
    addBuildingShellPhysics,
    buildRectDoorShellBoxes,
    createBuildingInteractionHandle
} from './buildingPhysics.js';

/**
 * WugoBuilding — Modern Event Discovery Hub.
 * Features: High-detail seating, ticketing kiosks, event posters, and digital displays.
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
    const blueMat      = new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.3, metalness: 0.2 }); // Deep Blue
    const lightBlueMat = new THREE.MeshStandardMaterial({ color: 0xbbdefb, roughness: 0.6 });
    const concreteMat  = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
    const frameMat     = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    const glassMat     = new THREE.MeshStandardMaterial({ 
        color: 0x81d4fa, transparent: true, opacity: 0.28, metalness: 0.6, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false 
    });
    const orangeMat    = new THREE.MeshStandardMaterial({ color: 0xff9800, emissive: 0xff9800, emissiveIntensity: 0.2 });
    const pinkMat      = new THREE.MeshStandardMaterial({ color: 0xe91e63 });
    const steelMat     = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.1 });

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

    const frontZ = -(D / 2) - WALL_T / 2;
    const backZ  = (D / 2) + WALL_T / 2;
    const leftX  = -(W / 2) - WALL_T / 2;
    const rightX = (W / 2) + WALL_T / 2;

    // ── Structure ────────────────────────────────────────────────────────────
    box(W + WALL_T * 2, FLOOR_Y * 2, D + WALL_T * 2, concreteMat, 0, FLOOR_Y, 0); // Base
    box(W, H, WALL_T, blueMat, 0, H / 2, backZ); // Back wall
    box(WALL_T, H, D, blueMat, leftX, H / 2, 0); // Left wall
    box(WALL_T, H, D, blueMat, rightX, H / 2, 0); // Right wall
    box(W + WALL_T * 2, 0.4, D + WALL_T * 2, blueMat, 0, H + 0.2, 0); // Roof

    // ── Front Facade (High Detail) ──────────────────────────────────────────
    // Thick Columns
    box(1.0, H, WALL_T * 1.5, blueMat, -W/2 + 0.5, H/2, frontZ);
    box(1.0, H, WALL_T * 1.5, blueMat,  W/2 - 0.5, H/2, frontZ);
    box(1.0, H, WALL_T * 1.5, blueMat, -2.0, H/2, frontZ);
    box(1.0, H, WALL_T * 1.5, blueMat,  2.0, H/2, frontZ);

    // Front Window Panes & Frames
    const winH = H - 2.0;
    const winY = winH / 2 + 1.0;
    [-4.5, 4.5].forEach(x => {
        const g = new THREE.Mesh(new THREE.PlaneGeometry(3.0, winH), glassMat);
        g.position.set(x, winY, frontZ - 0.02);
        add(g, false);
        // Mullions
        box(0.1, winH, 0.15, frameMat, x, winY, frontZ - 0.1);
        box(3.1, 0.1, 0.15, frameMat, x, winY + winH/2, frontZ - 0.1);
        box(3.1, 0.1, 0.15, frameMat, x, winY - winH/2, frontZ - 0.1);
    });

    // ── Interactive Door ─────────────────────────────────────────────────────
    const doorW = 3.0;
    const doorH = 4.2;
    const drG = new THREE.Group();
    drG.position.set(-doorW/2, 0, frontZ);
    group.add(drG);

    const drM = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), glassMat);
    drM.position.set(doorW/2, doorH/2, 0.05);
    drG.add(drM);

    // Door Frames
    const dfG = new THREE.BoxGeometry(0.1, doorH, 0.2);
    const df1 = new THREE.Mesh(dfG, frameMat); df1.position.set(0, doorH/2, 0.1); drG.add(df1);
    const df2 = new THREE.Mesh(dfG, frameMat); df2.position.set(doorW, doorH/2, 0.1); drG.add(df2);
    const df3 = new THREE.Mesh(new THREE.BoxGeometry(doorW+0.1, 0.1, 0.2), frameMat); df3.position.set(doorW/2, doorH, 0.1); drG.add(df3);

    // Modern Curved Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), steelMat);
    handle.position.set(doorW - 0.2, 1.3, 0.2);
    drG.add(handle);

    // ── Rooftop Signage (WUGO Style) ──────────────────────────────────────────
    const signGroup = new THREE.Group();
    signGroup.position.set(0, H + 1.0, frontZ - 0.2);
    group.add(signGroup);

    const sCanvas = document.createElement('canvas'); sCanvas.width = 512; sCanvas.height = 128;
    const sCtx = sCanvas.getContext('2d');
    sCtx.fillStyle = '#1976d2'; sCtx.fillRect(0,0,512,128);
    sCtx.fillStyle = '#ffffff'; sCtx.font = 'bold 80px Arial'; sCtx.textAlign = 'center'; sCtx.textBaseline = 'middle';
    sCtx.fillText('WUGO', 256, 64);
    
    const sBoard = new THREE.Mesh(new THREE.PlaneGeometry(7, 2), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(sCanvas), emissive: 0x1976d2, emissiveIntensity: 0.5 }));
    sBoard.rotation.y = Math.PI; sBoard.position.z = -0.11; signGroup.add(sBoard);
    box(7.2, 2.2, 0.2, frameMat, 0, 0, 0).parent = signGroup; 
    box(0.15, 1.4, 0.15, frameMat, -2.5, -0.7, 0).parent = signGroup;
    box(0.15, 1.4, 0.15, frameMat,  2.5, -0.7, 0).parent = signGroup;

    // ── HIGH-DETAIL INTERIOR —─────────────────────────────────────────────────
    
    // 1. Lounge Area (Detailed Soft Seating)
    const addSofa = (x, z, ry) => {
        const sg = new THREE.Group();
        box(2.5, 0.5, 1.0, lightBlueMat, 0, 0.25, 0).parent = sg; // seat
        box(2.5, 0.7, 0.2, blueMat, 0, 0.6, 0.4).parent = sg; // backrest
        box(0.25, 0.6, 1.0, blueMat, -1.13, 0.45, 0).parent = sg; // arm L
        box(0.25, 0.6, 1.0, blueMat,  1.13, 0.45, 0).parent = sg; // arm R
        // Cushions
        box(0.8, 0.8, 0.1, orangeMat, -0.6, 0.65, 0.3).parent = sg;
        box(0.8, 0.8, 0.1, pinkMat, 0.6, 0.65, 0.3).parent = sg;
        
        sg.position.set(x, FLOOR_Y, z);
        sg.rotation.y = ry;
        group.add(sg);
    };
    addSofa(-4.5, 2, Math.PI / 2);
    addSofa(-4.5, -1.0, Math.PI / 2);

    // 2. Information/Ticket Desk (Semi-Circular)
    const deskG = new THREE.Group();
    const dBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.1, 1.1, 12, 1, false, 0, Math.PI), blueMat);
    dBase.rotation.x = -Math.PI / 2;
    dBase.rotation.z = Math.PI / 2;
    dBase.position.y = 0.55;
    deskG.add(dBase);
    // Countertop
    const dTop = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.1, 12, 1, false, 0, Math.PI), steelMat);
    dTop.rotation.x = -Math.PI/2; dTop.rotation.z = Math.PI/2; dTop.position.y = 1.15;
    deskG.add(dTop);
    
    deskG.position.set(3.5, FLOOR_Y, -2);
    deskG.rotation.y = Math.PI / 4;
    group.add(deskG);

    // 3. Ticketing Kiosks (Self-Service)
    const createKiosk = (x, z, ry) => {
        const k = new THREE.Group();
        box(0.8, 1.6, 0.5, frameMat, 0, 0.8, 0).parent = k;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.5), new THREE.MeshBasicMaterial({ color: 0x00bcd4 }));
        screen.position.set(0, 1.25, 0.26); k.add(screen);
        // Base plate
        box(1.0, 0.1, 0.7, frameMat, 0, 0.05, 0).parent = k;
        
        k.position.set(x, FLOOR_Y, z);
        k.rotation.y = ry;
        group.add(k);
    };
    createKiosk(5.8, 2, -Math.PI / 2);
    createKiosk(5.8, 0, -Math.PI / 2);
    createKiosk(5.8, -2, -Math.PI / 2);

    // 4. Large Digital Displays (Event Previews)
    const addPoster = (x, y, z, ry, title, color) => {
        const pg = new THREE.Group();
        box(2.0, 3.0, 0.1, frameMat, 0, 0, 0).parent = pg;
        const disp = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.8), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 }));
        disp.position.z = 0.06; pg.add(disp);
        
        // Poster Text
        const pc = document.createElement('canvas'); pc.width = 256; pc.height = 512;
        const px = pc.getContext('2d');
        px.fillStyle = 'white'; px.font = 'bold 36px Arial'; px.textAlign = 'center';
        px.fillText(title, 128, 64);
        px.fillText('TICKETS', 128, 480);
        const pTex = new THREE.CanvasTexture(pc);
        const pMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.7), new THREE.MeshBasicMaterial({ map: pTex, transparent: true }));
        pMesh.position.z = 0.07; pg.add(pMesh);

        pg.position.set(x, y, z);
        pg.rotation.y = ry;
        group.add(pg);
    };
    addPoster(-WALL_T/2 - 0.05, 3, backZ - 0.2, 0, "NIGHT LIFE", 0x673ab7);
    addPoster(4, 3, backZ - 0.2, 0, "JAZZ FEST", 0x00c853);
    addPoster(leftX + 0.2, 3, 3, Math.PI / 2, "COMEDY", 0xffeb3b);

    // ── ROOFTOP DESIGN ──────────────────────────────────────────────────────
    const roofY = H + 0.4;
    // Parapet
    box(W + WALL_T * 2 + 0.2, 0.8, WALL_T, blueMat, 0, roofY + 0.4, frontZ - 0.1); // Front
    box(W + WALL_T * 2 + 0.2, 0.8, WALL_T, blueMat, 0, roofY + 0.4, backZ + 0.1);  // Back
    box(WALL_T, 0.8, D + WALL_T * 2 + 0.2, blueMat, leftX - 0.1, roofY + 0.4, 0);  // Left
    box(WALL_T, 0.8, D + WALL_T * 2 + 0.2, blueMat, rightX + 0.1, roofY + 0.4, 0); // Right

    // HVAC Units
    const addHvac = (x, z) => {
        const hg = new THREE.Group();
        box(1.5, 0.8, 1.2, steelMat, 0, 0.4, 0).parent = hg;
        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16), frameMat);
        fan.position.y = 0.85; hg.add(fan);
        hg.position.set(x, roofY, z);
        group.add(hg);
    };
    addHvac(-4, 2);
    addHvac(4, -2);

    // Colorful Roof Pipes (Fun aesthetic)
    const pipeMatY = new THREE.MeshStandardMaterial({ color: 0xffeb3b });
    const pipeMatP = new THREE.MeshStandardMaterial({ color: 0xe91e63 });
    const addPipe = (x, z, len, ry, mat) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, len, 8), mat);
        p.rotation.z = Math.PI / 2;
        p.rotation.y = ry;
        p.position.set(x, roofY + 0.15, z);
        add(p);
    };
    addPipe(0, 3, 6, 0, pipeMatY);
    addPipe(2, 0, 4, Math.PI / 2, pipeMatP);

    // ── Position + Physics ──────────────────────────────────────────────────
    group.rotation.y = -Math.PI / 2;
    group.position.set(px, 0, pz);
    scene.add(group);

    if (physics && groundMaterial) {
        addBuildingShellPhysics(physics, groundMaterial, group, buildRectDoorShellBoxes({ W, D, H, wallT: WALL_T, doorW, doorH }));
    }

    return {
        group,
        doorGroup: drG,
        id: 'wugo',
        interaction: createBuildingInteractionHandle({
            group,
            W,
            D,
            doorLocalZ: frontZ,
            buildingName: 'wugo'
        })
    };
}
