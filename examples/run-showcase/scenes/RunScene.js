import * as THREE from 'three';
import {
    GameScene
} from 'zortengine';
import {
    AssetManifest,
    AssetPipeline,
    PrefabFactory
} from 'zortengine/assets';
import {
    MemoryCleaner
} from 'zortengine/devtools';
import { ThreeAssetLoader } from 'zortengine/render';
import {
    CollectibleSystem,
    EncounterDirector,
    ObjectiveZoneSystem,
    ProjectileSystem,
    SpawnSystem,
    EffectRegistry
} from 'zortengine/kits';
import {
    CollectibleActor,
    ObjectiveZoneActor
} from 'zortengine/gameplay';
import { SaveManager } from 'zortengine/persistence';
import { createDashAbility } from '../abilities/DashAbility.js';
import { createPrimaryFireAbility } from '../abilities/PrimaryFireAbility.js';
import { EnemyActor } from '../actors/EnemyActor.js';
import { PlayerActor } from '../actors/PlayerActor.js';
import { PlayerMovementController } from '../actors/PlayerMovementController.js';
import { ENCOUNTER_DEFINITIONS, ROOM_GRAPH, getRoomDefinition } from '../data/EncounterDefinitions.js';
import { getEnemyArchetype } from '../data/EnemyArchetypes.js';
import { getLoadoutDefinition, LOADOUT_DEFINITIONS } from '../data/LoadoutDefinitions.js';
import { WORLD_LAYOUT } from '../data/WorldLayout.js';
import { registerRunEffects } from '../effects/registerRunEffects.js';
import { getRandomRelic, RELIC_DEFINITIONS } from '../items/RelicDefinitions.js';
import { RunReplicationController } from '../runtime/RunReplicationController.js';
import { RunCheckpointController } from '../runtime/RunCheckpointController.js';
import { RunCombatCoordinator } from '../runtime/RunCombatCoordinator.js';
import { RunFlowController } from '../runtime/RunFlowController.js';
import { RunHudPresenter } from '../runtime/RunHudPresenter.js';
import { RunBootstrap } from '../runtime/RunBootstrap.js';
import { MetaProgression } from '../runtime/MetaProgression.js';
import { RunState } from '../runtime/RunState.js';
import { RunHud } from '../ui/RunHud.js';

export class RunScene extends GameScene {
    constructor(options = {}) {
        super({ name: 'run' });
        this.options = options;
        this.environmentMeshes = [];
        this.cameraMode = '2.5d';
        this.yaw = Math.PI;
        this.pitch = 0.35;
        this.pendingRestart = false;
        this.players = [];
        this.playersByProfile = {};
        this.activeEnemies = [];
        this.pickups = [];
        this.choiceQueue = [];
        this.choiceActive = false;
        this.waveDirector = null;
        this.networkPeers = new Map();
        this.remotePlayers = new Map();
    }

