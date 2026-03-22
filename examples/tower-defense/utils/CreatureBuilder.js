import * as THREE from 'three';

/**
 * Creates various non-humanoid enemy meshes.
 */

// Flying mechanical drone with spinning propellers
export function createDroneMesh(color) {
    const root = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 2.0 });

    // Central sphere body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), mat);
    body.position.y = 1.5;
    body.castShadow = true;
    root.add(body);

    // Eye / sensor
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), glowMat);
    eye.position.set(0, 1.5, 0.35);
    root.add(eye);

    // 4 propeller arms
    const armGeo = new THREE.BoxGeometry(0.08, 0.05, 0.8);
    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i;
        const arm = new THREE.Mesh(armGeo, mat);
        arm.position.set(Math.cos(angle) * 0.6, 1.6, Math.sin(angle) * 0.6);
        arm.rotation.y = angle;
        root.add(arm);

        // Propeller disc
        const prop = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.02, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
        );
        prop.position.set(Math.cos(angle) * 0.9, 1.7, Math.sin(angle) * 0.9);
        prop.userData.propeller = true;
        root.add(prop);
    }

    root.userData = { isDrone: true, clockOffset: Math.random() * Math.PI * 2 };
    root.scale.setScalar(0.8);
    return root;
}

// Mechanical spider with 6 legs
export function createSpiderMesh(color) {
    const root = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff0000, emissiveIntensity: 1.5 });

    // Flat oval body
    const bodyGeo = new THREE.SphereGeometry(0.5, 8, 6);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.scale.set(1.2, 0.5, 1.0);
    body.position.y = 0.7;
    body.castShadow = true;
    root.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mat);
    head.position.set(0, 0.75, 0.5);
    root.add(head);

    // Eyes (2 red glowing)
    for (let side = -1; side <= 1; side += 2) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), glowMat);
        eye.position.set(side * 0.12, 0.82, 0.7);
        root.add(eye);
    }

    // 6 legs (3 per side)
    const legs = [];
    const legGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.7, 6);
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 3; i++) {
            const legGroup = new THREE.Group();
            const zOffset = (i - 1) * 0.35;
            legGroup.position.set(side * 0.5, 0.6, zOffset);

            // Upper segment
            const upper = new THREE.Mesh(legGeo, mat);
            upper.rotation.z = side * 0.8;
            upper.position.set(side * 0.25, 0, 0);
            legGroup.add(upper);

            // Lower segment
            const lower = new THREE.Mesh(legGeo, mat);
            lower.rotation.z = side * -0.3;
            lower.position.set(side * 0.5, -0.3, 0);
            legGroup.add(lower);

            root.add(legGroup);
            legs.push(legGroup);
        }
    }

    root.userData = {
        isSpider: true,
        legs,
        clockOffset: Math.random() * Math.PI * 2
    };
    root.scale.setScalar(0.9);
    return root;
}

// Massive crystal golem - late game heavy enemy
export function createGolemMesh(color) {
    const root = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 });
    const crystalMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, emissive: color, emissiveIntensity: 1.0,
        transparent: true, opacity: 0.8, metalness: 1.0, roughness: 0.0
    });

    // Massive blocky torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.8), rockMat);
    torso.position.y = 1.4;
    torso.castShadow = true;
    root.add(torso);

    // Shoulder boulders
    for (let side = -1; side <= 1; side += 2) {
        const shoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), rockMat);
        shoulder.position.set(side * 0.7, 1.9, 0);
        shoulder.castShadow = true;
        root.add(shoulder);
    }

    // Head = rough dodecahedron
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), rockMat);
    head.position.y = 2.3;
    root.add(head);

    // Crystal core in chest (glowing)
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), crystalMat);
    core.position.set(0, 1.4, 0.45);
    root.add(core);

    // Thick legs
    const legGeo = new THREE.BoxGeometry(0.4, 0.9, 0.4);
    const legL = new THREE.Mesh(legGeo, rockMat);
    legL.position.set(-0.3, 0.45, 0);
    legL.castShadow = true;
    const legR = new THREE.Mesh(legGeo, rockMat);
    legR.position.set(0.3, 0.45, 0);
    legR.castShadow = true;
    root.add(legL, legR);

    // Massive arms
    const armGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const armLG = new THREE.Group();
    armLG.position.set(-0.75, 1.5, 0);
    armLG.add(new THREE.Mesh(armGeo, rockMat));
    // Fist
    armLG.add((() => { const f = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), rockMat); f.position.y = -0.5; return f; })());

    const armRG = new THREE.Group();
    armRG.position.set(0.75, 1.5, 0);
    armRG.add(new THREE.Mesh(armGeo, rockMat));
    armRG.add((() => { const f = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), rockMat); f.position.y = -0.5; return f; })());

    root.add(armLG, armRG);

    root.userData = {
        isGolem: true,
        core,
        armL: armLG,
        armR: armRG,
        legL, legR,
        clockOffset: Math.random() * Math.PI * 2
    };
    root.scale.setScalar(0.7);
    return root;
}
