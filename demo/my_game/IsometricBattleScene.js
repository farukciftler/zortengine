import * as THREE from 'three';
import {
    AudioManager,
    CameraManager,
    Enemy,
    GameScene,
    InputManager,
    MemoryCleaner,
    ModularCharacter,
    ParticleManager,
    PhysicsManager,
    PostProcessManager,
    UIManager
} from 'zortengine';
import { DemoHud } from './DemoHud.js';
import { PlayerMovementController } from './PlayerMovementController.js';
import { ProjectileSystem } from './ProjectileSystem.js';

export class IsometricBattleScene extends GameScene {
    constructor() {
        super({ name: 'battle' });
        this.environmentMeshes = [];
        this.currentHp = 100;
    }

    setup() {
        const platform = this.engine.platform;
        const physics = this.registerSystem('physics', new PhysicsManager(), { priority: 100 });
        const cameraManager = this.registerSystem('camera', new CameraManager(this.threeScene), { priority: 10 });
        const input = this.registerSystem(
            'input',
            new InputManager({
                platform,
                domElement: this.engine.renderer.domElement,
                pointerLockElement: this.engine.renderer.domElement,
                autoAttach: false
            }),
            { priority: 5 }
        );
        const particles = this.registerSystem('particles', new ParticleManager(this.threeScene), { priority: 110 });
        const ui = this.registerSystem(
            'ui',
            new UIManager({
                platform,
                parent: this.engine.container
            }),
            { priority: 200 }
        );
        this.registerSystem('audio', new AudioManager(cameraManager), { priority: 20 });

        cameraManager.setPreset('2.5d');
        this.setCamera(cameraManager);

        const postProcessor = new PostProcessManager(
            this.engine.renderer,
            this.threeScene,
            cameraManager.getThreeCamera()
        );
        postProcessor.setBloomOptions(1.2, 0.5, 0.85);
        this.setPostProcessor(postProcessor);

        this.hud = new DemoHud(ui);
        this.hud.setup();
        this.engine.events.on('hp_changed', hp => this.hud.updateHealth(hp));

        this.projectiles = this.registerSystem(
            'projectiles',
            new ProjectileSystem({
                scene: this.threeScene,
                particleManager: particles,
                onAmmoChanged: (freeCount, totalCount) => this.hud.updateAmmo(freeCount, totalCount)
            }),
            { priority: 105 }
        );

        input.on('attack', () => this.shoot());

        this._createLights();
        this._createWorld(physics);
        this._createActors(physics, input, particles);
    }

    _createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.threeScene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.threeScene.add(dirLight);
    }

    _createWorld(physics) {
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
        this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
        this.groundMesh.receiveShadow = true;
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.threeScene.add(this.groundMesh);
        this.environmentMeshes.push(this.groundMesh);
        physics.addBody(physics.createGround(), this.groundMesh);

        const rampGeo = new THREE.BoxGeometry(6, 1, 10);
        const rampMat = new THREE.MeshStandardMaterial({ color: 0xe67e22 });
        this.rampMesh = new THREE.Mesh(rampGeo, rampMat);
        this.rampMesh.position.set(-8, 1, 5);
        this.rampMesh.rotation.z = -Math.PI / 8;
        this.rampMesh.castShadow = true;
        this.rampMesh.receiveShadow = true;
        this.threeScene.add(this.rampMesh);
        this.environmentMeshes.push(this.rampMesh);
        physics.addBody(
            physics.createTrimesh(rampGeo, 0, this.rampMesh.position, this.rampMesh.quaternion),
            this.rampMesh
        );

        const boxGeo = new THREE.BoxGeometry(2, 2, 2);
        const boxMat = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            emissive: 0x3498db,
            emissiveIntensity: 2.0
        });
        this.physicsBoxMesh = new THREE.Mesh(boxGeo, boxMat);
        this.physicsBoxMesh.castShadow = true;
        this.threeScene.add(this.physicsBoxMesh);
        physics.addBody(physics.createBox(2, 2, 2, 5, { x: 3, y: 20, z: -3 }), this.physicsBoxMesh);
        this.environmentMeshes.push(this.physicsBoxMesh);
    }

    _createActors(physics, input, particles) {
        this.player = new ModularCharacter(null, 0, 0, {
            colorSuit: 0xe74c3c,
            speed: 8
        });
        this.add(this.player);

        this.playerBody = physics.createCharacterBody(0.6, { x: 0, y: 5, z: 0 });
        physics.addBody(this.playerBody, this.player.group);
        this.player.addComponent(
            'movement',
            new PlayerMovementController({
                input,
                body: this.playerBody,
                particleManager: particles,
                speed: 12
            })
        );

        this.enemy = new Enemy(null, 5, 0, this.player);
        this.enemy.hp = 100;
        this.add(this.enemy);

        this.projectiles.setTarget(this.enemy, target => {
            target.isDestroyed = true;
            MemoryCleaner.dispose(target.group);
            this.remove(target);
        });
    }

    shoot() {
        if (!this.player || !this.projectiles) return;

        const direction = new THREE.Vector3();
        const camera = this.getCamera().getThreeCamera();
        const input = this.getSystem('input');
        const intersections = input.getRaycastIntersection(camera, this.environmentMeshes);

        if (intersections.length > 0) {
            const targetPoint = intersections[0].point.clone();
            targetPoint.y = this.player.group.position.y + 1.2;
            direction.subVectors(targetPoint, this.player.group.position).normalize();
            this.player.group.rotation.y = Math.atan2(direction.x, direction.z);
        } else {
            direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.group.rotation.y);
        }

        this.projectiles.shoot(this.player.group.position, direction);
    }

    onUpdate(delta) {
        if (this.player) {
            this.getCamera().updateFollow(this.player.group.position, 0, delta, {
                orthoOffset: new THREE.Vector3(18, 18, 18),
                lookOffset: new THREE.Vector3(0, 1.5, 0),
                smoothing: 6
            });
        }

        if (this.enemy && !this.enemy.isDestroyed && this.enemy.fsm.getCurrentState() === 'attack') {
            this.currentHp -= 20 * delta;
            if (this.currentHp < 0) this.currentHp = 100;
            this.engine.events.emit('hp_changed', this.currentHp);

            const particles = this.getSystem('particles');
            if (particles && Math.random() > 0.8) {
                particles.emit(this.player.group.position, 1, {
                    color: 0x900000,
                    speed: 3,
                    scale: 0.4,
                    life: 0.4
                });
            }
        }
    }
}
