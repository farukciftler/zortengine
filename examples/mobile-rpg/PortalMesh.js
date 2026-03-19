import * as THREE from 'three';

/**
 * Gerçekçi portal: taş kemer + içinde enerji yüzeyi.
 * type: 'world' (yeşil/doğa) | 'dungeon' (karanlık/mağara) | 'hub' (mor/güvenli)
 */
export function createPortalMesh(type = 'world') {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: type === 'dungeon' ? 0x3d3d3d : 0x6b5b4f,
    roughness: 0.9,
    metalness: 0.05,
    bumpScale: 0.1
  });

  // Taş kemer — iki sütun + üst lent
  const columnGeo = new THREE.BoxGeometry(0.5, 2.2, 0.5);
  const leftCol = new THREE.Mesh(columnGeo, stoneMat);
  leftCol.position.set(-1.1, 1.1, 0);
  leftCol.castShadow = true;
  group.add(leftCol);

  const rightCol = new THREE.Mesh(columnGeo, stoneMat);
  rightCol.position.set(1.1, 1.1, 0);
  rightCol.castShadow = true;
  group.add(rightCol);

  const lintelGeo = new THREE.BoxGeometry(2.8, 0.4, 0.6);
  const lintel = new THREE.Mesh(lintelGeo, stoneMat);
  lintel.position.set(0, 2.4, 0);
  lintel.castShadow = true;
  group.add(lintel);

  // Zemin taşı (portalın altı)
  const baseGeo = new THREE.BoxGeometry(2.4, 0.15, 1);
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.set(0, 0.075, 0);
  base.receiveShadow = true;
  group.add(base);

  // Portal enerji yüzeyi — kemerin içinde
  const config = {
    world: { color: 0x2ecc71, emissive: 0x1a5f2e, intensity: 0.6 },
    dungeon: { color: 0x8b4513, emissive: 0x4a2500, intensity: 0.5 },
    hub: { color: 0x3498db, emissive: 0x1a4d6e, intensity: 0.5 }
  };
  const cfg = config[type] ?? config.world;

  const fillGeo = new THREE.CircleGeometry(0.85, 24);
  const fillMat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    emissive: cfg.emissive,
    emissiveIntensity: cfg.intensity,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.rotation.x = Math.PI / 2;
  fill.position.y = 1.2;
  group.add(fill);

  // İnce çerçeve (rün benzeri)
  const frameGeo = new THREE.RingGeometry(0.8, 0.95, 24);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    emissive: cfg.emissive,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.rotation.x = Math.PI / 2;
  frame.position.y = 1.2;
  group.add(frame);

  group.userData.portalFill = fill;
  group.userData.portalFrame = frame;
  return group;
}
