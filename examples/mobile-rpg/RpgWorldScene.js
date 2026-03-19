import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';
import { ModularCharacter } from 'zortengine/src/gameplay/index.js';

const PLAYER_RADIUS = 0.6;
const PLAYER_SPEED = 5.0;
const ENEMY_RADIUS = 0.6;
const ENEMY_BASE_SPEED = 2.5;
const ENEMY_SPAWN_INTERVAL = 3.0;
const ENEMY_MAX_COUNT = 8;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class RpgWorldScene extends GameScene {
  constructor() {
    super({ name: 'rpg-world' });
    this._player = null;
    this._playerVel = new THREE.Vector3(0, 0, 0);

    this._enemies = [];
    this._enemySpawnTimer = 0;

    this._hp = 100;
    this._attackCooldown = 0;
  }

  setup() {
    const { width, height } = this.engine?.platform?.getViewportSize?.() || { width: 1, height: 1 };
    const aspect = width / Math.max(1, height);

    const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    // Önden bakış: joystick yukarı = ekranda yukarı (-Z), sağ = ekranda sağ (+X)
    this._cameraOffset = new THREE.Vector3(0, 18, 18);
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
    dir.shadow.camera.left = -30;
    dir.shadow.camera.right = 30;
    dir.shadow.camera.top = 30;
    dir.shadow.camera.bottom = -30;
    dir.shadow.bias = -0.0002;
    this.threeScene.add(dir);

    this._createWorld();

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
      input.on('attack', () => this._tryAttack());
    }
  }

  _createWorld() {
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x27ae60,
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.threeScene.add(ground);

    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x95a5a6,
      roughness: 0.95,
      metalness: 0
    });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, -0.45, 0);
    path.receiveShadow = true;
    this.threeScene.add(path);

    const rockGeo = new THREE.DodecahedronGeometry(0.8, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x7f8c8d,
      roughness: 0.9,
      metalness: 0.1
    });
    const positions = [[-6, 0, 5], [8, 0, -4], [-10, 0, -6]];
    for (const [px, py, pz] of positions) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(px, 0.4, pz);
      rock.scale.setScalar(0.6 + Math.random() * 0.4);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.threeScene.add(rock);
    }

    const stumpGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.4, 8);
    const stumpMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 0.95
    });
    const stump = new THREE.Mesh(stumpGeo, stumpMat);
    stump.position.set(5, 0.2, 3);
    stump.castShadow = true;
    this.threeScene.add(stump);
  }

  onResize(width, height, aspect) {
    const cam = this.getCamera();
    const threeCam = cam?.getNativeCamera?.() || cam?.getThreeCamera?.() || cam;
    if (threeCam?.isPerspectiveCamera) {
      threeCam.aspect = aspect;
      threeCam.updateProjectionMatrix();
    }
  }

  _spawnEnemy() {
    if (!this._player || this._enemies.length >= ENEMY_MAX_COUNT) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 6;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8e44ad,
      emissive: 0x000000,
      roughness: 0.5,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.5;
    mesh.castShadow = true;
    group.add(mesh);
    group.userData = { hp: 1, alive: true, mesh };
    this.threeScene.add(group);
    this._enemies.push(group);
  }

  _tryAttack() {
    if (!this._player) return;
    if (this._attackCooldown > 0) return;

    this._attackCooldown = 0.4;
    this._player.scale.set(1.1, 0.9, 1.1);

    const pPos = this._player.position;
    const attackRadius = 2.4;

    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i];
      if (!e?.userData?.alive) continue;
      const d = e.position.distanceTo(pPos);
      if (d <= attackRadius) {
        e.userData.alive = false;
        const mesh = e.userData?.mesh;
        if (mesh?.material?.emissive) mesh.material.emissive.setHex(0xff9933);
        e.scale.setScalar(1.6);
      }
    }
  }

  _updatePlayer(delta, time = 0) {
    if (!this._player) return;

    const input = this.engine?._rnInputManager;
    const move = input?.getMovementVector?.('mobile') || { x: 0, z: 0 };
    const targetVel = new THREE.Vector3(move.x * PLAYER_SPEED, 0, move.z * PLAYER_SPEED);

    if (!this._logTicker) this._logTicker = 0;
    this._logTicker += delta;
    if (this._logTicker >= 1) {
      this._logTicker = 0;
      const hasInput = !!input;
      const joystickDir = input?.joystickDir;
      console.log('[RpgWorldScene:_updatePlayer]', {
        move: { x: move.x?.toFixed(3), z: move.z?.toFixed(3) },
        targetVel: { x: targetVel.x?.toFixed(2), z: targetVel.z?.toFixed(2) },
        hasInput: !!input,
        joystickDir: joystickDir ? { x: joystickDir.x?.toFixed(3), z: joystickDir.z?.toFixed(3) } : null,
      });
    }

    const isMoving = targetVel.lengthSq() > 0.01;
    if (this._playerCharacter?.fsm) {
      this._playerCharacter.fsm.setState(isMoving ? 'walk' : 'idle');
    }
    if (this._playerCharacter) {
      this._playerCharacter.update(delta, time);
    }

    this._playerVel.lerp(targetVel, 1 - Math.exp(-12 * delta));

    this._player.position.x += this._playerVel.x * delta;
    this._player.position.z += this._playerVel.z * delta;

    const angle = Math.atan2(this._playerVel.x, this._playerVel.z);
    if (this._playerVel.lengthSq() > 0.01) {
      this._player.rotation.y = angle;
    }

    this._player.position.x = clamp(this._player.position.x, -18, 18);
    this._player.position.z = clamp(this._player.position.z, -18, 18);

    if (this._player.scale) {
      this._player.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - Math.exp(-16 * delta));
    }
  }

  _updateEnemies(delta) {
    if (!this._player) return;

    this._enemySpawnTimer -= delta;
    if (this._enemySpawnTimer <= 0) {
      this._enemySpawnTimer = ENEMY_SPAWN_INTERVAL;
      this._spawnEnemy();
    }

    const pPos = this._player.position;

    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i];
      if (!e) continue;

      if (!e.userData.alive) {
        e.scale.multiplyScalar(1 - delta * 3.2);
        e.position.y += delta * 3.0;
        if (e.scale.x < 0.05) {
          this.threeScene.remove(e);
          const mesh = e.userData.mesh;
          if (mesh) {
            mesh.geometry?.dispose?.();
            mesh.material?.dispose?.();
          }
          this._enemies.splice(i, 1);
        }
        continue;
      }

      const dir = new THREE.Vector3().subVectors(pPos, e.position);
      dir.y = 0;
      const dist = dir.length() || 1;
      dir.normalize();

      const speed = ENEMY_BASE_SPEED;
      e.position.x += dir.x * speed * delta;
      e.position.z += dir.z * speed * delta;

      e.lookAt(pPos.x, e.position.y, pPos.z);

      if (dist < PLAYER_RADIUS + ENEMY_RADIUS + 0.1) {
        this._hp = clamp(this._hp - 10 * delta, 0, 100);
        e.position.x -= dir.x * speed * delta * 2;
        e.position.z -= dir.z * speed * delta * 2;
      }
    }
  }

  _updateCamera(delta) {
    const cam = this.getCamera();
    const threeCam = cam?.getNativeCamera?.() || cam?.getThreeCamera?.() || cam;
    if (!threeCam || !this._player) return;

    const targetPos = this._player.position.clone().add(this._cameraOffset);
    const followSpeed = 4.0;
    const t = 1 - Math.exp(-followSpeed * delta);
    threeCam.position.lerp(targetPos, t);
    const lookAt = this._player.position.clone();
    lookAt.y += 1.5;
    threeCam.lookAt(lookAt);
  }

  onUpdate(delta, time) {
    this._attackCooldown = Math.max(0, this._attackCooldown - delta);
    this._updatePlayer(delta, time);
    this._updateEnemies(delta);
    this._updateCamera(delta);

    // İleride HP değerini RN HUD’a aktarmak için scene events veya engine events kullanılabilir.
  }
}

