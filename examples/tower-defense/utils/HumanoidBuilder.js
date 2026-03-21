import * as THREE from 'three';

export function createHumanoid(color, headColor, hasSword = true) {
    const root = new THREE.Group();

    // Body (Hexagonal Armor Core)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6 });
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.9, 6);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1; // Centered
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);
    
    // Glowing Core Reactor on chest
    const coreGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16);
    coreGeo.rotateZ(Math.PI/2);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 1.5 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.z = 0.2;
    body.add(coreMesh);
    
    // Head (Cybernetic Helmet)
    const headMat = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.3, metalness: 0.8 });
    const headGeo = new THREE.DodecahedronGeometry(0.28);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.8;
    head.castShadow = true;
    head.receiveShadow = true;
    
    // Cyberpunk Visor
    const visorGeo = new THREE.BoxGeometry(0.4, 0.08, 0.15);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f2fe, emissiveIntensity: 1.0 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0, 0.25);
    head.add(visor);
    root.add(head);

    // Helpers for robotic joints
    function createLimb(topR, botR, height, colorHex, pX, pY, pZ) {
        const pGroup = new THREE.Group();
        pGroup.position.set(pX, pY, pZ);
        
        const geo = new THREE.CylinderGeometry(topR, botR, height, 6);
        const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5, metalness: 0.7 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = -height / 2; // Offset so it hinges at the top
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        pGroup.add(mesh);
        
        return { group: pGroup, mesh };
    }

    // Robotic limbs (thicker tops, thinner bottoms)
    const legL = createLimb(0.12, 0.08, 0.8, color, -0.2, 0.7, 0); // Left Leg
    const legR = createLimb(0.12, 0.08, 0.8, color, 0.2, 0.7, 0);  // Right Leg
    root.add(legL.group);
    root.add(legR.group);

    const armL = createLimb(0.1, 0.06, 0.7, headColor, -0.45, 1.5, 0); // Left Arm
    const armR = createLimb(0.1, 0.06, 0.7, headColor, 0.45, 1.5, 0);  // Right Arm
    root.add(armL.group);
    root.add(armR.group);
    
    if (hasSword) {
        const swordGeo = new THREE.BoxGeometry(0.05, 1.0, 0.15);
        // Pivot point at the hilt
        const swordMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.9, roughness: 0.1 });
        const sword = new THREE.Mesh(swordGeo, swordMat);
        sword.position.y = -0.4;
        sword.castShadow = true;
        
        const hiltgeo = new THREE.BoxGeometry(0.1, 0.2, 0.2);
        const hilt = new THREE.Mesh(hiltgeo, new THREE.MeshStandardMaterial({color: 0x833471}));
        hilt.position.y = 0.1;
        hilt.castShadow = true;

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
