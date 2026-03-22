import * as THREE from 'three';

const WEAPON_TYPES = ['sword', 'axe', 'spear', 'hammer', 'shield'];

function createWeapon(type) {
    const wpnGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.9, roughness: 0.1 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.8 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff6348, emissiveIntensity: 1.5 });
    
    switch(type) {
        case 'sword': {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.15), metalMat);
            blade.position.y = -0.4;
            const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.2), new THREE.MeshStandardMaterial({color: 0x833471}));
            hilt.position.y = 0.1;
            wpnGroup.add(blade, hilt);
            break;
        }
        case 'axe': {
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), handleMat);
            handle.position.y = -0.3;
            // Axe head = flat wide box
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.06), metalMat);
            head.position.set(0.15, -0.7, 0);
            wpnGroup.add(handle, head);
            break;
        }
        case 'spear': {
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8), handleMat);
            shaft.position.y = -0.6;
            // Spear tip = cone
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 6), metalMat);
            tip.position.y = -1.4;
            tip.rotation.x = Math.PI; // Point down (will be rotated in attachment)
            wpnGroup.add(shaft, tip);
            break;
        }
        case 'hammer': {
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), handleMat);
            rod.position.y = -0.3;
            // Hammer head = thick box
            const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.25), metalMat);
            hammerHead.position.y = -0.7;
            // Glow core in hammer
            const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), glowMat);
            core.position.y = -0.7;
            wpnGroup.add(rod, hammerHead, core);
            break;
        }
        case 'shield': {
            // Shield = disc on arm
            const disc = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16),
                new THREE.MeshStandardMaterial({ color: 0xf9ca24, metalness: 0.7, roughness: 0.3 })
            );
            disc.rotation.x = Math.PI / 2;
            disc.position.y = -0.3;
            // Boss/emblem on shield
            const emblem = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), glowMat);
            emblem.position.set(0, -0.3, 0.04);
            wpnGroup.add(disc, emblem);
            break;
        }
    }
    return wpnGroup;
}

export function createHumanoid(color, headColor, hasWeapon = true, weaponType = null) {
    const root = new THREE.Group();

    // Body (Hexagonal Armor Core)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6 });
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.9, 6);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
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
        mesh.position.y = -height / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        pGroup.add(mesh);
        
        return { group: pGroup, mesh };
    }

    // Robotic limbs
    const legL = createLimb(0.12, 0.08, 0.8, color, -0.2, 0.7, 0);
    const legR = createLimb(0.12, 0.08, 0.8, color, 0.2, 0.7, 0);
    root.add(legL.group);
    root.add(legR.group);

    const armL = createLimb(0.1, 0.06, 0.7, headColor, -0.45, 1.5, 0);
    const armR = createLimb(0.1, 0.06, 0.7, headColor, 0.45, 1.5, 0);
    root.add(armL.group);
    root.add(armR.group);
    
    if (hasWeapon) {
        // Pick a random weapon if not specified
        const wpnType = weaponType || WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
        const weapon = createWeapon(wpnType);
        
        // Attach to right arm
        weapon.position.y = -0.7;
        weapon.rotation.x = -Math.PI / 2;
        weapon.position.z = 0.4;
        armR.group.add(weapon);

        // If shield, attach to left arm too
        if (wpnType === 'shield') {
            // Give the right arm a sword instead 
            const swd = createWeapon('sword');
            swd.position.y = -0.7;
            swd.rotation.x = -Math.PI / 2;
            swd.position.z = 0.4;
            // swap: shield goes to left arm, sword to right
            armR.group.remove(weapon);
            armR.group.add(swd);
            weapon.position.y = -0.5;
            weapon.rotation.x = 0;
            weapon.position.z = 0.3;
            armL.group.add(weapon);
        }
    }
    
    root.userData = {
        legL: legL.group,
        legR: legR.group,
        armL: armL.group,
        armR: armR.group,
        clockOffset: Math.random() * Math.PI * 2
    };
    
    root.scale.setScalar(0.7);
    
    return root;
}
