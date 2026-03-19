import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';
import { ModularCharacter } from 'zortengine/src/gameplay/index.js';
import {
  DUNGEON_MAP,
  DUNGEON_TILE,
  DUNGEON_TILE_SIZE,
  DUNGEON_SPAWN_POINTS,
  DUNGEON_PORTAL,
  isDungeonWalkable,
  dungeonGridToWorld,
  dungeonWorldToGrid,
  getDungeonTile,
} from './dungeonMapData.js';
import { createPortalMesh } from './PortalMesh.js';

const PLAYER_RADIUS = 0.6;
const PLAYER_SPEED = 5.0;
const ENEMY_RADIUS = 0.6;
const ENEMY_BASE_SPEED = 2.8;
const ENEMY_SPAWN_INTERVAL = 2.5;
const ENEMY_MAX_COUNT = 6;
const XP_PER_KILL = 20;
const PICKUP_RADIUS = 1.8;
const PORTAL_RADIUS = 2.5;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class DungeonScene extends GameScene {
  constructor() {
    super({ name: 'dungeon' });
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
    this._portalPos = null;
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
    }
  }

  setup() {
    const { width, height } = this.engine?.platform?.getViewportSize?.() || { width: 1, height: 1 };
    const aspect = width / Math.max(1, height);

    const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    this._cameraOffset = new THREE.Vector3(0, 14, 14);
    camera.position.copy(this._cameraOffset);
    camera.lookAt(0, 0, 0);
    this.setCamera(camera);

    this.threeScene.background = new THREE.Color(0x1a1a2e);

    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    this.threeScene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(8, 15, 8);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 512;
    dir.shadow.mapSize.height = 512;
    this.threeScene.add(dir);

    const pointLight = new THREE.PointLight(0xffaa66, 0.5, 20);
    pointLight.position.set(0, 4, 0);
    this.threeScene.add(pointLight);

    this._createWorld();

    const spawn = dungeonGridToWorld(2, 2);
    const player = new ModularCharacter(this, spawn.x, spawn.z, {
      colorSuit: 0xe74c3c,
      colorSkin: 0xffe4c4,
      speed: PLAYER_SPEED
    });
    this.add(player);
    this._playerCharacter = player;
    this._player = player.group;

    const input = this.engine._rnInputManager;
    if (input) this.registerSystem('input', input);
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
    const tileGeo = new THREE.PlaneGeometry(DUNGEON_TILE_SIZE, DUNGEON_TILE_SIZE);
    const materials = {
      [DUNGEON_TILE.FLOOR]: new THREE.MeshStandardMaterial({
        color: 0x3d3d5c,
        roughness: 0.95,
        metalness: 0.05
      }),
      [DUNGEON_TILE.WALL]: new THREE.MeshStandardMaterial({
        color: 0x2d2d44,
        roughness: 0.9,
        metalness: 0.1
      }),
      [DUNGEON_TILE.CORRIDOR]: new THREE.MeshStandardMaterial({
        color: 0x4a4a6a,
        roughness: 0.9,
        metalness: 0.05
      })
    };

    for (let gz = 0; gz < DUNGEON_MAP.length; gz++) {
      for (let gx = 0; gx < DUNGEON_MAP[gz].length; gx++) {
        const tile = getDungeonTile(gx, gz);
        const { x, z } = dungeonGridToWorld(gx, gz);
        const mesh = new THREE.Mesh(tileGeo, materials[tile] ?? materials[DUNGEON_TILE.WALL]);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, -0.5, z);
        mesh.receiveShadow = true;
        this.threeScene.add(mesh);
      }
    }

    const { x: px, z: pz } = dungeonGridToWorld(DUNGEON_PORTAL.gx, DUNGEON_PORTAL.gz);
    this._portalPos = new THREE.Vector3(px, 0, pz);
    const portal = createPortalMesh('world');
    portal.position.set(px, 0, pz);
    portal.rotation.y = Math.atan2(-px, -pz);
    this.threeScene.add(portal);
  }

  _spawnLoot(x, z, loot) {
    const group = new THREE.Group();
    group.position.set(x, 0.3, z);
    const geo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xcc9900,
      emissiveIntensity: 0.4,
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
        if (loot?.gold) this._gold += loot.gold;
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

    const idx = Math.floor(Math.random() * DUNGEON_SPAWN_POINTS.length);
    const pt = DUNGEON_SPAWN_POINTS[idx];
    if (!isDungeonWalkable(getDungeonTile(pt.gx, pt.gz))) return;

    const pPos = this._player.position;
    const { gx: pgx, gz: pgz } = dungeonWorldToGrid(pPos.x, pPos.z);
    const dist = Math.abs(pt.gx - pgx) + Math.abs(pt.gz - pgz);
    if (dist < 3) return;

    const { x, z } = dungeonGridToWorld(pt.gx, pt.gz);

    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8e44ad,
      emissive: 0x4a235a,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.5;
    mesh.castShadow = true;
    group.add(mesh);
    const gold = 5 + Math.floor(Math.random() * 12);
    group.userData = { hp: 1, alive: true, mesh, loot: { gold } };
    this.threeScene.add(group);
    this._enemies.push(group);
  }

  _tryAttack() {
    if (!this._player || this._attackCooldown > 0) return;
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
    if (this._playerCharacter) this._playerCharacter.update(delta, time);

    this._playerVel.lerp(targetVel, 1 - Math.exp(-12 * delta));

    const prevX = this._player.position.x;
    const prevZ = this._player.position.z;
    this._player.position.x += this._playerVel.x * delta;
    this._player.position.z += this._playerVel.z * delta;

    const { gx, gz } = dungeonWorldToGrid(this._player.position.x, this._player.position.z);
    if (!isDungeonWalkable(getDungeonTile(gx, gz))) {
      this._player.position.x = prevX;
      this._player.position.z = prevZ;
    }

    const angle = Math.atan2(this._playerVel.x, this._playerVel.z);
    if (this._playerVel.lengthSq() > 0.01) this._player.rotation.y = angle;

    const half = (DUNGEON_MAP[0]?.length ?? 15) * DUNGEON_TILE_SIZE * 0.5 - DUNGEON_TILE_SIZE;
    this._player.position.x = clamp(this._player.position.x, -half, half);
    this._player.position.z = clamp(this._player.position.z, -half, half);

    if (this._portalPos && this._player.position.distanceTo(this._portalPos) <= PORTAL_RADIUS) {
      this.engine?.useScene?.('rpg-world');
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

      const { gx: egx, gz: egz } = dungeonWorldToGrid(e.position.x, e.position.z);
      if (!isDungeonWalkable(getDungeonTile(egx, egz))) {
        e.position.x = prevEx;
        e.position.z = prevEz;
      }

      e.lookAt(pPos.x, e.position.y, pPos.z);

      if (dist < PLAYER_RADIUS + ENEMY_RADIUS + 0.1) {
        this._hp = clamp(this._hp - 12 * delta, 0, this._maxHp);
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

  getQuestForUI() {
    return null;
  }

  onUpdate(delta, time) {
    this._attackCooldown = Math.max(0, this._attackCooldown - delta);
    this._updatePlayer(delta, time);
    this._updateEnemies(delta);
    this._updateLoot(delta);
    this._updateCamera(delta);
  }
}