    setup() {
        this.metaProgression = new MetaProgression().load();
        this.seed = this.options.seed || this.metaProgression.dailySeed || this.metaProgression.generateDailySeed();
        this.engine.random.setSeed(this.seed);
        this.rng = this.engine.random;
        this.loadout = getLoadoutDefinition(this._resolveLoadoutId());
        this.runState = new RunState({
            seed: this.seed,
            loadoutId: this.loadout.id
        });
        this.saveManager = new SaveManager({
            namespace: 'zortengine-run'
        });
        this.assetManifest = new AssetManifest();
        this.assetLoader = this.engine.assetLoader || new ThreeAssetLoader();
        this.engine.setAssetLoader?.(this.assetLoader);
        this.assetPipeline = new AssetPipeline({
            manifest: this.assetManifest,
            loader: this.assetLoader,
            store: this.engine.assets
        });
        this.effectRegistry = new EffectRegistry();
        registerRunEffects(this.effectRegistry);
        this.prefabs = new PrefabFactory();
        this.bootstrap = new RunBootstrap(this);
        const {
            physics,
            cameraManager,
            input,
            particles,
            damage,
            abilities,
            ui
        } = this.bootstrap.registerCoreSystems();
        this.hud = new RunHud(ui);
        this.hudPresenter = new RunHudPresenter(this, this.hud);
        this.hudPresenter.initialize();
        this.checkpointController = new RunCheckpointController(this, this.saveManager);
        this.combatCoordinator = new RunCombatCoordinator(this);
        this.flowController = new RunFlowController(this);
        this.replicationController = new RunReplicationController(this, this.options.network || null);
        this._registerSnapshotFactories();
        this._setupAssetPipeline();
        this.projectiles = this.registerSystem('projectiles', new ProjectileSystem({
            scene: this.threeScene,
            particleManager: particles,
            damageSystem: damage,
            onAmmoChanged: (freeCount, totalCount) => this.hud.updateAmmo(freeCount, totalCount),
            onHit: info => this._handleProjectileHit(info)
        }), { priority: 105 });

        this._setupPhysicsMaterials(physics);
        this._registerPrefabs(physics);
        this._createLightsFromDefinition(WORLD_LAYOUT.lights);
        this._buildWorldFromDefinition(WORLD_LAYOUT, physics);
        this._createPlayers(physics, input, particles, cameraManager);
        this._setupPickups();
        this._setupExtraction();
        this._setupInputRoutes(input);
        this._setupAbilities(abilities, input, particles, cameraManager);
        this._applyLoadoutModifiers();
        this._enterRoom(ROOM_GRAPH[0].id);
        this.checkpointController.save('setup');
        this.replicationController.connect();

        if (this.options.restoreCheckpoint) {
            this.checkpointController.restoreLatest();
        }
        if (this.options.replayData) {
            this.engine.playReplay(this.options.replayData, this.options.replayData.frames?.length || Infinity);
        }
    }

    onExit() {
        this.replicationController?.disconnect();
        this.hudPresenter?.dispose();
    }

    _resolveLoadoutId() {
        if (this.options.loadoutId) return this.options.loadoutId;
        if (this.metaProgression.unlockedLoadouts.includes('duo-protocol')) {
            return 'duo-protocol';
        }
        return this.metaProgression.unlockedLoadouts.at(-1) || 'vanguard';
    }

    _setupAssetPipeline() {
        this.assetManifest.register('showcase-favicon', {
            url: './favicon.svg',
            type: 'texture',
            group: 'ui',
            preload: false,
            metadata: { purpose: 'demo-icon' }
        });
        this.assetManifest.register('player-model-placeholder', {
            url: './assets/player.glb',
            type: 'model',
            group: 'characters',
            preload: false
        });

        const validation = this.assetPipeline.validateManifest();
        if (!validation.valid) {
            this.hud.updateInfo(`Asset manifest uyarisi: ${validation.errors[0]}`);
        }
    }

    _registerSnapshotFactories() {
        this.registerObjectFactory('EnemyActor', serialized => new EnemyActor(
            null,
            serialized.position.x,
            serialized.position.z,
            this._getPrimaryTarget(),
            {
                ...(serialized.profile || {}),
                maxHp: serialized.profile?.maxHp || 100,
                hp: serialized.hp ?? serialized.profile?.maxHp ?? 100
            }
        ));
        this.registerObjectFactory('Enemy', serialized => new EnemyActor(
            null,
            serialized.position.x,
            serialized.position.z,
            this._getPrimaryTarget(),
            {
                ...(serialized.profile || {}),
                maxHp: serialized.profile?.maxHp || 100,
                hp: serialized.hp ?? serialized.profile?.maxHp ?? 100
            }
        ));
        this.registerObjectFactory('CollectibleActor', serialized => new CollectibleActor(
            null,
            serialized.position.x,
            serialized.position.z,
            {
                type: serialized.collectibleType,
                payload: serialized.payload,
                label: serialized.label,
                y: serialized.baseY,
                radius: serialized.radius
            }
        ));
    }

