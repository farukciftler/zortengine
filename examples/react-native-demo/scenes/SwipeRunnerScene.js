import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';

// Zigzag-runner hissi için daha geniş şeritler
const LANES = [-3, 0, 3];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class SwipeRunnerScene extends GameScene {
  constructor() {
    super({ name: 'swipe-runner', background: new THREE.Color(0x050712) });
    this._laneIndex = 1;
    this._laneTarget = 1;
    // ZigzagState mantığı: hız = baseSpeed * (1 + distance * ramp)
    this._baseSpeed = 8;
    this._speedRampPerMeter = 0.02;
    this._maxSpeed = 20;
    this._speed = this._baseSpeed;
    this._distance = 0;
    this._obstacles = [];
    this._spawnZ = 22;
    this._nextSpawnAt = 6;
    this._swipeAccumX = 0;
    this._swipeConsumed = false;
  }

  setup() {
    const { width, height } = this.engine?.platform?.getViewportSize?.() || { width: 1, height: 1 };
    const aspect = width / Math.max(1, height);

    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);
    // Kamera ters tarafa baksın: player arkadan takip, ileri doğru (+Z) bakış
    camera.position.set(0, 6.6, -15.5);
    camera.lookAt(0, 0.7, 18);
    this.setCamera(camera);

    this.threeScene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(10, 14, 6);
    this.threeScene.add(dir);

    this._createTrack();
    this._createPlayer();
    this._spawnObstacleRow();
    this._spawnObstacleRow();

    const input = this.engine._rnInputManager;
    if (input) {
      this.registerSystem('input', input);
      input.on('pointerDown', () => {
        this._swipeAccumX = 0;
        this._swipeConsumed = false;
      });
      input.on('pointerMove', ({ dx }) => {
        if (this._swipeConsumed) return;
        this._swipeAccumX += dx;
        const threshold = 40;
        if (this._swipeAccumX > threshold) {
          // Sağa swipe => sola lane
          this._changeLane(-1);
          this._swipeConsumed = true;
        } else if (this._swipeAccumX < -threshold) {
          // Sola swipe => sağ lane
          this._changeLane(1);
          this._swipeConsumed = true;
        }
      });
      input.on('pointerUp', () => {
        this._swipeAccumX = 0;
        this._swipeConsumed = false;
      });
    }
  }

  _createTrack() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 220),
      new THREE.MeshStandardMaterial({ color: 0x0b1022, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.7;
    floor.position.z = 60;
    this.threeScene.add(floor);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x1b2a55, emissive: 0x060a14, roughness: 0.3 });
    for (const x of [-6.2, 6.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 220), railMat);
      rail.position.set(x, -0.55, 60);
      this.threeScene.add(rail);
    }

    const laneMat = new THREE.MeshStandardMaterial({ color: 0x101a36, emissive: 0x02040a, roughness: 0.6 });
    for (const x of LANES) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 220), laneMat);
      strip.position.set(x, -0.68, 60);
      this.threeScene.add(strip);
    }
  }

  _createPlayer() {
    const geo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4cffb0, emissive: 0x083322, roughness: 0.35 });
    this._player = new THREE.Mesh(geo, mat);
    this._player.position.set(LANES[this._laneIndex], 0.0, 0);
    this.threeScene.add(this._player);
  }

  _spawnObstacleRow() {
    const taken = new Set();
    const count = 1 + Math.floor(Math.random() * 2); // 1-2 engel
    while (taken.size < count) {
      taken.add(Math.floor(Math.random() * LANES.length));
    }
    for (const lane of taken) {
      const geo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff3b6a, emissive: 0x330010, roughness: 0.35 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(LANES[lane], 0.0, this._spawnZ);
      this.threeScene.add(m);
      this._obstacles.push(m);
    }
    this._spawnZ += 7 + Math.random() * 3.5;
  }

  _changeLane(dir) {
    this._laneTarget = clamp(this._laneTarget + dir, 0, LANES.length - 1);
    // küçük feedback
    if (this._player) this._player.scale.set(1.1, 0.95, 1.1);
  }

  onResize(width, height, aspect) {
    const cam = this.getCamera();
    const threeCam = cam?.getNativeCamera?.() || cam?.getThreeCamera?.() || cam;
    if (threeCam?.isPerspectiveCamera) {
      threeCam.aspect = aspect;
      threeCam.updateProjectionMatrix();
    }
  }

  onUpdate(delta) {
    // ileri akış
    this._distance += this._speed * delta;
    const ramp = 1 + this._distance * this._speedRampPerMeter;
    this._speed = Math.min(this._maxSpeed, this._baseSpeed * ramp);

    // lane lerp
    if (this._laneIndex !== this._laneTarget) {
      const x = this._player.position.x;
      const tx = LANES[this._laneTarget];
      const nx = THREE.MathUtils.lerp(x, tx, 1 - Math.exp(-14 * delta));
      this._player.position.x = nx;
      if (Math.abs(nx - tx) < 0.02) this._laneIndex = this._laneTarget;
    }
    if (this._player) {
      this._player.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - Math.exp(-18 * delta));
      this._player.rotation.y = (this._player.position.x - LANES[this._laneTarget]) * -0.35;
    }

    // engelleri player'a doğru kaydır
    for (let i = this._obstacles.length - 1; i >= 0; i--) {
      const o = this._obstacles[i];
      o.position.z -= this._speed * delta;
      if (o.position.z < -8) {
        this.threeScene.remove(o);
        o.geometry?.dispose?.();
        o.material?.dispose?.();
        this._obstacles.splice(i, 1);
      }
    }

    // spawn
    if (this._distance > this._nextSpawnAt) {
      this._nextSpawnAt = this._distance + 4.5 + Math.random() * 2.5;
      this._spawnObstacleRow();
    }

    // basit çarpışma: aynı lane ve yakın z
    for (const o of this._obstacles) {
      const sameLane = Math.abs(o.position.x - this._player.position.x) < 0.6;
      const nearZ = Math.abs(o.position.z - this._player.position.z) < 0.7;
      if (sameLane && nearZ) {
        // çarpınca reset: sade showcase
        this._distance = 0;
        this._spawnZ = 22;
        this._nextSpawnAt = 6;
        this._speed = this._baseSpeed;
        for (const obs of this._obstacles) {
          this.threeScene.remove(obs);
          obs.geometry?.dispose?.();
          obs.material?.dispose?.();
        }
        this._obstacles = [];
        this._laneIndex = 1;
        this._laneTarget = 1;
        this._player.position.set(LANES[1], 0, 0);
        this._spawnObstacleRow();
        this._spawnObstacleRow();
        break;
      }
    }
  }
}

