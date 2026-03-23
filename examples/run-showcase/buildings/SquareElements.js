import * as THREE from 'three';

/**
 * Modern Urban Bench
 */
export function buildBench(scene, x, z, ry = 0) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.6);
    [[-0.8, 0], [0.8, 0]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, ironMat);
        leg.position.set(lx, 0.25, lz);
        group.add(leg);
    });

    // Seat (slats)
    for (let i = 0; i < 4; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.12), woodMat);
        slat.position.set(0, 0.52, -0.22 + i * 0.15);
        slat.castShadow = true;
        group.add(slat);
    }

    // Backrest
    for (let i = 0; i < 2; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.05), woodMat);
        slat.position.set(0, 0.8 + i * 0.15, -0.28);
        slat.castShadow = true;
        group.add(slat);
    }

    group.position.set(x, 0, z);
    group.rotation.y = ry;
    scene.add(group);
    return group;
}

/**
 * Modern Planter with Flowers
 */
export function buildPlanter(scene, x, z) {
    const group = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
    const dirtMat     = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 1.0 });
    const stemMat     = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });

    // Pot
    const pot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.5), concreteMat);
    pot.position.y = 0.3;
    pot.castShadow = true;
    group.add(pot);

    // Dirt
    const dirt = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 1.3), dirtMat);
    dirt.position.y = 0.55;
    group.add(dirt);

    // Flowers (simple spheres on stems)
    const flowerColors = [0xe91e63, 0x9c27b0, 0xffeb3b, 0x2196f3];
    for (let i = 0; i < 8; i++) {
        const fx = (Math.random() - 0.5) * 1.0;
        const fz = (Math.random() - 0.5) * 1.0;
        const fh = 0.2 + Math.random() * 0.3;

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, fh), stemMat);
        stem.position.set(fx, 0.6 + fh/2, fz);
        group.add(stem);

        const petals = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6),
            new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length] }));
        petals.position.set(fx, 0.6 + fh, fz);
        group.add(petals);
    }

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

/**
 * Square Floor Tiles (Area)
 */
export function buildSquarePattern(scene, x, z, w, d) {
    const group = new THREE.Group();
    const tileMat1 = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 });
    const tileMat2 = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });

    const step = 2; // tile size
    for (let ix = -w/2; ix < w/2; ix += step) {
        for (let iz = -d/2; iz < d/2; iz += step) {
            const mat = ((ix + iz) / step) % 2 === 0 ? tileMat1 : tileMat2;
            const tile = new THREE.Mesh(new THREE.PlaneGeometry(step * 0.95, step * 0.95), mat);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(ix + step/2, 0.05, iz + step/2);
            tile.receiveShadow = true;
            group.add(tile);
        }
    }

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

/**
 * Modern Street Lamp
 */
export function buildStreetLamp(scene, x, z) {
    const group = new THREE.Group();
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
    const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2.0
    });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 6, 8), ironMat);
    pole.position.y = 3;
    pole.castShadow = true;
    group.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.15), ironMat);
    arm.position.set(0.6, 5.8, 0);
    group.add(arm);

    const lightHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), ironMat);
    lightHead.position.set(1.2, 5.7, 0);
    group.add(lightHead);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), bulbMat);
    bulb.position.set(1.2, 5.5, 0);
    group.add(bulb);

    // Point Light
    const pointLight = new THREE.PointLight(0xffffaa, 15, 20);
    pointLight.position.set(x + 1.2, 5.5, z);
    scene.add(pointLight);

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

/**
 * Modern Urban Fence (Glass + Steel)
 * Connects p1 to p2 with collision.
 */
export function buildFence(scene, physics, groundMaterial, p1, p2, height = 2.5) {
    const group = new THREE.Group();
    const pos1 = new THREE.Vector3(p1[0], 0, p1[1]);
    const pos2 = new THREE.Vector3(p2[0], 0, p2[1]);
    const distance = pos1.distanceTo(pos2);
    const center = new THREE.Vector3().lerpVectors(pos1, pos2, 0.5);
    const angle = Math.atan2(pos2.x - pos1.x, pos2.z - pos1.z);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x9ecde8, transparent: true, opacity: 0.15,
        side: THREE.DoubleSide, depthWrite: false
    });

    // Center-offset everything so group.position = body.position
    group.position.set(center.x, height / 2, center.z);
    group.rotation.y = angle + Math.PI / 2;
    scene.add(group);

    // Main glass panel centered at 0 in group
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(distance, height), glassMat);
    group.add(glass);

    // Top & Bottom rails relative to center
    [-(height/2) + 0.05, (height/2) - 0.05].forEach(y => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(distance, 0.1, 0.1), steelMat);
        rail.position.y = y;
        group.add(rail);
    });

    // End posts
    [[-distance/2, 0], [distance/2, 0]].forEach(([lx]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, height + 0.1, 8), steelMat);
        post.position.set(lx, 0, 0);
        group.add(post);
    });

    if (physics && groundMaterial) {
        // Static body at the exact group location
        const body = physics.createBox(distance, height, 1.5, 0, 
            group.position, 
            group.quaternion, 
            { material: groundMaterial }
        );
        physics.addBody(body, group);
    }

    return group;
}

