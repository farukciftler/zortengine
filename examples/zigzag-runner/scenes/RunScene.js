import * as THREE from 'three';
import { GameScene } from 'zortengine';
import { ZigzagBootstrap } from '../runtime/ZigzagBootstrap.js';
import { ZigzagFlowController } from '../runtime/ZigzagFlowController.js';
import { ZigzagCheckpointController } from '../runtime/ZigzagCheckpointController.js';
import { ZigzagHudPresenter } from '../runtime/ZigzagHudPresenter.js';
import { SaveManager } from 'zortengine/persistence';
import { ZigzagState } from '../runtime/ZigzagState.js';
import { ZigzagHud } from '../ui/ZigzagHud.js';
import { PlayerActor } from '../actors/PlayerActor.js';
import { LaneSystem } from '../systems/LaneSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { LANE_DEFINITIONS } from '../data/LaneDefinitions.js';
import { TRACK_CONFIG } from '../data/TrackConfig.js';

export class RunScene extends GameScene {
    constructor(options = {}) {
        super({ name: 'zigzag-run', background: new THREE.Color(0x000011) });
        this.options = options;
    }

    setup() {
        this.seed = this.options.seed || `zigzag-${Date.now()}`;
        this.engine.random.setSeed(this.seed);
        this.rng = this.engine.random;

        this.runState = new ZigzagState({
            seed: this.seed,
            laneCount: LANE_DEFINITIONS.LANE_COUNT,
            baseSpeed: TRACK_CONFIG.BASE_SPEED,
            speedRampPerMeter: TRACK_CONFIG.SPEED_RAMP_PER_METER,
            maxSpeed: TRACK_CONFIG.MAX_SPEED ?? 20
        });
        this.saveManager = new SaveManager({ namespace: 'zortengine-zigzag' });

        this.bootstrap = new ZigzagBootstrap(this);
        const { physics, cameraManager, input } = this.bootstrap.registerCoreSystems();

        this.hud = new ZigzagHud(this.getSystem('ui'));
        this.hudPresenter = new ZigzagHudPresenter(this, this.hud);
        this.hudPresenter.initialize();

        this.flowController = new ZigzagFlowController(this);
        this.checkpointController = new ZigzagCheckpointController(this, this.saveManager);

        this.threeScene.background = new THREE.Color(0x000011);
        this._createLights();
        this._createTrack(physics);
        this._createSpeedLines();
        this._createPlayer(physics, input);

        this.laneSystem = this.registerSystem('lane', new LaneSystem(), { priority: 50 });
        this.spawnSystem = this.registerSystem('spawn', new SpawnSystem(), { priority: 60 });
        this.collisionSystem = this.registerSystem('collision', new CollisionSystem(), { priority: 70 });

        this.laneSystem.setPlayer(this.player);
        this.spawnSystem.setContext(this);
        this.collisionSystem.setContext(this);

        this.cameraManager = cameraManager;
        cameraManager.setPreset('tps');
        this.setCamera(cameraManager);

        this.checkpointController.save('setup');
        this.flowController.start();
    }

    _createLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.threeScene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(10, 20, 10);
        this.threeScene.add(dir);
    }

    _createTrack(physics) {
        const groundGeo = new THREE.PlaneGeometry(TRACK_CONFIG.TRACK_WIDTH, 500);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
        this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.threeScene.add(this.groundMesh);
        physics.addBody(physics.createGround(TRACK_CONFIG.TRACK_WIDTH, 500, {}), this.groundMesh);
    }

    _createSpeedLines() {
        const lineColor = 0x5599ff;
        const material = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.5 });
        const halfWidth = TRACK_CONFIG.TRACK_WIDTH / 2;
        const lineLength = 20;
        const zSpan = 200;
        this.speedLinesZSpan = zSpan;

        const buildPositions = () => {
            const positions = [];
            for (let i = 0; i < 60; i++) {
                const side = i % 2 === 0 ? 1 : -1;
                const x = side * (halfWidth + 1.5 + (i % 6) * 1.8);
                const y = 2.5 + (i % 10) * 1.5;
                const z = (i / 60) * zSpan;
                positions.push(x, y, z, x, y, z + lineLength);
            }
            for (let i = 0; i < 40; i++) {
                const x = -halfWidth - 3 - (i % 4) * 2;
                const y = 2 + (i % 12) * 1.2;
                const z = (i / 40) * zSpan;
                positions.push(x, y, z, x, y, z + lineLength);
            }
            for (let i = 0; i < 40; i++) {
                const x = halfWidth + 3 + (i % 4) * 2;
                const y = 2 + (i % 12) * 1.2;
                const z = (i / 40) * zSpan;
                positions.push(x, y, z, x, y, z + lineLength);
            }
            for (let i = 0; i < 25; i++) {
                const x = (Math.random() - 0.5) * TRACK_CONFIG.TRACK_WIDTH;
                const y = 6 + Math.random() * 10;
                const z = (i / 25) * zSpan;
                positions.push(x, y, z, x, y, z + lineLength);
            }
            return positions;
        };

        const createLineChunk = () => {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(buildPositions(), 3));
            geometry.computeBoundingSphere();
            return new THREE.LineSegments(geometry, material.clone());
        };

        this.speedLinesChunks = [
            { group: new THREE.Group() },
            { group: new THREE.Group() },
            { group: new THREE.Group() }
        ];
        this.speedLinesChunks.forEach((chunk, i) => {
            chunk.group.add(createLineChunk());
            chunk.group.position.z = i * zSpan;
            this.threeScene.add(chunk.group);
        });
    }

    _createPlayer(physics, input) {
        this.player = new PlayerActor(this, null, input);
        this.add(this.player);
    }

    onUpdate(delta, time) {
        this.runState.distance += this.runState.speed * delta;
        this.runState.updateSpeedFromDistance();
        this.spawnSystem?.update?.(delta, time, { engine: this.engine, scene: this });
        this.collisionSystem?.update?.(delta, time, { engine: this.engine, scene: this });
        this.hudPresenter?.update?.();

        if (this.speedLinesChunks && this.runState?.isAlive) {
            const span = this.speedLinesZSpan ?? 200;
            const speed = this.runState.speed * delta;
            for (const chunk of this.speedLinesChunks) {
                chunk.group.position.z -= speed;
            }
            for (const chunk of this.speedLinesChunks) {
                if (chunk.group.position.z + span < 0) {
                    const others = this.speedLinesChunks.filter(c => c !== chunk);
                    const frontZ = others.length > 0
                        ? Math.max(...others.map(c => c.group.position.z))
                        : 0;
                    chunk.group.position.z = frontZ + span;
                }
            }
        }

        if (this.cameraManager?.updateFollow && this.player?.group && this.runState?.isAlive) {
            const pos = this.player.group.position.clone();
            this.cameraManager.updateFollow(pos, Math.PI, delta, {
                backOffset: 6,
                heightOffset: 1.2,
                pitch: 0.2
            });
        }
    }

    onExit() {
        this.hudPresenter?.dispose?.();
    }
}
