import * as THREE from 'three';
import {
    addBuildingShellPhysics,
    buildRectDoorShellBoxes,
    createBuildingInteractionHandle
} from './buildingPhysics.js';

/**
 * WugoBuilding — Event Discovery App Office/Store.
 * 
 * Features:
 * - Event posters and screens showing "Discovery".
 * - Ticketing/Information desk.
 * - Right-side mounted signage as requested.
 * - Interactive door and TPS-friendly interior.
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
    const concreteMat  = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.8 });
    const darkConcrete = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.9, metalness: 0.05 });
    const blueMat      = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.4, metalness: 0.3 });
    const lightBlueMat = new THREE.MeshStandardMaterial({ color: 0x5dade2, roughness: 0.3, metalness: 0.2 });
    const glassMat     = new THREE.MeshStandardMaterial({ 
        color: 0xaed6f1, transparent: true, opacity: 0.25, 
        roughness: 0.05, metalness: 0.5, side: THREE.DoubleSide, depthWrite: false 
    });
    const frameMat     = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.5 });
    const woodMat      = new THREE.MeshStandardMaterial({ color: 0x8d6e3e, roughness: 0.7 });
    const steelMat     = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.9, roughness: 0.1 });

    // ── Helpers ───────────────────────────────────────────────────────────────
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

    // ── FLOOR — Flush with plaza ─────────────────────────────────────────────
    const floorGeo = new THREE.PlaneGeometry(W + WALL_T*2, D + WALL_T*2);
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.5 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR_Y, 0);
    add(floor);

    // ── WALLS ────────────────────────────────────────────────────────────────
    const frontZ = -(D / 2) - WALL_T / 2;
    const backZ  =  (D / 2) + WALL_T / 2;
    const leftX  = -(W / 2) - WALL_T / 2;
    const rightX =  (W / 2) + WALL_T / 2;

    // Back wall (Solid blue/white)
    box(W, H, WALL_T, blueMat, 0, H/2, backZ);
    // Left wall (Blue with large windows)
    box(WALL_T, H, 2.0, blueMat, leftX, H/2, -D/2 + 1.0);
    box(WALL_T, H, 2.0, blueMat, leftX, H/2,  D/2 - 1.0);
    box(WALL_T, 1.2, D - 4.0, blueMat, leftX, 0.6, 0); // Bottom sill
    box(WALL_T, 1.2, D - 4.0, blueMat, leftX, H - 0.6, 0); // Top lintel
    
    const sideWinG = new THREE.Mesh(new THREE.PlaneGeometry(D - 4.2, H - 2.5), glassMat);
    sideWinG.rotation.y = Math.PI / 2;
    sideWinG.position.set(leftX - 0.02, H/2, 0);
    add(sideWinG, false);
    // Mullions for side window
    box(0.1, H - 2.4, 0.1, frameMat, leftX, H/2, -1.0);
    box(0.1, H - 2.4, 0.1, frameMat, leftX, H/2,  1.0);

    // Right wall (Solid white - holds the sign)
    box(WALL_T, H, D, blueMat, rightX, H/2, 0);

    // Front Facade (Modern Glass Focus)
    const doorW = 2.6;
    const doorH = 3.6;
    const frontWallW = (W - doorW) / 2;
    
    // Pillars
    box(0.6, H, WALL_T * 1.5, blueMat, -W/2 + 0.3, H/2, frontZ);
    box(0.6, H, WALL_T * 1.5, blueMat,  W/2 - 0.3, H/2, frontZ);
    box(0.6, H, WALL_T * 1.5, blueMat, -doorW/2 - 0.3, H/2, frontZ);
    box(0.6, H, WALL_T * 1.5, blueMat,  doorW/2 + 0.3, H/2, frontZ);

    // Glass panes between pillars
    const paneW = (W/2 - doorW/2) - 1.2;
    const paneH = H - 1.0;
    [-W/2 + frontWallW/2 + 0.3, W/2 - frontWallW/2 - 0.3].forEach(px_pos => {
        const pg = new THREE.Mesh(new THREE.PlaneGeometry(paneW, paneH), glassMat);
        pg.position.set(px_pos, paneH/2 + 0.5, frontZ - 0.02);
        add(pg, false);
        // Transom bar
        box(paneW, 0.1, 0.2, frameMat, px_pos, 2.5, frontZ - 0.05);
    });

    // Lintel over door
    box(doorW + 1.2, H - doorH, WALL_T, blueMat, 0, doorH + (H - doorH)/2, frontZ);

    // ── INTERACTIVE DOOR ─────────────────────────────────────────────────────
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, FLOOR_Y, frontZ); 
    group.add(doorGroup);

    const doorMesh = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), glassMat);
    doorMesh.position.set(0, doorH / 2, 0.05);
    doorGroup.add(doorMesh);

    const dFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, doorH, 0.15), frameMat);
    dFrame.position.set(-doorW/2 + 0.06, doorH/2, 0.05);
    doorGroup.add(dFrame);
    const dFrameR = dFrame.clone();
    dFrameR.position.x = doorW/2 - 0.06;
    doorGroup.add(dFrameR);
    const dTop = new THREE.Mesh(new THREE.BoxGeometry(doorW, 0.12, 0.15), frameMat);
    dTop.position.set(0, doorH - 0.06, 0.05);
    doorGroup.add(dTop);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), steelMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 1.2, 0.15);
    doorGroup.add(handle);

    // ── ROOFTOP SIGNAGE (WUGO) ───────────────────────────────────────────────
    const signGroup = new THREE.Group();
    signGroup.position.set(0, H + 0.8, frontZ - 0.2);
    group.add(signGroup);

    const signH = 1.6;
    const signW = 7.0;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2980b9'; ctx.fillRect(0,0, 512, 128);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('WUGO', 256, 64);
    
    const sTex = new THREE.CanvasTexture(canvas);
    const sMat = new THREE.MeshStandardMaterial({ map: sTex, emissive: 0x2980b9, emissiveIntensity: 0.8 });
    
    const sBoard = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), sMat);
    sBoard.rotation.y = Math.PI; // Face local -z
    sBoard.position.z = -0.11; // Offset to avoid z-fighting with backing panel
    signGroup.add(sBoard);
    // Backing panel
    box(signW + 0.2, signH + 0.2, 0.2, frameMat, 0, 0, 0).parent = signGroup;
    // Support poles
    box(0.15, 1.2, 0.15, frameMat, -2.5, -0.8, 0).parent = signGroup;
    box(0.15, 1.2, 0.15, frameMat,  2.5, -0.8, 0).parent = signGroup;

    // ── INTERIOR (High-Detail Event Hub) ───────────────────────────────────
    // Lounge Area (Sofas)
    const addSofa = (x, z, ry) => {
        const sg = new THREE.Group();
        add(box(2.2, 0.45, 0.9, lightBlueMat, 0, 0.22, 0)).parent = sg; // seat
        add(box(2.2, 0.6, 0.25, blueMat, 0, 0.5, 0.35)).parent = sg; // back
        add(box(0.25, 0.5, 0.9, blueMat, -1.0, 0.45, 0)).parent = sg; // arm
        add(box(0.25, 0.5, 0.9, blueMat,  1.0, 0.45, 0)).parent = sg; // arm
        sg.position.set(x, FLOOR_Y, z);
        sg.rotation.y = ry;
        group.add(sg);
    };
    addSofa(-4, 1.5, Math.PI / 2);
    addSofa(-4, -1.5, Math.PI / 2);

    // Modern Info/Ticket Desk
    const deskG = new THREE.Group();
    add(box(4, 1.1, 1.5, concreteMat, 0, 0.55, 0)).parent = deskG; // main body
    add(box(4.2, 0.1, 1.6, darkConcrete, 0, 1.15, 0)).parent = deskG; // top
    // Wugo Logo on desk
    const deskSign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), sMat);
    deskSign.position.set(0, 0.6, 0.76);
    deskG.add(deskSign);
    deskG.position.set(3, FLOOR_Y, -1);
    group.add(deskG);

    // Kiosks (Ticket Machines)
    const addKiosk = (x, z, ry) => {
        const kg = new THREE.Group();
        add(box(0.6, 1.3, 0.4, frameMat, 0, 0.65, 0)).parent = kg; // body
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), new THREE.MeshBasicMaterial({ color: 0x3498db }));
        screen.position.set(0, 1.0, 0.21);
        kg.add(screen);
        kg.position.set(x, FLOOR_Y, z);
        kg.rotation.y = ry;
        group.add(kg);
    };
    addKiosk(5.5, 2.5, -Math.PI/6);
    addKiosk(4.0, 3.5, -Math.PI/6);

    // More Screens
    const addScreen = (x, y, z, ry, label) => {
        const scG = new THREE.Group();
        add(box(2.5, 1.5, 0.1, frameMat, 0, 0, 0)).parent = scG;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.3), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x3498db, emissiveIntensity: 1.0 }));
        screen.position.z = 0.06;
        scG.add(screen);
        
        const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 128;
        const cx2 = c2.getContext('2d');
        cx2.fillStyle = '#000000'; cx2.fillRect(0,0,256,128);
        cx2.fillStyle = '#3498db'; cx2.font = 'bold 28px Arial'; cx2.textAlign = 'center';
        cx2.fillText(label, 128, 64);
        const tex2 = new THREE.CanvasTexture(c2);
        const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), new THREE.MeshBasicMaterial({ map: tex2, transparent: true }));
        labelMesh.position.z = 0.07;
        scG.add(labelMesh);

        scG.position.set(x, y, z);
        scG.rotation.y = ry;
        group.add(scG);
    };

    addScreen(W/2 - 0.25, 2.5,  2, -Math.PI/2, "Concerts Near You");
    addScreen(W/2 - 0.25, 2.5, -2, -Math.PI/2, "Tech Workshops");
    addScreen(0, 3, backZ - 0.25, 0, "Explore Istanbul Events");

    // Event Posters (Paper quads on walls)
    const addPoster = (x, y, z, ry, color) => {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
        p.position.set(x, y, z);
        p.rotation.y = ry;
        add(p, false);
    };
    addPoster(leftX + 0.21, 2.0, 0, Math.PI/2, 0xf1c40f);
    addPoster(leftX + 0.21, 2.0, 2, Math.PI/2, 0xe67e22);
    addPoster(leftX + 0.21, 2.0, -2, Math.PI/2, 0xe74c3c);

    // ── ROOF ─────────────────────────────────────────────────────────────────
    box(W + WALL_T*2 + 0.4, 0.4, D + WALL_T*2 + 0.4, blueMat, 0, H + 0.2, 0);

    // ── FINAL ────────────────────────────────────────────────────────────────
    group.rotation.y = -Math.PI / 2; // Face towards plaza (+X direction)
    group.position.set(px, 0, pz);
    scene.add(group);

    if (physics && groundMaterial) {
        addBuildingShellPhysics(
            physics,
            groundMaterial,
            group,
            buildRectDoorShellBoxes({
                W,
                D,
                H,
                wallT: WALL_T,
                doorW,
                lintel: { type: 'wugo', doorH }
            })
        );
    }

    return {
        group,
        doorGroup,
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
