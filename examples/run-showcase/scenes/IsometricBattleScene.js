// Legacy sample scene.
// Aktif showcase akisi artik examples/run-showcase/scenes/RunScene.js uzerinden yurur.
import * as THREE from 'three';
import {
    GameScene,
} from 'zortengine';
import {
    AudioManager,
    CameraManager,
    InputManager,
    ParticleManager,
    UIManager
} from 'zortengine/browser';
import { MemoryCleaner } from 'zortengine/devtools';
import { Enemy, ModularCharacter } from 'zortengine/objects';
import { PhysicsManager } from 'zortengine/physics';
import { DemoHud } from '../app/DemoHud.js';
import { PlayerMovementController } from '../app/PlayerMovementController.js';
import { ProjectileSystem } from '../app/ProjectileSystem.js';

export class IsometricBattleScene extends GameScene {
    constructor() {
        super({ name: 'battle' });
        this.environmentMeshes = [];
        this.currentHp = 100;
        this.cameraMode = '2.5d';
        this.yaw = Math.PI;
        this.pitch = 0.35;
    }

    setup() {
        const platform = this.engine.platform;
        const physics = this.registerSystem('physics', new PhysicsManager({
            gravity: { x: 0, y: -18, z: 0 },
            defaultContactMaterial: {
                friction: 0.45,
                restitution: 0.02
            }
        }), { priority: 100 });
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
        input.on('viewToggle', () => this.toggleCameraMode());
        input.isFpsMode = false;

        this.groundMaterial = physics.createMaterial('ground', { friction: 0.9, restitution: 0.0 });
        this.playerMaterial = physics.createMaterial('player', { friction: 0.0, restitution: 0.0 });
        this.propMaterial = physics.createMaterial('prop', { friction: 0.6, restitution: 0.08 });
        physics.addContactMaterial(this.playerMaterial, this.groundMaterial, { friction: 0.0, restitution: 0.0 });
        physics.addContactMaterial(this.playerMaterial, this.propMaterial, { friction: 0.15, restitution: 0.0 });
        physics.addContactMaterial(this.propMaterial, this.groundMaterial, { friction: 0.8, restitution: 0.02 });

        this._createLights();
        this._createWorld(physics);
        this._createActors(physics, input, particles, cameraManager);
    }

    _createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.threeScene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -60;
        dirLight.shadow.camera.right = 60;
        dirLight.shadow.camera.top = 60;
        dirLight.shadow.camera.bottom = -60;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 120;
        dirLight.shadow.bias = -0.0002;
        dirLight.shadow.normalBias = 0.02;
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
        physics.addBody(physics.createGround(100, 100, {
            material: this.groundMaterial
        }), this.groundMesh);

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
            physics.createBox(6, 1, 10, 0, this.rampMesh.position, this.rampMesh.quaternion, {
                material: this.groundMaterial
            }),
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
        this.boxBody = physics.createBox(2, 2, 2, 18, { x: 3, y: 20, z: -3 }, null, {
            material: this.propMaterial,
            linearDamping: 0.35,
            angularDamping: 0.45,
            friction: 0.6,
            restitution: 0.02,
            gravityScale: 1.0
        });
        physics.addBody(this.boxBody, this.physicsBoxMesh);
        this.environmentMeshes.push(this.physicsBoxMesh);
    }

    _createActors(physics, input, particles, cameraManager) {
        this.player = new ModularCharacter(null, 0, 0, {
            colorSuit: 0xe74c3c,
            speed: 8
        });
        this.add(this.player);

        this.playerBody = physics.createCharacterBody(0.6, { x: 0, y: 5, z: 0 }, 2.2, {
            mass: 80,
            material: this.playerMaterial,
            friction: 0.0,
            restitution: 0.0,
            linearDamping: 0.82,
            angularDamping: 1.0
        });
        physics.addBody(this.playerBody, this.player.group);
        this.player.addComponent(
            'movement',
            new PlayerMovementController({
                input,
                body: this.playerBody,
                physics,
                cameraManager,
                particleManager: particles,
                speed: 12,
                jumpVelocity: 9.5,
                mode: this.cameraMode === 'tps' ? 'tps' : 'isometric'
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

        if (this.cameraMode === 'tps') {
            if (!input.isPointerLocked()) return;

            camera.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();
            this.player.group.rotation.y = Math.atan2(direction.x, direction.z);
        } else {
            const intersections = input.getRaycastIntersection(camera, this.environmentMeshes);

            if (intersections.length > 0) {
                const targetPoint = intersections[0].point.clone();
                targetPoint.y = this.player.group.position.y + 1.2;
                direction.subVectors(targetPoint, this.player.group.position).normalize();
                this.player.group.rotation.y = Math.atan2(direction.x, direction.z);
            } else {
                direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.group.rotation.y);
            }
        }

        this.projectiles.shoot(this.player.group.position, direction);
    }

    onUpdate(delta) {
        const input = this.getSystem('input');
        const movement = this.player?.getComponent('movement');

        if (this.cameraMode === 'tps' && input?.isPointerLocked()) {
            const mouseDelta = input.getMouseDelta();
            this.yaw -= mouseDelta.x * 0.0025;
            this.pitch += mouseDelta.y * 0.0015;
            this.pitch = Math.max(-0.2, Math.min(0.75, this.pitch));
        }

        if (movement) {
            movement.setMode(this.cameraMode === 'tps' ? 'tps' : 'isometric');
        }

        if (this.player) {
            if (this.cameraMode === 'tps') {
                this.getCamera().updateFollow(this.player.group.position, this.yaw, delta, {
                    backOffset: 5.5,
                    heightOffset: 1.6,
                    pitch: this.pitch
                }, this.environmentMeshes);
            } else {
                this.getCamera().updateFollow(this.player.group.position, 0, delta, {
                    orthoOffset: new THREE.Vector3(18, 18, 18),
                    lookOffset: new THREE.Vector3(0, 1.5, 0),
                    smoothing: 6
                });
            }
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

    toggleCameraMode() {
        const input = this.getSystem('input');
        const movement = this.player?.getComponent('movement');
        const camera = this.getCamera();

        if (!input || !camera) return;

        if (this.cameraMode === '2.5d') {
            this.cameraMode = 'tps';
            camera.setPreset('tps');
            input.isFpsMode = true;
            this.hud.updateInfo('TPS modu: ekrana tikla, mouse ile bak. Space ziplama, tik ates, V geri doner.');
            if (movement) movement.setMode('tps');
        } else {
            this.cameraMode = '2.5d';
            camera.setPreset('2.5d');
            input.isFpsMode = false;
            input.exitPointerLock();
            this.hud.updateInfo('2.5D izometrik mod: WASD hareket, Space ziplama, tik ates, V kamera gecisi.');
            if (movement) movement.setMode('isometric');
        }
    }
}
