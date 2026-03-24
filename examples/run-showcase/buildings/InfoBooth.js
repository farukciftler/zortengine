import * as THREE from 'three';
import { ModularCharacter } from '../../../src/kits/characters/ModularCharacter.js';

/**
 * buildInfoBooth - A small sidewalk hut with an NPC attendant.
 */
export function buildInfoBooth(scene, physics, material, position = [0, 0, 0]) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = Math.PI / 2; // Face the road (+X)
    scene.add(group);

    // Booth materials
    const boothMat = new THREE.MeshStandardMaterial({ 
        color: 0x34495e, 
        roughness: 0.4, 
        metalness: 0.6 
    });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ 
        color: 0x81d4fa, 
        transparent: true, 
        opacity: 0.4 
    });

    const box = (w, h, d, mat, x, y, z) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        return mesh;
    };

    // 1. Structure
    // Floor
    box(2.2, 0.2, 2.2, boothMat, 0, 0.1, 0);
    // Walls
    box(0.2, 2.8, 2.2, boothMat, -1.0, 1.6, 0); // Left
    box(0.2, 2.8, 2.2, boothMat, 1.0, 1.6, 0);  // Right
    box(2.2, 2.8, 0.2, boothMat, 0, 1.6, -1.0); // Back
    
    // Front half wall (Counter height)
    box(2.2, 1.1, 0.2, boothMat, 0, 0.65, 1.0);
    
    // Counter surface
    box(2.4, 0.1, 0.6, woodMat, 0, 1.15, 0.9);
    
    // Glass window (upper front)
    box(1.8, 1.5, 0.05, glassMat, 0, 2.0, 1.0);
    
    // Top trim / Sign area
    box(2.4, 0.6, 2.4, boothMat, 0, 3.2, 0);
    
    // Roof (Flat with slight overhang)
    box(2.8, 0.1, 2.8, boothMat, 0, 3.5, 0);

    // Minor Detail: Map on counter wall
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 128; mapCanvas.height = 128;
    const mctx = mapCanvas.getContext('2d');
    mctx.fillStyle = '#ecf0f1'; mctx.fillRect(0,0,128,128);
    mctx.strokeStyle = '#3498db'; mctx.lineWidth = 4;
    mctx.strokeRect(10,10,108,108);
    // Draw some lines
    mctx.beginPath(); mctx.moveTo(20,40); mctx.lineTo(100,60); mctx.stroke();
    mctx.moveTo(30,100); mctx.lineTo(80,20); mctx.stroke();
    const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(mapCanvas) }));
    mapMesh.position.set(-0.7, 0.7, 1.11);
    group.add(mapMesh);

    // "INFO" Sign
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(0,0,256,128);
        ctx.fillStyle = '#000'; ctx.font = 'bold 80px Courier New';
        ctx.textAlign = 'center'; ctx.fillText('INFO', 128, 90);
        const signTex = new THREE.CanvasTexture(canvas);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: signTex }));
        sign.position.set(0, 3.2, 1.21);
        group.add(sign);
    }

    // 2. NPC (The Attendant)
    const attendant = new ModularCharacter(scene, position[0], position[2], {
        colorSuit: 0xe67e22, // Orange uniform
        colorSkin: 0xffdbac,
        scale: 0.95
    });
    
    // Detach from scene-level updates so we can control position within the group
    scene.remove(attendant); 
    // Actually ModularCharacter constructor adds to scene. 
    // We want it to be a child of our booth group for easy positioning.
    group.add(attendant.group);
    // Set to idle pose
    attendant.group.position.set(0, 0.2, -0.2);
    attendant.group.rotation.y = 0; // Face local +Z (Window)
    attendant.fsm.setState('idle');

    // 3. Physics
    if (physics) {
        const body = physics.createBox(
            2.2, 3.5, 2.2, 
            0, // mass 0 for static
            { x: position[0], y: 1.75 + 0.05, z: position[2] }, // Sidewalk offset 0.05
            group.quaternion,
            { material: material }
        );
        // Visual offset to prevent hovering: mesh was at 0, body center at 1.75
        physics.addBody(body, group, { offset: new THREE.Vector3(0, -1.75, 0) });
    }

    return { 
        group, 
        attendant,
        update: (delta, time) => {
             attendant.update(delta, time);
                         // Dynamic head tracking for the attendant
             const player = scene.player;
             if (player && player.group) {
                 const dx = player.group.position.x - group.position.x;
                 const dz = player.group.position.z - group.position.z;
                 const distSq = dx * dx + dz * dz;

                 // Only look if within 6 meters and in front (+X side)
                 if (distSq < 36 && dx > 0) {
                     // Angle relative to the booth's facing (+X)
                     const angleAcrossSidewalk = Math.atan2(dz, dx);
                     const targetHeadY = -angleAcrossSidewalk * 0.8; 
                     attendant.limbs.head.rotation.y += (targetHeadY - attendant.limbs.head.rotation.y) * 0.1;
                 } else {
                     // Look back to center
                     attendant.limbs.head.rotation.y += (0 - attendant.limbs.head.rotation.y) * 0.05;
                 }
             }
        }
    };
}