    _setupPhysicsMaterials(physics) {
        this.groundMaterial = physics.createMaterial('ground', { friction: 0.9, restitution: 0.0 });
        this.playerMaterial = physics.createMaterial('player', { friction: 0.0, restitution: 0.0 });
        this.propMaterial = physics.createMaterial('prop', { friction: 0.6, restitution: 0.08 });
        physics.addContactMaterial(this.playerMaterial, this.groundMaterial, { friction: 0.0, restitution: 0.0 });
        physics.addContactMaterial(this.playerMaterial, this.propMaterial, { friction: 0.15, restitution: 0.0 });
        physics.addContactMaterial(this.propMaterial, this.groundMaterial, { friction: 0.8, restitution: 0.02 });
    }

    _registerPrefabs(physics) {
        this.prefabs.register('ground', ({ definition }) => {
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(definition.size[0], definition.size[1]),
                new THREE.MeshStandardMaterial(definition.material)
            );
            mesh.receiveShadow = true;
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(...definition.position);
            this.threeScene.add(mesh);
            this.environmentMeshes.push(mesh);
            physics.addBody(physics.createGround(definition.size[0], definition.size[1], {
                material: this.groundMaterial
            }), mesh);
            return mesh;
        });

        this.prefabs.register('ramp', ({ definition }) => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(...definition.size),
                new THREE.MeshStandardMaterial(definition.material)
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.set(...definition.position);
            mesh.rotation.z = definition.rotationZ || 0;
            this.threeScene.add(mesh);
            this.environmentMeshes.push(mesh);
            physics.addBody(
                physics.createBox(definition.size[0], definition.size[1], definition.size[2], 0, mesh.position, mesh.quaternion, {
                    material: this.groundMaterial
                }),
                mesh
            );
            return mesh;
        });

        this.prefabs.register('physicsBox', ({ definition }) => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(...definition.size),
                new THREE.MeshStandardMaterial(definition.material)
            );
            mesh.castShadow = true;
            mesh.position.set(...definition.position);
            this.threeScene.add(mesh);
            this.environmentMeshes.push(mesh);
            const body = physics.createBox(
                definition.size[0],
                definition.size[1],
                definition.size[2],
                definition.mass,
                { x: definition.position[0], y: definition.position[1], z: definition.position[2] },
                null,
                {
                    material: this.propMaterial,
                    linearDamping: 0.35,
                    angularDamping: 0.45,
                    friction: 0.6,
                    restitution: 0.02,
                    gravityScale: 1.0
                }
            );
            physics.addBody(body, mesh);
            return { mesh, body };
        });
    }

    _createLightsFromDefinition(definition) {
        const ambientLight = new THREE.AmbientLight(definition.ambient.color, definition.ambient.intensity);
        this.threeScene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(definition.directional.color, definition.directional.intensity);
        dirLight.position.set(...definition.directional.position);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -definition.directional.shadowBounds;
        dirLight.shadow.camera.right = definition.directional.shadowBounds;
        dirLight.shadow.camera.top = definition.directional.shadowBounds;
        dirLight.shadow.camera.bottom = -definition.directional.shadowBounds;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = definition.directional.far;
        dirLight.shadow.bias = -0.0002;
        dirLight.shadow.normalBias = 0.02;
        this.threeScene.add(dirLight);
    }

    _buildWorldFromDefinition(worldDefinition) {
        for (const prop of worldDefinition.props) {
            this.prefabs.create(prop.prefabId, {
                definition: prop
            });
        }

        this.hazards = (worldDefinition.hazards || []).map(hazard => {
            const mesh = new THREE.Mesh(
                new THREE.CylinderGeometry(hazard.radius, hazard.radius, 0.2, 24),
                new THREE.MeshStandardMaterial({
                    color: hazard.color,
                    emissive: hazard.color,
                    emissiveIntensity: 0.8,
                    transparent: true,
                    opacity: 0.45
                })
            );
            mesh.position.set(hazard.position[0], 0.1, hazard.position[2]);
            this.threeScene.add(mesh);
            return {
                ...hazard,
                mesh,
                position: new THREE.Vector3(...hazard.position)
            };
        });

        this.extractionGate = new ObjectiveZoneActor(
            null,
            worldDefinition.extraction.position[0],
            worldDefinition.extraction.position[2],
            {
                isActive: false,
                radius: worldDefinition.extraction.radius
            }
        );
        this.add(this.extractionGate);
        this.spawnPoints = worldDefinition.spawnPoints.map(point => new THREE.Vector3(...point));
    }

    _createPlayers(physics, input, particles, cameraManager) {
        const defaultPlayer = this._createPlayer({
            profile: 'default',
            colorSuit: 0xe74c3c,
            spawn: new THREE.Vector3(0, 5, 0)
        }, physics, input, particles, cameraManager);
        this.player = defaultPlayer;

        if (this.loadout.id === 'duo-protocol') {
            this.supportPlayer = this._createPlayer({
                profile: 'coop',
                colorSuit: 0x2563eb,
                spawn: new THREE.Vector3(2, 5, 1)
            }, physics, input, particles, cameraManager);
        }
    }

    _createPlayer(config, physics, input, particles, cameraManager) {
        const actor = new PlayerActor(null, config.spawn.x, config.spawn.z, {
            colorSuit: config.colorSuit,
            speed: 8,
            maxHp: 100
        });
        this.add(actor);

        const body = physics.createCharacterBody(0.6, {
            x: config.spawn.x,
            y: config.spawn.y,
            z: config.spawn.z
        }, 2.2, {
            mass: 80,
            material: this.playerMaterial,
            friction: 0.0,
            restitution: 0.0,
            linearDamping: 0.82,
            angularDamping: 1.0
        });
        physics.addBody(body, actor.group);
        actor.addComponent('movement', new PlayerMovementController({
            input,
            body,
            physics,
            cameraManager,
            particleManager: particles,
            speed: config.profile === 'coop' ? 10 : 12,
            jumpVelocity: this.runState.modifiers.jumpVelocity,
            mode: this.cameraMode === 'tps' ? 'tps' : 'isometric',
            profile: config.profile,
            rng: this.rng
        }));

        actor.body = body;
        actor.controlProfile = config.profile;
        actor.networkId = config.networkId || null;
        actor.isRemote = config.isRemote || false;
        this.players.push(actor);
        this.playersByProfile[config.profile] = actor;
        return actor;
    }

    _setupInputRoutes(input) {
        input.isFpsMode = false;
        input.on('attack', command => this._handleAbilityCommand(command, 'primaryFire'));
        input.on('skill1', command => this._handleAbilityCommand(command, 'dash'));
        input.on('viewToggle', command => {
            if ((command?.profile || 'default') === 'default') {
                this.toggleCameraMode();
            }
        });
        input.on('restart', command => {
            if ((command?.profile || 'default') === 'default') {
                this._requestRestart();
            }
        });
    }

    _setupAbilities(abilitySystem, input, particles, cameraManager) {
        for (const player of this.players) {
            abilitySystem.grantAbility(player, 'primaryFire', createPrimaryFireAbility({
                projectileSystem: this.projectiles,
                cameraManager,
                input,
                obstacles: this.environmentMeshes,
                getCameraMode: () => this.cameraMode,
                getDamage: () => this._getPlayerStat(player, 'projectileDamage', 25),
                getFireRateScale: () => this._getPlayerStat(player, 'fireRateScale', this.runState.modifiers.fireRateScale),
                cooldown: 0.16
            }));

            abilitySystem.grantAbility(player, 'dash', createDashAbility({
                input,
                particleManager: particles,
                dashStrength: player.controlProfile === 'coop' ? 14 : 16,
                dashDuration: 0.14,
                getCooldownScale: () => this._getPlayerStat(player, 'dashCooldownScale', this.runState.modifiers.dashCooldownScale),
                cooldown: 1.2
            }));
        }
    }

    _setupPickups() {
        this.pickupSystems = this.players.map((player, index) => this.registerSystem(`pickups-${index}`, new CollectibleSystem({
            collector: player,
            getCollectibles: () => this.pickups,
            onCollect: pickup => this._handlePickup(pickup, player)
        }), { priority: 111 + index }));
    }

    _setupExtraction() {
        this.extractionSystems = this.players.map((player, index) => this.registerSystem(`extraction-${index}`, new ObjectiveZoneSystem({
            target: player,
            actor: this.extractionGate,
            onEnter: () => this._completeRun()
        }), { priority: 120 + index }));
    }

    _applyLoadoutModifiers() {
        for (const player of this.players) {
            for (const definition of LOADOUT_DEFINITIONS) {
                this.modifierSystem.removeSource(player, `loadout:${definition.id}`);
            }
            for (const modifier of this.loadout.modifiers) {
                this.modifierSystem.addModifier(player, modifier);
            }

            const health = player.getComponent('health');
            if (health) {
                health.maxHealth = this._getPlayerStat(player, 'maxHealth', 100);
                health.health = health.maxHealth;
            }
        }

        this._applyRunModifiers();
        this.hud.updateInfo(`Loadout: ${this.loadout.name}. ${this.loadout.description}`);
    }

    _getPlayerStat(player, stat, fallback = 0) {
        const base = this.runState.modifiers[stat] ?? fallback;
        return this.modifierSystem.getStat(player, stat, base);
    }

    _enterRoom(roomId) {
        this.currentRoom = getRoomDefinition(roomId);
        this.runState.visitRoom(roomId);
        this.hud.updateRoom(this.currentRoom.label);
        this.hud.updateStatus(`ODA: ${this.currentRoom.label}`);
        this._startEncounter(ENCOUNTER_DEFINITIONS[this.currentRoom.encounterId]);
        this._saveCheckpoint(`room:${roomId}`);
    }

    _startEncounter(encounterDefinition) {
        this.activeEnemies = [];
        this.waveDirector = new EncounterDirector({
            spawner: new SpawnSystem({
                scene: this,
                spawnFactory: (spawnPoint, enemyOptions) => {
                    const profile = getEnemyArchetype(enemyOptions.archetypeId);
                    const target = this._getPrimaryTarget();
                    return new EnemyActor(null, spawnPoint.x, spawnPoint.z, target, {
                        ...profile,
                        ...enemyOptions,
                        maxHp: enemyOptions.maxHp ?? profile.maxHp
                    });
                }
            }),
            spawnPoints: this.spawnPoints,
            waves: encounterDefinition.waves.map(wave => ({
                count: wave.count,
                spawnInterval: wave.spawnInterval,
                entityOptions: {
                    archetypeId: wave.archetypeId
                }
            })),
            onWaveChanged: info => {
                this.hud.updateWave(info.waveNumber, info.totalWaves, this.waveDirector?.getAliveCount() || 0);
                this.hud.updateInfo(`${this.currentRoom.label}: ${encounterDefinition.objective}`);
            },
            onEntitySpawned: enemy => {
                this.activeEnemies.push(enemy);
                this.projectiles.setTargetProvider(() => this.waveDirector?.getLivingEntities() || [], target => {
                    target.isDestroyed = true;
                });
            },
            onEntityDefeated: enemy => {
                if (!enemy) return;
                const essence = enemy.getAttackProfile?.().boss ? 6 : (enemy.getAttackProfile?.().elite ? 3 : 1);
                this._spawnEssencePickup(enemy.group.position.clone(), essence);
                MemoryCleaner.dispose(enemy.group);
                this.remove(enemy);
                this.activeEnemies = this.activeEnemies.filter(item => item && item !== enemy && !item.isDestroyed);
                this.hud.updateWave(
                    this.waveDirector.getCurrentWaveNumber(),
                    this.waveDirector.getTotalWaves(),
                    this.waveDirector.getAliveCount()
                );
            },
            onCompleted: () => this._handleEncounterCompleted()
        });
        this.waveDirector.start();
    }

    _handleEncounterCompleted() {
        const rewards = this.currentRoom.rewards || [];
        this.hud.updateStatus(`TEMIZLENDI: ${this.currentRoom.label}`);

        for (const reward of rewards) {
            if (reward === 'essence') {
                this.runState.addEssence(2);
            }
            if (reward === 'relicChoice') {
                this.choiceQueue.push(() => this._offerRelicChoice());
            }
            if (reward === 'loadoutChoice') {
                this.choiceQueue.push(() => this._offerLoadoutChoice());
            }
            if (reward === 'extraction') {
                this.runState.unlockExtraction();
                this.extractionGate?.setActive(true);
            }
        }

        if (this.currentRoom.next.length > 0) {
            this.choiceQueue.push(() => this._offerRoomChoice(this.currentRoom.next));
        } else if (this.runState.extractionUnlocked) {
            this.hud.updateStatus('EXTRACTION ACIK');
            this.hud.updateInfo('Boss dustu. Extraction kapisina giderek runi tamamla.');
        }

        this.hud.updateRunState(this.runState.essence, this.runState.getRelicCount());
        this._flushChoiceQueue();
    }

    _offerRelicChoice() {
        const choices = [];
        while (choices.length < 3 && choices.length < RELIC_DEFINITIONS.length) {
            const relic = getRandomRelic(
                [...this.runState.relics, ...choices.map(item => item.id)],
                this.rng
            );
            if (!relic) break;
            choices.push(relic);
        }

        this.choiceActive = true;
        this.hud.showChoicePanel('Relic Sec', choices, relic => {
            this.runState.addRelic(relic, this.effectRegistry, {
                runState: this.runState,
                damageSystem: this.getSystem('damage')
            });
            this._applyRunModifiers();
            this.hud.updateInfo(`Relic secildi: ${relic.name}`);
            this.hud.updateRunState(this.runState.essence, this.runState.getRelicCount());
            this.choiceActive = false;
            this._flushChoiceQueue();
        });
    }

    _offerLoadoutChoice() {
        const unlocked = LOADOUT_DEFINITIONS.filter(loadout => this.metaProgression.unlockedLoadouts.includes(loadout.id));
        this.choiceActive = true;
        this.hud.showChoicePanel('Loadout Pivot', unlocked, loadout => {
            this.loadout = loadout;
            this.runState.loadoutId = loadout.id;
            this._applyLoadoutModifiers();
            this.choiceActive = false;
            this._flushChoiceQueue();
        });
    }

    _offerRoomChoice(roomIds) {
        const rooms = roomIds.map(id => getRoomDefinition(id));
        this.choiceActive = true;
        this.hud.showChoicePanel('Sonraki Oda', rooms.map(room => ({
            id: room.id,
            name: room.label,
            description: ENCOUNTER_DEFINITIONS[room.encounterId].objective
        })), room => {
            this.choiceActive = false;
            this._enterRoom(room.id);
            this._flushChoiceQueue();
        });
    }

    _flushChoiceQueue() {
        if (this.choiceActive) return;
        const next = this.choiceQueue.shift();
        if (next) {
            next();
        }
    }

    _handleAbilityCommand(command, abilityId) {
        const profile = command?.profile || 'default';
        const player = this.playersByProfile[profile];
        if (!player || this.runState.status !== 'active' || this.choiceActive) return;

        const used = this.getSystem('abilities')?.useAbility(player, abilityId) || false;
        if (used && abilityId === 'dash' && this.runState.modifiers.dashShield > 0) {
            this.getSystem('damage')?.heal(player, this.runState.modifiers.dashShield * 0.25, {
                type: 'dash-shield',
                source: 'relic'
            });
        }
    }

    _handleProjectileHit({ target, damage }) {
        if (!target || target.isDestroyed) return;

        if (this.runState.modifiers.statusOnHit?.statusId === 'poison-burst' && this.rng.chance(this.runState.modifiers.statusOnHit.chance)) {
            this.statusSystem.addStatus(target, {
                id: 'poison-burst',
                duration: 3,
                tickInterval: 1,
                effects: [
                    { type: 'damageTarget', amount: 6, source: 'poison-burst' }
                ]
            });
        }

        if (this.runState.modifiers.chainChance > 0 && this.rng.chance(this.runState.modifiers.chainChance)) {
            const others = (this.waveDirector?.getLivingEntities() || []).filter(enemy => enemy !== target && !enemy.isDestroyed);
            const chained = this.rng.pick(others);
            if (chained) {
                this.getSystem('damage')?.applyDamage(chained, damage * 0.5, {
                    type: 'chain',
                    source: 'chain-reactor'
                });
                this.getSystem('particles')?.emit(chained.group.position, 5, {
                    color: 0xfbbf24,
                    speed: 4,
                    scale: 0.3,
                    life: 0.35
                });
            }
        }
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

    _handlePickup(pickup) {
        this.pickups = this.pickups.filter(item => item && item !== pickup && !item.isDestroyed);
        this.remove(pickup);

        if (pickup.type === 'essence') {
            this.runState.addEssence(pickup.payload.amount || 1);
        }

        this.hud.updateRunState(this.runState.essence, this.runState.getRelicCount());
    }

    _applyRunModifiers() {
        for (const player of this.players) {
            const movement = player?.getComponent('movement');
            if (movement) {
                movement.jumpVelocity = this._getPlayerStat(player, 'jumpVelocity', this.runState.modifiers.jumpVelocity);
            }
        }
    }

    _getPrimaryTarget() {
        return this.players.find(player => !player.isDestroyed) || this.player;
    }

    _getCameraFocusPosition() {
        const alivePlayers = this.players.filter(player => !player.isDestroyed);
        if (alivePlayers.length === 0) return new THREE.Vector3();
        if (alivePlayers.length === 1) return alivePlayers[0].group.position;

        const midpoint = new THREE.Vector3();
        for (const player of alivePlayers) {
            midpoint.add(player.group.position);
        }
        midpoint.multiplyScalar(1 / alivePlayers.length);
        return midpoint;
    }

    _processEnemyAttacks(delta) {
        this.combatCoordinator.processEnemyAttacks(delta);
    }

    _processHazards(delta) {
        this.combatCoordinator.processHazards(delta);
    }

    _getClosestPlayer(position) {
        return this.combatCoordinator.getClosestPlayer(position);
    }

    _saveCheckpoint(reason) {
        return this.checkpointController.save(reason);
    }

    _restoreLatestCheckpoint() {
        return this.checkpointController.restoreLatest();
    }

    _handlePeerJoined(peer) {
        this.replicationController.handlePeerJoined(peer);
    }

    _handlePeerLeft(peer) {
        this.replicationController.handlePeerLeft(peer);
    }

    _handleNetworkMessage(message) {
        this.replicationController.handleMessage(message);
    }

    _applyRemoteState(payload) {
        this.replicationController.applyRemoteState(payload);
    }

    _completeRun() {
        this.flowController.completeRun();
    }

    _failRun() {
        this.flowController.failRun();
    }

    _requestRestart() {
        this.flowController.requestRestart();
    }

    _restartRun() {
        this.flowController.restartRun();
    }

    onUpdate(delta) {
        const input = this.getSystem('input');

        if (this.flowController.consumePendingRestart()) {
            return;
        }

        this.runState.update(delta);

        if (this.cameraMode === 'tps' && input?.isPointerLocked()) {
            const mouseDelta = input.getMouseDelta();
            this.yaw -= mouseDelta.x * 0.0025;
            this.pitch += mouseDelta.y * 0.0015;
            this.pitch = Math.max(-0.2, Math.min(0.75, this.pitch));
        }

        for (const player of this.players) {
            const movement = player?.getComponent('movement');
            if (movement) {
                movement.setMode(this.cameraMode === 'tps' ? 'tps' : 'isometric');
            }
        }

        const leaderHealth = this.player?.getComponent('health');
        if (leaderHealth) {
            this.engine.events.emit('hp_changed', leaderHealth.health);
        }

        if (this.players.every(player => !player.getComponent('health')?.isAlive())) {
            this._failRun();
        }

        if (this.waveDirector && this.runState.status === 'active' && !this.choiceActive) {
            this.waveDirector.update(delta);
        }

        const focus = this._getCameraFocusPosition();
        if (this.cameraMode === 'tps') {
            this.getCamera().updateFollow(focus, this.yaw, delta, {
                backOffset: 5.5,
                heightOffset: 1.6,
                pitch: this.pitch
            }, this.environmentMeshes);
        } else {
            this.getCamera().updateFollow(focus, 0, delta, {
                orthoOffset: new THREE.Vector3(18, 18, 18),
                lookOffset: new THREE.Vector3(0, 1.5, 0),
                smoothing: 6
            });
        }

        this._processEnemyAttacks(delta);
        this._processHazards(delta);

        this.replicationController.syncLocalState();
    }

    toggleCameraMode() {
        const input = this.getSystem('input');
        const camera = this.getCamera();
        if (!input || !camera) return;

        if (this.cameraMode === '2.5d') {
            this.cameraMode = 'tps';
            camera.setPreset('tps');
            input.isFpsMode = true;
            this.hud.updateInfo('TPS modu: ekrana tikla, mouse ile bak. V ile geri donebilirsin.');
        } else {
            this.cameraMode = '2.5d';
            camera.setPreset('2.5d');
            input.isFpsMode = false;
            input.exitPointerLock();
            this.hud.updateInfo('2.5D mod: WASD hareket, tik ates, Q dash. Coop varsa JIKL + Enter/P/O.');
        }
    }

    serializeState() {
        const base = super.serializeState();
        return {
            ...base,
            runState: this.runState.serialize(),
            currentRoom: this.currentRoom?.id || null,
            loadout: this.loadout.id,
            seed: this.seed
        };
    }

    restoreState(snapshot) {
        if (!snapshot) return false;

        this.restoreSystemSnapshots(snapshot.systems || []);
        this.runState.restore(snapshot.runState || {});
        this.seed = snapshot.seed || this.seed;
        this.currentRoom = snapshot.currentRoom ? getRoomDefinition(snapshot.currentRoom) : this.currentRoom;
        this.hudPresenter.syncSnapshotState();

        for (const object of [...this.activeEnemies, ...this.pickups]) {
            this.remove(object);
        }
        this.activeEnemies = [];
        this.pickups = [];

        for (const player of this.players) {
            const serialized = snapshot.objects?.find(item =>
                item.type === player.constructor.name &&
                (item.controlProfile || 'default') === player.controlProfile
            );
            if (serialized?.position) {
                player.group.position.set(serialized.position.x, serialized.position.y, serialized.position.z);
            }
            const health = player.getComponent('health');
            if (health && serialized?.hp !== undefined) {
                health.maxHealth = serialized.maxHp ?? health.maxHealth;
                health.setHealth(serialized.hp);
            }
        }

        const restored = this.restoreObjects(snapshot.objects || [], {
            filter: serialized => ['EnemyActor', 'Enemy', 'CollectibleActor'].includes(serialized.type)
        });
        this.activeEnemies = restored.filter(object => object instanceof EnemyActor);
        this.pickups = restored.filter(object => object instanceof CollectibleActor);
        return true;
    }
}
