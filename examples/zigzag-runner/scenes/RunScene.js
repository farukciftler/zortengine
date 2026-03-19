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
import { PathGenerator } from '../runtime/PathGenerator.js';

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
        this.pathGenerator = new PathGenerator(this.rng);
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
        this.trackMesh = this._createTrackRibbon(-20, 220);
        this.threeScene.add(this.trackMesh);
        const groundGeo = new THREE.PlaneGeometry(TRACK_CONFIG.TRACK_WIDTH * 4, 1000);
        this.groundMesh = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x0a0a12, visible: false }));
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.threeScene.add(this.groundMesh);
        physics.addBody(physics.createGround(TRACK_CONFIG.TRACK_WIDTH * 4, 1000, {}), this.groundMesh);
    }

    _createTrackRibbon(fromDist, toDist) {
        const halfWidth = TRACK_CONFIG.TRACK_WIDTH / 2;
        const step = 2.5;
        const positions = [];
        const indices = [];
        let idx = 0;
        for (let d = fromDist; d <= toDist; d += step) {
            const info = this.pathGenerator.getInfoAtDistance(Math.max(0, d));
            const perp = new THREE.Vector3(-info.tangent.z, 0, info.tangent.x);
            const left = info.position.clone().add(perp.clone().multiplyScalar(-halfWidth));
            const right = info.position.clone().add(perp.multiplyScalar(halfWidth));
            positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
            if (idx >= 4) {
                const a = idx - 4, b = idx - 3, c = idx - 2, d_ = idx - 1;
                indices.push(a, b, d_, a, d_, c);
            }
            idx += 2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, side: THREE.DoubleSide });
        return new THREE.Mesh(geo, mat);
    }

    _updateTrackRibbon() {
        if (!this.trackMesh || !this.pathGenerator) return;
        const d = this.runState.distance;
        const fromDist = Math.max(0, d - 25);
        const toDist = d + 130;
        this.threeScene.remove(this.trackMesh);
        this.trackMesh.geometry.dispose();
        this.trackMesh = this._createTrackRibbon(fromDist, toDist);
        this.threeScene.add(this.trackMesh);
    }

    _createSpeedLines() {
        this.speedLinesMesh = this._createSpeedLinesPath(-20, 220);
        this.threeScene.add(this.speedLinesMesh);
    }

    _createSpeedLinesPath(fromDist, toDist) {
        const lineColor = 0x5599ff;
        const material = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.5 });
        const halfWidth = TRACK_CONFIG.TRACK_WIDTH / 2;
        const lineLength = 18;
        const step = 3;
        const positions = [];

        for (let d = fromDist; d <= toDist; d += step) {
            const info = this.pathGenerator.getInfoAtDistance(Math.max(0, d));
            const perp = new THREE.Vector3(-info.tangent.z, 0, info.tangent.x);
            const tangent = info.tangent.clone().multiplyScalar(lineLength);

            const leftBase = info.position.clone().add(perp.clone().multiplyScalar(-halfWidth - 2 - (Math.abs(d) % 15)));
            const rightBase = info.position.clone().add(perp.multiplyScalar(halfWidth + 2 + (Math.abs(d) % 12)));
            const y = 2.5 + (Math.abs(d) % 20) * 0.3;
            leftBase.y = y;
            rightBase.y = y;

            const leftEnd = leftBase.clone().add(tangent);
            const rightEnd = rightBase.clone().add(tangent);
            positions.push(leftBase.x, leftBase.y, leftBase.z, leftEnd.x, leftEnd.y, leftEnd.z);
            positions.push(rightBase.x, rightBase.y, rightBase.z, rightEnd.x, rightEnd.y, rightEnd.z);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.computeBoundingSphere();
        return new THREE.LineSegments(geo, material);
    }

    _updateSpeedLines() {
        if (!this.speedLinesMesh || !this.pathGenerator) return;
        const d = this.runState.distance;
        const fromDist = Math.max(0, d - 30);
        const toDist = d + 220;
        this.threeScene.remove(this.speedLinesMesh);
        this.speedLinesMesh.geometry.dispose();
        this.speedLinesMesh = this._createSpeedLinesPath(fromDist, toDist);
        this.threeScene.add(this.speedLinesMesh);
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

        if (this.trackMesh && this.pathGenerator && this.runState?.isAlive) {
            const d = this.runState.distance;
            if (!this._lastTrackUpdate || d - this._lastTrackUpdate > 25) {
                this._lastTrackUpdate = d;
                this._updateTrackRibbon();
                this._updateSpeedLines();
            }
        }

        if (this.cameraManager?.updateFollow && this.player?.group && this.runState?.isAlive) {
            const pos = this.player.group.position.clone();
            const info = this.pathGenerator?.getInfoAtDistance(this.runState.distance);
            const rotY = info ? -info.rotation : 0;
            this.cameraManager.updateFollow(pos, rotY, delta, {
                backOffset: 7,
                heightOffset: 1.4,
                pitch: 0.25
            });
        }
    }

    onExit() {
        this.hudPresenter?.dispose?.();
    }
}
