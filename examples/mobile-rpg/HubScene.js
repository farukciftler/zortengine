import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';
import { ModularCharacter } from 'zortengine/src/gameplay/index.js';

const PLAYER_SPEED = 5.0;
const PORTAL_RADIUS = 2.0;

export class HubScene extends GameScene {
  constructor() {
    super({ name: 'hub' });
    this._player = null;
    this._playerVel = new THREE.Vector3(0, 0, 0);
    this._portals = [
      { pos: new THREE.Vector3(0, 0, 8), target: 'rpg-world' },
      { pos: new THREE.Vector3(-6, 0, 0), target: 'dungeon' },
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

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.threeScene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    this.threeScene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.9, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.threeScene.add(ground);

    for (const p of this._portals) {
      this._createPortal(p.pos.x, p.pos.z);
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

  _createPortal(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const ringGeo = new THREE.TorusGeometry(1.2, 0.15, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x9b59b6,
      emissive: 0x4a235a,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    group.add(ring);

    const fillGeo = new THREE.CircleGeometry(1, 32);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.4
    });
    const fill = new THREE.Mesh(fillGeo, fillMat);
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = 0.01;
    group.add(fill);

    this.threeScene.add(group);
    this._portalMesh = group;
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
