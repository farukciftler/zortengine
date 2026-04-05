import { GameScene, GameObject } from 'zortengine';
import { CameraManager, InputManager } from 'zortengine/browser';
import { PhysicsManager } from 'zortengine/physics';
import * as THREE from 'three';
import { BalanceSystem } from '../systems/BalanceSystem.js';
import { SpawnerSystem } from '../systems/SpawnerSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { Player } from '../actors/Player.js';

export class BalanceScene extends GameScene {
    constructor() {
        super();
        this.platform = null;
        this.player = null;
        this.cameraManager = null;
        this.physics = null;
    }

    async setup() {
        // Environment
        const ambient = new THREE.AmbientLight(0x404040, 2);
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(10, 20, 10);
        this.threeScene.add(ambient, sun);

        // Grid Floor (Atmospheric)
        const grid = new THREE.GridHelper(100, 50, 0x00f3ff, 0x1a0a2e);
        grid.position.y = -5;
        this.threeScene.add(grid);

        // The Platform
        this.createPlatform();

        // Player
        this.player = new Player();
        this.player.group.position.set(0, 0, 0);
        this.add(this.player);

        // Camera
        this.cameraManager = new CameraManager(this.threeScene);
        this.cameraManager.setPreset('tps');
        this.setCamera(this.cameraManager);

        // Physics
        this.physics = this.registerSystem('physics', new PhysicsManager({
            gravity: { x: 0, y: -20, z: 0 }
        }), { priority: 100 });

        // Platform Physics
        const platformBody = this.physics.createBox(10, 0.5, 40, 0, this.platform.group.position);
        this.physics.addBody(platformBody, this.platform.group);
        this.platformBody = platformBody; // Store to update rotation later

        // Player Physics
        const playerBody = this.physics.createCharacterBody(0.6, { x: 0, y: 5, z: 0 }, 1.8, { mass: 80 });
        this.physics.addBody(playerBody, this.player.group);
        this.player.body = playerBody;

        // Systems
        this.registerSystem('input', new InputManager({
            domElement: this.engine.renderer?.domElement,
            autoAttach: true
        }), { priority: 5 });

        this.registerSystem('balance', new BalanceSystem());
        const spawner = new SpawnerSystem();
        spawner.physics = this.physics;
        this.registerSystem('spawner', spawner);
        this.registerSystem('interaction', new InteractionSystem());
    }

    createPlatform() {
        const geometry = new THREE.BoxGeometry(10, 0.5, 40);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x00f3ff,
            emissiveIntensity: 0.2
        });
        
        const platformObj = new GameObject();
        const mesh = new THREE.Mesh(geometry, material);
        platformObj.group.add(mesh);
        
        // Add neon edges
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00f3ff }));
        platformObj.group.add(line);

        this.add(platformObj);
        this.platform = platformObj;
        
        // Pivot visual
        const pivotGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const pivotMesh = new THREE.Mesh(pivotGeom, new THREE.MeshStandardMaterial({ color: 0x333333 }));
        pivotMesh.position.y = -1.25;
        pivotMesh.rotation.z = Math.PI / 2;
        this.threeScene.add(pivotMesh);
    }

    onUpdate(delta, time) {
        if (this.cameraManager && this.player) {
            this.cameraManager.updateFollow(this.player.group.position, 0, delta, {
                backOffset: 12,
                heightOffset: 6,
                pitch: 0.3
            });
        }
        
        // Tilt the platform body (kinematic update)
        if (this.platformBody && this.platform) {
            this.platformBody.quaternion.copy(this.platform.group.quaternion);
        }
    }
}
