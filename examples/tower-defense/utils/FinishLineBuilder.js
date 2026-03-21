import * as THREE from 'three';

/**
 * Creates a minimalist racing finish line.
 * Features two tall posts, a crossbar, and a waving checkered flag.
 * Rotated 90 degrees to face the path correctly.
 */
export function createFinishLine() {
    const group = new THREE.Group();

    // 1. Tall Industrial Posts
    const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 5.0, 12);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    
    // Positioned left/right relative to Z axis (so it spans across the path)
    const postA = new THREE.Mesh(postGeo, postMat);
    postA.position.set(0, 0.4, -2.1);
    postA.castShadow = true;
    
    const postB = new THREE.Mesh(postGeo, postMat);
    postB.position.set(0, 0.4, 2.1);
    postB.castShadow = true;
    
    group.add(postA, postB);

    // 2. Crossbar (Spanning Z axis)
    const barGeo = new THREE.BoxGeometry(0.1, 0.1, 4.2);
    const bar = new THREE.Mesh(barGeo, postMat);
    bar.position.set(0, 2.7, 0);
    group.add(bar);

    // 3. Checkered Flag Hanging from Crossbar
    const flagGroup = new THREE.Group();
    const flagWidth = 4.0;
    const flagHeight = 1.0;
    const flagCellsX = 16;
    const flagCellsY = 4;
    const cellW = flagWidth / flagCellsX;
    const cellH = flagHeight / flagCellsY;

    for (let x = 0; x < flagCellsX; x++) {
        for (let y = 0; y < flagCellsY; y++) {
            const isWhite = (x + y) % 2 === 0;
            const fGeo = new THREE.PlaneGeometry(cellW, cellH);
            const fMat = new THREE.MeshBasicMaterial({ color: isWhite ? 0xffffff : 0x010101, side: THREE.DoubleSide });
            const piece = new THREE.Mesh(fGeo, fMat);
            
            // Align flag to face X axis (rotated 90 deg relative to before)
            // It hangs on the Z plane
            piece.rotation.y = Math.PI / 2; 
            piece.position.set(
                0,
                -(y + 0.5) * cellH,
                (x - flagCellsX/2 + 0.5) * cellW
            );
            piece.userData.origY = piece.position.y;
            piece.userData.origX = piece.position.x;
            piece.userData.phase = x * 0.4;
            flagGroup.add(piece);
        }
    }
    flagGroup.position.set(0, 2.65, 0);
    group.add(flagGroup);

    // Rotate the entire thing so it faces the "incoming" direction if needed, 
    // but here we just place it spanning across.
    
    return { group, flag: flagGroup };
}


