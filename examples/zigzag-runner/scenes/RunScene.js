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
        super({ name: 'zigzag-run' });
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

        this._createLights();
        this._createTrack(physics);
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
