import * as THREE from 'three';
import {
    AbilitySystem,
    AudioManager,
    CameraManager,
    CollectibleActor,
    CollectibleSystem,
    DamageSystem,
    EncounterDirector,
    GameScene,
    InputManager,
    MemoryCleaner,
    ObjectiveZoneActor,
    ObjectiveZoneSystem,
    ParticleManager,
    PhysicsManager,
    ProjectileSystem,
    SpawnSystem,
    UIManager
} from 'zortengine';
import { createDashAbility } from '../abilities/DashAbility.js';
import { createPrimaryFireAbility } from '../abilities/PrimaryFireAbility.js';
import { EnemyActor } from '../actors/EnemyActor.js';
import { PlayerActor } from '../actors/PlayerActor.js';
import { PlayerMovementController } from '../actors/PlayerMovementController.js';
import { getRandomRelic } from '../items/RelicDefinitions.js';
import { MetaProgression } from '../runtime/MetaProgression.js';
import { RunState } from '../runtime/RunState.js';
import { RunHud } from '../ui/RunHud.js';

export class RunScene extends GameScene {
    constructor() {
        super({ name: 'run' });
        this.environmentMeshes = [];
        this.currentHp = 100;
        this.cameraMode = '2.5d';
        this.yaw = Math.PI;
        this.pitch = 0.35;
        this.pendingRestart = false;
        this.spawnPoints = [
            new THREE.Vector3(8, 0, 8),
            new THREE.Vector3(-10, 0, 6),
            new THREE.Vector3(12, 0, -8),
            new THREE.Vector3(-12, 0, -10)
        ];
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
        const input = this.registerSystem('input', new InputManager({
            platform,
            domElement: this.engine.renderer.domElement,
            pointerLockElement: this.engine.renderer.domElement,
            autoAttach: false
        }), { priority: 5 });
        const particles = this.registerSystem('particles', new ParticleManager(this.threeScene), { priority: 110 });
        const damage = this.registerSystem('damage', new DamageSystem(), { priority: 103 });
        const abilities = this.registerSystem('abilities', new AbilitySystem(), { priority: 104 });
        this.runState = new RunState();
        this.metaProgression = new MetaProgression().load();
        const ui = this.registerSystem('ui', new UIManager({
            platform,
            parent: this.engine.container
        }), { priority: 200 });
        this.registerSystem('audio', new AudioManager(cameraManager), { priority: 20 });

        cameraManager.setPreset('2.5d');
        this.setCamera(cameraManager);

        this.hud = new RunHud(ui);
        this.hud.setup();
        this._hpChangedListener = hp => this.hud.updateHealth(hp);
        this.engine.events.on('hp_changed', this._hpChangedListener);
        this.hud.updateRunState(this.runState.essence, this.runState.getRelicCount());
        this.hud.updateStatus('AKTIF');
        this.hud.updateMetaProgress(
            this.metaProgression.bankEssence,
            this.metaProgression.completedRuns,
            this.metaProgression.failedRuns
        );

        this.projectiles = this.registerSystem('projectiles', new ProjectileSystem({
            scene: this.threeScene,
            particleManager: particles,
            damageSystem: damage,
            onAmmoChanged: (freeCount, totalCount) => this.hud.updateAmmo(freeCount, totalCount)
        }), { priority: 105 });

        input.on('attack', () => this.useAbility('primaryFire'));
        input.on('skill1', () => this.useAbility('dash'));
        input.on('viewToggle', () => this.toggleCameraMode());
        input.on('restart', () => this._requestRestart());
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
        this._setupExtraction();
        this._setupPickups();
        this._setupAbilities(abilities, input, particles, cameraManager);
        this._setupWaves();
    }

    onExit() {
        if (this._hpChangedListener) {
            this.engine?.events?.off('hp_changed', this._hpChangedListener);
        }
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
        physics.addBody(physics.createGround(100, 100, { material: this.groundMaterial }), this.groundMesh);

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

        this.extractionGate = new ObjectiveZoneActor(null, 0, -6, {
            isActive: false,
            radius: 1.8
        });
        this.add(this.extractionGate);
    }

