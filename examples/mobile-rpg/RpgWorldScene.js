import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';
import { ModularCharacter } from 'zortengine/src/gameplay/index.js';
import {
  WORLD_MAP,
  TILE,
  TILE_SIZE,
  isWalkable,
  gridToWorld,
  worldToGrid,
  getTile,
} from './mapData.js';
import { createPortalMesh } from './PortalMesh.js';
import {
  QUESTS,
  createQuestProgress,
  updateQuestProgress,
  isQuestComplete,
} from './questData.js';

const PLAYER_RADIUS = 0.6;
const PLAYER_SPEED = 5.0;
const ENEMY_RADIUS = 0.6;
const ENEMY_BASE_SPEED = 2.5;
const ENEMY_SPAWN_INTERVAL = 3.0;
const ENEMY_MAX_COUNT = 8;
const XP_PER_KILL = 15;
const PICKUP_RADIUS = 1.8;
const PORTAL_RADIUS = 2.5;

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
    this._maxHp = 100;
    this._level = 1;
    this._xp = 0;
    this._gold = 0;
    this._lootItems = [];
    this._attackCooldown = 0;
    this._portals = [];
    this._questIndex = 0;
    this._questProgress = null;
  }

  _xpForLevel(level) {
    return 50 + level * 25;
  }

  _addXp(amount) {
    this._xp += amount;
    while (this._xp >= this._xpForLevel(this._level)) {
      this._xp -= this._xpForLevel(this._level);
      this._level++;
      this._maxHp += 10;
      this._hp = Math.min(this._hp + 10, this._maxHp);
      this._onQuestEvent({ type: 'level', level: this._level });
    }
  }

  _initQuest() {
    if (this._questIndex >= QUESTS.length) return;
    const quest = QUESTS[this._questIndex];
    this._questProgress = createQuestProgress(quest);
  }

  _onQuestEvent(event) {
    if (this._questIndex >= QUESTS.length || !this._questProgress) return;
    const quest = QUESTS[this._questIndex];
    updateQuestProgress(this._questProgress, quest, event);
    if (isQuestComplete(this._questProgress, quest)) {
      this._questIndex++;
      this._initQuest();
    }
  }

  getQuestForUI() {
    if (this._questIndex >= QUESTS.length || !this._questProgress) return null;
    const quest = QUESTS[this._questIndex];
    return {
      title: quest.title,
      description: quest.description,
      objectives: quest.objectives.map((obj, i) => ({
        type: obj.type,
        target: obj.target,
        current: this._questProgress.current[i] ?? 0,
      })),
    };
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

    const spawn = gridToWorld(10, 10);
    const player = new ModularCharacter(this, spawn.x, spawn.z, {
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
    this._initQuest();
  }

  onEnter() {
    const input = this.engine?._rnInputManager;
    if (input) {
      this._attackListener = () => this._tryAttack();
      input.on('attack', this._attackListener);
    }
  }

  onExit() {
    const input = this.engine?._rnInputManager;
    if (input && this._attackListener) {
      input.off('attack', this._attackListener);
    }
  }

  _createWorld() {
    const tileGeo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const materials = {
      [TILE.GRASS]: new THREE.MeshStandardMaterial({
        color: 0x27ae60,
        roughness: 0.9,
        metalness: 0.05
      }),
      [TILE.PATH]: new THREE.MeshStandardMaterial({
        color: 0x95a5a6,
        roughness: 0.95,
        metalness: 0
      }),
      [TILE.WATER]: new THREE.MeshStandardMaterial({
        color: 0x3498db,
        roughness: 0.3,
        metalness: 0.2
      }),
      [TILE.WALL]: new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.95,
        metalness: 0.05
      })
    };

    for (let gz = 0; gz < WORLD_MAP.length; gz++) {
      for (let gx = 0; gx < WORLD_MAP[gz].length; gx++) {
        const tile = getTile(gx, gz);
        const { x, z } = gridToWorld(gx, gz);
        const mesh = new THREE.Mesh(tileGeo, materials[tile]);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, -0.5, z);
        mesh.receiveShadow = true;
        mesh.userData = { gx, gz, tile };
        this.threeScene.add(mesh);
      }
    }

    const portals = [
      { gx: 1, gz: 1, target: 'hub', type: 'hub' },
      { gx: 18, gz: 18, target: 'dungeon', type: 'dungeon' },
    ];
    for (const p of portals) {
      const { x: px, z: pz } = gridToWorld(p.gx, p.gz);
      this._portals.push({ pos: new THREE.Vector3(px, 0, pz), target: p.target });
      const portal = createPortalMesh(p.type);
      portal.position.set(px, 0, pz);
      portal.rotation.y = p.gx < 10 ? 0 : Math.PI;
      this.threeScene.add(portal);
    }
  }

  onResize(width, height, aspect) {
    const cam = this.getCamera();
    const threeCam = cam?.getNativeCamera?.() || cam?.getThreeCamera?.() || cam;
    if (threeCam?.isPerspectiveCamera) {
      threeCam.aspect = aspect;
      threeCam.updateProjectionMatrix();
    }
  }

  _spawnLoot(x, z, loot) {
    const group = new THREE.Group();
    group.position.set(x, 0.3, z);
    const geo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xcc9900,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.3
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    group.add(mesh);
    group.userData = { loot };
    this.threeScene.add(group);
    this._lootItems.push(group);
  }

  _updateLoot(delta) {
    if (!this._player) return;
    const pPos = this._player.position;
    for (let i = this._lootItems.length - 1; i >= 0; i--) {
      const item = this._lootItems[i];
      const dist = item.position.distanceTo(pPos);
      if (dist <= PICKUP_RADIUS) {
        const loot = item.userData?.loot;
        if (loot?.gold) {
          this._gold += loot.gold;
          this._onQuestEvent({ type: 'gold', amount: loot.gold });
        }
        this.threeScene.remove(item);
        item.children.forEach(c => {
          c.geometry?.dispose?.();
          c.material?.dispose?.();
        });
        this._lootItems.splice(i, 1);
      } else {
        item.rotation.y += delta * 2;
      }
    }
  }

  _spawnEnemy() {
    if (!this._player || this._enemies.length >= ENEMY_MAX_COUNT) return;

    const pPos = this._player.position;
    const { gx: pgx, gz: pgz } = worldToGrid(pPos.x, pPos.z);
    const minDist = 4;
    let gx, gz, attempts = 0;
    do {
      gx = Math.floor(Math.random() * WORLD_MAP[0].length);
      gz = Math.floor(Math.random() * WORLD_MAP.length);
      attempts++;
    } while ((!isWalkable(getTile(gx, gz)) || Math.abs(gx - pgx) + Math.abs(gz - pgz) < minDist) && attempts < 50);
    if (!isWalkable(getTile(gx, gz))) return;

    const { x, z } = gridToWorld(gx, gz);

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
    const gold = 3 + Math.floor(Math.random() * 8);
    group.userData = { hp: 1, alive: true, mesh, loot: { gold } };
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
        this._addXp(e.userData.xp ?? XP_PER_KILL);
        this._onQuestEvent({ type: 'kill', count: 1 });
        const loot = e.userData?.loot;
        if (loot) this._spawnLoot(e.position.x, e.position.z, loot);
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

    const isMoving = targetVel.lengthSq() > 0.01;
    if (this._playerCharacter?.fsm) {
      this._playerCharacter.fsm.setState(isMoving ? 'walk' : 'idle');
    }
    if (this._playerCharacter) {
      this._playerCharacter.update(delta, time);
    }

    this._playerVel.lerp(targetVel, 1 - Math.exp(-12 * delta));

    const prevX = this._player.position.x;
    const prevZ = this._player.position.z;
    this._player.position.x += this._playerVel.x * delta;
    this._player.position.z += this._playerVel.z * delta;

    const { gx, gz } = worldToGrid(this._player.position.x, this._player.position.z);
    const tile = getTile(gx, gz);
    if (!isWalkable(tile)) {
      this._player.position.x = prevX;
      this._player.position.z = prevZ;
    }

    const angle = Math.atan2(this._playerVel.x, this._playerVel.z);
    if (this._playerVel.lengthSq() > 0.01) {
      this._player.rotation.y = angle;
    }

    const half = (WORLD_MAP[0]?.length ?? 20) * TILE_SIZE * 0.5 - TILE_SIZE;
    this._player.position.x = clamp(this._player.position.x, -half, half);
    this._player.position.z = clamp(this._player.position.z, -half, half);

    for (const p of this._portals) {
      if (this._player.position.distanceTo(p.pos) <= PORTAL_RADIUS) {
        this.engine?.useScene?.(p.target);
        break;
      }
    }

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
      const prevEx = e.position.x;
      const prevEz = e.position.z;
      e.position.x += dir.x * speed * delta;
      e.position.z += dir.z * speed * delta;

      const { gx: egx, gz: egz } = worldToGrid(e.position.x, e.position.z);
      if (!isWalkable(getTile(egx, egz))) {
        e.position.x = prevEx;
        e.position.z = prevEz;
      }

      e.lookAt(pPos.x, e.position.y, pPos.z);

      if (dist < PLAYER_RADIUS + ENEMY_RADIUS + 0.1) {
        this._hp = clamp(this._hp - 10 * delta, 0, this._maxHp);
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
    this._updateLoot(delta);
    this._updateCamera(delta);

    // İleride HP değerini RN HUD’a aktarmak için scene events veya engine events kullanılabilir.
  }
}

