import * as THREE from 'three';

export function createHumanoid(color = 0xee5253, headColor = 0xffccaa, hasSword = true) {
    const root = new THREE.Group();
    
    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.4), bodyMat);
    body.position.y = 1.1; // Centered
    root.add(body);
    
    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.5 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), headMat);
    head.position.y = 1.8;
    root.add(head);

    // Helpers for pivoting
    function createLimb(width, height, depth, colorHex, pX, pY, pZ) {
        const pGroup = new THREE.Group();
        pGroup.position.set(pX, pY, pZ);
        
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = -height / 2; // Offset so it hinges at the top
        pGroup.add(mesh);
        
        return { group: pGroup, mesh };
    }
    
    // Legs
    const legL = createLimb(0.25, 0.6, 0.25, color, -0.15, 0.6, 0);
    const legR = createLimb(0.25, 0.6, 0.25, color, 0.15, 0.6, 0);
    root.add(legL.group);
    root.add(legR.group);

    // Arms
    const armL = createLimb(0.2, 0.7, 0.2, color, -0.4, 1.5, 0);
    const armR = createLimb(0.2, 0.7, 0.2, color, 0.4, 1.5, 0);
    root.add(armL.group);
    root.add(armR.group);
    
    if (hasSword) {
        const swordGeo = new THREE.BoxGeometry(0.05, 1.0, 0.15);
        // Pivot point at the hilt
        const swordMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.9, roughness: 0.1 });
        const sword = new THREE.Mesh(swordGeo, swordMat);
        sword.position.y = -0.4;
        
        const hiltgeo = new THREE.BoxGeometry(0.1, 0.2, 0.2);
        const hilt = new THREE.Mesh(hiltgeo, new THREE.MeshStandardMaterial({color: 0x833471}));
        hilt.position.y = 0.1;

        const swordGroup = new THREE.Group();
        swordGroup.add(sword);
        swordGroup.add(hilt);
        
        // Attach to bottom of Arm R
        swordGroup.position.y = -0.7; // Bottom of arm
        swordGroup.rotation.x = -Math.PI / 2; // Point forward basically
        swordGroup.position.z = 0.4;
        
        armR.group.add(swordGroup);
    }
    
    root.userData = {
        legL: legL.group,
        legR: legR.group,
        armL: armL.group,
        armR: armR.group,
        clockOffset: Math.random() * Math.PI * 2
    };
    
    root.scale.setScalar(0.7); // Adjust overall size
    
    return root;
}