    _createActors(physics, input, particles, cameraManager) {
        this.player = new PlayerActor(null, 0, 0, {
            colorSuit: 0xe74c3c,
            speed: 8,
            maxHp: 100
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
        this.player.addComponent('movement', new PlayerMovementController({
            input,
            body: this.playerBody,
            physics,
            cameraManager,
            particleManager: particles,
            speed: 12,
            jumpVelocity: 9.5,
            mode: this.cameraMode === 'tps' ? 'tps' : 'isometric'
        }));

        this.activeEnemies = [];
        this.pickups = [];
    }

    _setupAbilities(abilitySystem, input, particles, cameraManager) {
        if (!this.player) return;

        abilitySystem.grantAbility(this.player, 'primaryFire', createPrimaryFireAbility({
            projectileSystem: this.projectiles,
            cameraManager,
            input,
            obstacles: this.environmentMeshes,
            getCameraMode: () => this.cameraMode,
            getDamage: () => 25 + this.runState.modifiers.projectileDamageBonus,
            getFireRateScale: () => this.runState.modifiers.fireRateScale,
            cooldown: 0.16
        }));

        abilitySystem.grantAbility(this.player, 'dash', createDashAbility({
            input,
            particleManager: particles,
            dashStrength: 16,
            dashDuration: 0.14,
            getCooldownScale: () => this.runState.modifiers.dashCooldownScale,
            cooldown: 1.2
        }));
    }

    _setupPickups() {
        this.pickupSystem = this.registerSystem('pickups', new CollectibleSystem({
            collector: this.player,
            getCollectibles: () => this.pickups,
            onCollect: pickup => this._handlePickup(pickup)
        }), { priority: 111 });
    }

    _setupExtraction() {
        this.extractionSystem = this.registerSystem('extraction', new ObjectiveZoneSystem({
            target: this.player,
            actor: this.extractionGate,
            onEnter: () => this._completeRun()
        }), { priority: 112 });
    }

    useAbility(abilityId) {
        if (!this.player) return false;
        return this.getSystem('abilities')?.useAbility(this.player, abilityId) || false;
    }

    _setupWaves() {
        this.enemySpawner = new SpawnSystem({
            scene: this,
            spawnFactory: (spawnPoint, enemyOptions) => {
                return new EnemyActor(null, spawnPoint.x, spawnPoint.z, this.player, enemyOptions);
            }
        });

        this.waveDirector = new EncounterDirector({
            spawner: this.enemySpawner,
            spawnPoints: this.spawnPoints,
            waves: [
                { count: 2, spawnInterval: 0.45, entityOptions: { maxHp: 60 } },
                { count: 3, spawnInterval: 0.4, entityOptions: { maxHp: 85 } },
                { count: 4, spawnInterval: 0.35, entityOptions: { maxHp: 110 } }
            ],
            onWaveChanged: info => {
                if (info.waveNumber > 1) {
                    this._spawnRelicPickup();
                }
                this.hud.updateWave(info.waveNumber, info.totalWaves, this.waveDirector?.getAliveCount() || 0);
            },
            onEntitySpawned: enemy => {
                this.activeEnemies.push(enemy);
                this.hud.updateWave(
                    this.waveDirector.getCurrentWaveNumber(),
                    this.waveDirector.getTotalWaves(),
                    this.waveDirector.getAliveCount()
                );
            },
            onEntityDefeated: enemy => {
                if (!enemy) return;
                this._spawnEssencePickup(enemy.group.position.clone(), 1);
                MemoryCleaner.dispose(enemy.group);
                this.remove(enemy);
                this.activeEnemies = this.activeEnemies.filter(item => item && item !== enemy && !item.isDestroyed);
                this.hud.updateWave(
                    this.waveDirector.getCurrentWaveNumber(),
                    this.waveDirector.getTotalWaves(),
                    this.waveDirector.getAliveCount()
                );
            },
            onCompleted: () => {
                this._spawnRelicPickup(new THREE.Vector3(0, 0, -6));
                this.runState.unlockExtraction();
                this.extractionGate?.setActive(true);
                this.hud.updateStatus('EXTRACTION ACIK');
                this.hud.updateInfo('Tum dalgalar temizlendi. Relic topla ve yesil extraction kapisina gir.');
            }
        });

        this.projectiles.setTargetProvider(
            () => this.waveDirector.getLivingEntities(),
            target => {
                target.isDestroyed = true;
            }
        );

        this.waveDirector.start();
    }

    _spawnEssencePickup(position, amount = 1) {
        const pickup = new CollectibleActor(null, position.x, position.z, {
            type: 'essence',
            y: 0.8,
            radius: 0.7,
            payload: { amount },
            color: 0x7dd3fc
        });
        this.pickups.push(pickup);
        this.add(pickup);
    }

    _spawnRelicPickup(position = new THREE.Vector3(0, 0, 6)) {
        const relic = getRandomRelic(this.runState.relics);
        if (!relic) return;

        const pickup = new CollectibleActor(null, position.x, position.z, {
            type: 'relic',
            y: 1.0,
            radius: 1.0,
            payload: { relic },
            label: relic.name,
            color: 0xf8e16c
        });
        this.pickups.push(pickup);
        this.add(pickup);
        this.hud.updateInfo(`Yeni relic dustu: ${relic.name}. Uzerinden gecerek topla.`);
    }

    _handlePickup(pickup) {
        this.pickups = this.pickups.filter(item => item && item !== pickup && !item.isDestroyed);
        this.remove(pickup);

        if (pickup.type === 'essence') {
            this.runState.addEssence(pickup.payload.amount || 1);
        }

        if (pickup.type === 'relic' && pickup.payload.relic) {
            const relic = this.runState.addRelic(pickup.payload.relic);
            this._applyRunModifiers();
            if (relic) {
                this.hud.updateInfo(`Relic alindi: ${relic.name} - ${relic.description}`);
            }
        }

        this.hud.updateRunState(this.runState.essence, this.runState.getRelicCount());
    }

    _applyRunModifiers() {
        const movement = this.player?.getComponent('movement');
        if (movement) {
            movement.jumpVelocity = 9.5 + this.runState.modifiers.jumpBonus;
        }
    }

    _completeRun() {
        if (this.runState.status !== 'active') return;
        this.runState.complete();
        this.metaProgression.recordRun(this.runState);
        this.hud.updateStatus('TAMAMLANDI');
        this.hud.updateMetaProgress(
            this.metaProgression.bankEssence,
            this.metaProgression.completedRuns,
            this.metaProgression.failedRuns
        );
        this.hud.updateInfo(`Run tamamlandi. Essence bankaya eklendi. R ile yeniden basla.`);
        if (this.extractionGate) {
            this.extractionGate.setActive(false);
        }
    }

    _failRun() {
        if (this.runState.status !== 'active') return;
        this.runState.fail();
        this.metaProgression.recordRun(this.runState);
        this.hud.updateStatus('BASARISIZ');
        this.hud.updateMetaProgress(
            this.metaProgression.bankEssence,
            this.metaProgression.completedRuns,
            this.metaProgression.failedRuns
        );
        this.hud.updateInfo('Oyuncu dustu. R ile runi yeniden baslat.');
        if (this.extractionGate) {
            this.extractionGate.setActive(false);
        }
    }

    _requestRestart() {
        if (this.runState.status !== 'active') {
            this.pendingRestart = true;
        }
    }

    _restartRun() {
        if (!this.engine) return;
        const engine = this.engine;

        this.pendingRestart = false;
        engine.sceneManager.removeScene('run');
        engine.addScene('run', new RunScene());
        engine.useScene('run');
    }

    onUpdate(delta) {
        const input = this.getSystem('input');
        const movement = this.player?.getComponent('movement');

        if (this.pendingRestart) {
            this._restartRun();
            return;
        }

        if (this.cameraMode === 'tps' && input?.isPointerLocked()) {
            const mouseDelta = input.getMouseDelta();
            this.yaw -= mouseDelta.x * 0.0025;
            this.pitch += mouseDelta.y * 0.0015;
            this.pitch = Math.max(-0.2, Math.min(0.75, this.pitch));
        }

        if (movement) {
            movement.setMode(this.cameraMode === 'tps' ? 'tps' : 'isometric');
        }

        const playerHealth = this.player?.getComponent('health');
        if (playerHealth) {
            this.engine.events.emit('hp_changed', playerHealth.health);
            if (!playerHealth.isAlive()) {
                this._failRun();
            }
        }

        if (this.waveDirector && this.runState.status === 'active') {
            this.waveDirector.update(delta);
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

        const livingEnemies = this.waveDirector ? this.waveDirector.getLivingEntities() : [];
        for (const enemy of livingEnemies) {
            if (this.runState.status === 'active' && enemy && !enemy.isDestroyed && enemy.fsm.getCurrentState() === 'attack') {
                this.getSystem('damage')?.applyDamage(this.player, 20 * delta, {
                    type: 'melee',
                    source: 'enemy'
                });

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

    toggleCameraMode() {
        const input = this.getSystem('input');
        const movement = this.player?.getComponent('movement');
        const camera = this.getCamera();
        if (!input || !camera) return;

        if (this.cameraMode === '2.5d') {
            this.cameraMode = 'tps';
            camera.setPreset('tps');
            input.isFpsMode = true;
            this.hud.updateInfo('TPS modu: ekrana tikla, mouse ile bak. Space ziplama, tik ates, Q dash, V geri doner.');
            if (movement) movement.setMode('tps');
        } else {
            this.cameraMode = '2.5d';
            camera.setPreset('2.5d');
            input.isFpsMode = false;
            input.exitPointerLock();
            this.hud.updateInfo('2.5D izometrik mod: WASD hareket, Space ziplama, tik ates, Q dash, V kamera gecisi.');
            if (movement) movement.setMode('isometric');
        }
    }
}
