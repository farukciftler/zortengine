import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';
import { ModularCharacter } from 'zortengine/src/gameplay/index.js';
import { createPortalMesh } from './PortalMesh.js';

const PLAYER_SPEED = 5.0;
const PORTAL_RADIUS = 2.5;

export class HubScene extends GameScene {
  constructor() {
    super({ name: 'hub' });
    this._player = null;
    this._playerVel = new THREE.Vector3(0, 0, 0);
    this._portals = [
      { pos: new THREE.Vector3(0, 0, 9), target: 'rpg-world', type: 'world' },
      { pos: new THREE.Vector3(-8, 0, 0), target: 'dungeon', type: 'dungeon' },
    ];
  }

  setup() {
    const { width, height } = this.engine?.platform?.getViewportSize?.() || { width: 1, height: 1 };
    const aspect = width / Math.max(1, height);

    const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    this._cameraOffset = new THREE.Vector3(0, 12, 12);
    camera.position.copy(this._cameraOffset);
    camera.lookAt(0, 0, 0);
    this.setCamera(camera);

    this.threeScene.background = new THREE.Color(0x87ceeb);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.threeScene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    this.threeScene.add(dir);

    this._createHubEnvironment();

    for (const p of this._portals) {
      this._createPortal(p.pos.x, p.pos.z, p.type);
    }

    const player = new ModularCharacter(this, 0, 0, {
      colorSuit: 0xe74c3c,
      colorSkin: 0xffe4c4,
      speed: PLAYER_SPEED
    });
    this.add(player);
    this._playerCharacter = player;
    this._player = player.group;

    const input = this.engine._rnInputManager;
    if (input) {
      this.registerSystem('input', input);
    }
  }

  _createHubEnvironment() {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x7a6b5d,
      roughness: 0.92,
      metalness: 0.02
    });

    // Taş döşeme zemin
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 28),
      new THREE.MeshStandardMaterial({
        color: 0x5c5248,
        roughness: 0.95,
        metalness: 0
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.threeScene.add(ground);

    // Duvar parçaları — köy meydanını çevreleyen
    const wallGeo = new THREE.BoxGeometry(1.5, 1.8, 0.4);
    const wallPositions = [
      [-10, 0.9, -10], [0, 0.9, -10], [10, 0.9, -10],
      [-10, 0.9, 10], [0, 0.9, 10], [10, 0.9, 10],
      [-10, 0.9, 0], [10, 0.9, 0]
    ];
    for (const [wx, wy, wz] of wallPositions) {
      const wall = new THREE.Mesh(wallGeo, stoneMat);
      wall.position.set(wx, wy, wz);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.threeScene.add(wall);
    }

    // Merkezdeki kuyu/çeşme
    const wellBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.4, 12),
      stoneMat
    );
    wellBase.position.set(0, 0.2, 0);
    wellBase.castShadow = true;
    this.threeScene.add(wellBase);

    const wellWater = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.2, metalness: 0.3 })
    );
    wellWater.position.set(0, 0.35, 0);
    this.threeScene.add(wellWater);

    // Fıçılar
    const barrelGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.6, 10);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    [[4, 0.3, 5], [-5, 0.3, 6], [6, 0.3, -4]].forEach(([bx, by, bz]) => {
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(bx, by, bz);
      barrel.rotation.z = 0.1;
      barrel.castShadow = true;
      this.threeScene.add(barrel);
    });
  }

  _createPortal(x, z, type) {
    const portal = createPortalMesh(type);
    portal.position.set(x, 0, z);
    portal.lookAt(0, 0, 0);
    this.threeScene.add(portal);
  }

  _updatePlayer(delta) {
    if (!this._player) return;

    const input = this.engine?._rnInputManager;
    const move = input?.getMovementVector?.('mobile') || { x: 0, z: 0 };
    const targetVel = new THREE.Vector3(move.x * PLAYER_SPEED, 0, move.z * PLAYER_SPEED);

    const isMoving = targetVel.lengthSq() > 0.01;
    if (this._playerCharacter?.fsm) {
      this._playerCharacter.fsm.setState(isMoving ? 'walk' : 'idle');
    }
    if (this._playerCharacter) {
      this._playerCharacter.update(delta, 0);
    }

    this._playerVel.lerp(targetVel, 1 - Math.exp(-12 * delta));
    this._player.position.x += this._playerVel.x * delta;
    this._player.position.z += this._playerVel.z * delta;

    const angle = Math.atan2(this._playerVel.x, this._playerVel.z);
    if (this._playerVel.lengthSq() > 0.01) {
      this._player.rotation.y = angle;
    }

    this._player.position.x = Math.max(-10, Math.min(10, this._player.position.x));
    this._player.position.z = Math.max(-10, Math.min(10, this._player.position.z));

    for (const p of this._portals) {
      if (this._player.position.distanceTo(p.pos) <= PORTAL_RADIUS) {
        this.engine?.useScene?.(p.target);
        break;
      }
    }
  }

  _updateCamera(delta) {
    const cam = this.getCamera();
    const threeCam = cam?.getNativeCamera?.() || cam?.getThreeCamera?.() || cam;
    if (!threeCam || !this._player) return;

    const targetPos = this._player.position.clone().add(this._cameraOffset);
    const t = 1 - Math.exp(-4 * delta);
    threeCam.position.lerp(targetPos, t);
    const lookAt = this._player.position.clone();
    lookAt.y += 1.5;
    threeCam.lookAt(lookAt);
  }

  onResize(width, height, aspect) {
    const cam = this.getCamera();
    const threeCam = cam?.getNativeCamera?.() || cam?.getThreeCamera?.() || cam;
    if (threeCam?.isPerspectiveCamera) {
      threeCam.aspect = aspect;
      threeCam.updateProjectionMatrix();
    }
  }

  onUpdate(delta, time) {
    this._updatePlayer(delta, time);
    this._updateCamera(delta);
  }
}
