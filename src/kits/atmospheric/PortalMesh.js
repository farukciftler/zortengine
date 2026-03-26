import * as THREE from 'three';

/**
 * PortalMesh — A high-quality portal visual component with stone frame and energy surface.
 * @param {string} type 'world' | 'dungeon' | 'hub'
 * @returns {THREE.Group}
 */
export function createPortalMesh(type = 'world') {
    const group = new THREE.Group();

    const stoneMat = new THREE.MeshStandardMaterial({
        color: type === 'dungeon' ? 0x3d3d3d : (type === 'hub' ? 0x4a4a5a : 0x6b5b4f),
        roughness: 0.9,
        metalness: 0.1
    });

    // Outer Frame — Two pillars + lintel
    const pillarGeo = new THREE.BoxGeometry(0.5, 2.5, 0.5);
    const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
    leftPillar.position.set(-1.2, 1.25, 0);
    leftPillar.castShadow = true;
    group.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
    rightPillar.position.set(1.2, 1.25, 0);
    rightPillar.castShadow = true;
    group.add(rightPillar);

    const lintelGeo = new THREE.BoxGeometry(3.0, 0.5, 0.7);
    const lintel = new THREE.Mesh(lintelGeo, stoneMat);
    lintel.position.set(0, 2.75, 0);
    lintel.castShadow = true;
    group.add(lintel);

    // Energy Surface (Inner)
    const config = {
        world: { color: 0x2ecc71, emissive: 0x1a5f2e, intensity: 0.8 },
        dungeon: { color: 0xe67e22, emissive: 0x5e2a00, intensity: 0.7 },
        hub: { color: 0x3498db, emissive: 0x1a4d6e, intensity: 0.8 }
    };
    const cfg = config[type] || config.world;

    const energyGeo = new THREE.PlaneGeometry(1.9, 2.5);
    const energyMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: cfg.intensity,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const energySurface = new THREE.Mesh(energyGeo, energyMat);
    energySurface.position.y = 1.25;
    group.add(energySurface);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(0.8, 1.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 1.25;
    ring.position.z = 0.1;
    group.add(ring);

    group.userData = { energySurface, ring, type };
    
    /**
     * Optional simple animation handler
     */
    group.animate = (time) => {
        energySurface.material.opacity = 0.7 + Math.sin(time * 3) * 0.1;
        ring.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    };

    return group;
}
