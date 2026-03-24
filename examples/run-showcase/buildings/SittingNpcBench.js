import * as THREE from 'three';
import { createBench } from './StreetProps.js';

/**
 * A combined prop: A wooden bench with a static NPC sitting and reading a newspaper.
 */
export class SittingNpcBench {
    constructor(scene, x, z, rotationY) {
        this.group = new THREE.Group();
        this.group.position.set(x, 0.06, z);
        this.group.rotation.y = rotationY;
        scene.add(this.group);

        // Randomize colors
        const skins = [0xe0ac69, 0xf1c27d, 0x8d5524, 0xc68642];
        const clothes = [0x3366ff, 0xeb4034, 0x228b22, 0xd4ac0d, 0x6a0dad, 0x333333];
        this.skinColor = skins[Math.floor(Math.random() * skins.length)];
        this.clothesColor = clothes[Math.floor(Math.random() * clothes.length)];

        // Parts for animation
        this.parts = {
            torso: null,
            head: null,
            news: null,
            lArm: null,
            rArm: null
        };

        // 1. The Bench
        const bench = createBench();
        this.group.add(bench);

        // 2. The Sitting NPC
        this._createSittingCharacter();

        // 3. The Newspaper
        this._createNewspaper();
    }

    _createSittingCharacter() {
        const npcGroup = new THREE.Group();
        npcGroup.position.set(0.4, 0.6, -0.15); // Sit on one side of the bench
        this.group.add(npcGroup);

        const skinMat = new THREE.MeshPhongMaterial({ color: this.skinColor });
        const clothesMat = new THREE.MeshPhongMaterial({ color: this.clothesColor });

        // Torso
        this.parts.torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), clothesMat);
        this.parts.torso.position.y = 0.3;
        npcGroup.add(this.parts.torso);

        // Head
        this.parts.head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), skinMat);
        this.parts.head.position.y = 0.8;
        this.parts.head.rotation.x = 0.3; // Looking down at news
        npcGroup.add(this.parts.head);

        // Legs (Bent)
        const legGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
        const lLeg = new THREE.Mesh(legGeo, clothesMat);
        lLeg.position.set(-0.12, 0.1, 0.3);
        lLeg.rotation.x = -Math.PI / 2;
        npcGroup.add(lLeg);

        const rLeg = new THREE.Mesh(legGeo, clothesMat);
        rLeg.position.set(0.12, 0.1, 0.3);
        rLeg.rotation.x = -Math.PI / 2;
        npcGroup.add(rLeg);

        // Lower legs (down to floor)
        const lowerLegGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
        const lLower = new THREE.Mesh(lowerLegGeo, clothesMat);
        lLower.position.set(-0.12, -0.2, 0.6);
        npcGroup.add(lLower);

        const rLower = new THREE.Mesh(lowerLegGeo, clothesMat);
        rLower.position.set(0.12, -0.2, 0.6);
        npcGroup.add(rLower);

        // Arms (Holding news)
        const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
        this.parts.lArm = new THREE.Mesh(armGeo, clothesMat);
        this.parts.lArm.position.set(-0.35, 0.45, 0.2);
        this.parts.lArm.rotation.x = -1.0;
        npcGroup.add(this.parts.lArm);

        this.parts.rArm = new THREE.Mesh(armGeo, clothesMat);
        this.parts.rArm.position.set(0.35, 0.45, 0.2);
        this.parts.rArm.rotation.x = -1.0;
        npcGroup.add(this.parts.rArm);
    }

    _createNewspaper() {
        const newsGeo = new THREE.BoxGeometry(0.6, 0.02, 0.45);
        const newsMat = new THREE.MeshPhongMaterial({ color: 0xf5f5f5 });
        this.parts.news = new THREE.Mesh(newsGeo, newsMat);
        
        // Position it in front of the NPC's lap/arms
        this.parts.news.position.set(0.4, 1.05, 0.45);
        this.parts.news.rotation.x = 0.5;
        this.group.add(this.parts.news);

        // Add some "text" lines
        const lineGeo = new THREE.PlaneGeometry(0.4, 0.01);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
        for (let i = 0; i < 6; i++) {
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.position.set(0, 0.011, -0.15 + i * 0.06);
            this.parts.news.add(line);
        }
    }
}
