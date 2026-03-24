import * as THREE from 'three';

/**
 * StreetProps — Collections of decorative sidewalk elements.
 */

export function createStreetLight(color = 0xffffff) {
    const group = new THREE.Group();

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.2, metalness: 0.8 });
    const lampMat = new THREE.MeshStandardMaterial({
        color: 0xffffee,
        emissive: 0xfff4d6,
        emissiveIntensity: 2.0,
        roughness: 0.1
    });

    // Main pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6, 8), poleMat);
    pole.position.y = 3;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    // Ornament at base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8), poleMat);
    base.position.y = 0.4;
    group.add(base);

    // Arm
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), poleMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(0.5, 5.8, 0);
    group.add(arm);

    // Lamp head
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.2, 0.4, 12), poleMat);
    head.position.set(1.1, 5.6, 0);
    group.add(head);

    // Glowing bulb
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), lampMat);
    bulb.position.set(1.1, 5.45, 0);
    group.add(bulb);

    // Point Light
    const light = new THREE.PointLight(0xfff4d6, 15, 12);
    light.position.set(1.1, 5.3, 0);
    light.castShadow = true;
    light.shadow.bias = -0.005;
    group.add(light);

    return group;
}

export function createBench() {
    const group = new THREE.Group();

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.7 });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.6, 1.2);
    const legL = new THREE.Mesh(legGeo, metalMat);
    legL.position.set(-1.2, 0.3, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = legL.clone();
    legR.position.x = 1.2;
    group.add(legR);

    // Seat slats
    const slatGeo = new THREE.BoxGeometry(2.8, 0.08, 0.15);
    for (let i = 0; i < 5; i++) {
        const slat = new THREE.Mesh(slatGeo, woodMat);
        slat.position.set(0, 0.6, -0.45 + i * 0.22);
        slat.castShadow = true;
        group.add(slat);
    }

    // Back slats
    const backSlatGeo = new THREE.BoxGeometry(2.8, 0.15, 0.08);
    for (let i = 0; i < 3; i++) {
        const slat = new THREE.Mesh(backSlatGeo, woodMat);
        slat.position.set(0, 0.9 + i * 0.22, -0.55);
        slat.rotation.x = -0.1;
        slat.castShadow = true;
        group.add(slat);
    }

    // Armrests
    const armGeo = new THREE.BoxGeometry(0.12, 0.08, 0.8);
    const armL = new THREE.Mesh(armGeo, metalMat);
    armL.position.set(-1.2, 0.85, -0.1);
    group.add(armL);

    const armR = armL.clone();
    armR.position.x = 1.2;
    group.add(armR);

    return group;
}

export function createTrashCan() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.6 });
    
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 1.0, 16), metalMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 24), metalMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.0;
    group.add(rim);

    // Ash tray top
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16), metalMat);
    top.position.y = 0.95;
    group.add(top);

    return group;
}

export function createPlanter() {
    const group = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.9 });
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 1.0 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.8 });

    // Box
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.5), concreteMat);
    box.position.y = 0.3;
    box.castShadow = true;
    group.add(box);

    // Dirt
    const dirt = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 1.3), dirtMat);
    dirt.position.y = 0.58;
    group.add(dirt);

    // Simple bush logic
    for (let i = 0; i < 5; i++) {
        const bush = new THREE.Mesh(
            new THREE.SphereGeometry(0.35 + Math.random() * 0.2, 8, 8),
            leafMat
        );
        bush.position.set(
            (Math.random() - 0.5) * 0.8,
            0.6 + Math.random() * 0.3,
            (Math.random() - 0.5) * 0.8
        );
        bush.scale.y = 0.8 + Math.random() * 0.4;
        group.add(bush);
    }

    return group;
}
