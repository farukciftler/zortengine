import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class TapArenaScene extends GameScene {
  constructor() {
    super({ name: 'tap-arena', background: new THREE.Color(0x070b12) });
    this._targets = [];
    this._cooldownUntil = 0;
  }

  setup() {
    const { width, height } = this.engine?.platform?.getViewportSize?.() || { width: 1, height: 1 };
    const aspect = width / Math.max(1, height);

    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.set(0, 4.5, 7);
    camera.lookAt(0, 0, 0);
    this.setCamera(camera);

    this.threeScene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(8, 12, 4);
    this.threeScene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x0d1322, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    this.threeScene.add(ground);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.12, 10, 48),
      new THREE.MeshStandardMaterial({ color: 0x2a66ff, emissive: 0x0a1a44, roughness: 0.2, metalness: 0.2 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.75;
    this.threeScene.add(ring);

    this._spawnTarget();
    this._spawnTarget();
    this._spawnTarget();

    const input = this.engine._rnInputManager;
    if (input) {
      this.registerSystem('input', input);
      input.on('pointerDown', () => {
        const now = Date.now();
        if (now < this._cooldownUntil) return;
        this._cooldownUntil = now + 80;
        this._hitNearestTarget();
      });
    }
  }

  _spawnTarget() {
    const geo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffcc33, emissive: 0x331a00, roughness: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * 6.5, 0.2 + Math.random() * 1.2, (Math.random() - 0.5) * 6.5);
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    mesh.userData = { wobble: Math.random() * 10, alive: true, pop: 0 };
    this.threeScene.add(mesh);
    this._targets.push(mesh);
  }

  _hitNearestTarget() {
    if (!this._targets.length) return;
    const cam = this.getCamera()?.getNativeCamera?.() || this.getCamera();
    const camPos = cam?.position || new THREE.Vector3();
    let best = null;
    let bestD = Infinity;
    for (const t of this._targets) {
      if (!t?.userData?.alive) continue;
      const d = t.position.distanceTo(camPos);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    if (!best) return;
    best.userData.alive = false;
    best.userData.pop = 1;
    // küçük bir "hit" hissi
    best.scale.set(1.25, 1.25, 1.25);
    best.material.emissive?.setHex?.(0xff3300);
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
    for (let i = this._targets.length - 1; i >= 0; i--) {
      const t = this._targets[i];
      if (!t) continue;
      t.userData.wobble += delta;
      const w = t.userData.wobble;
      if (t.userData.alive) {
        t.rotation.y += delta * 0.7;
        t.position.y = 0.25 + Math.sin(w * 1.8) * 0.35;
      } else {
        t.userData.pop = clamp(t.userData.pop - delta * 2.8, 0, 1);
        const s = 0.2 + t.userData.pop;
        t.scale.setScalar(s);
        t.rotation.x += delta * 3.0;
        t.rotation.y += delta * 2.2;
        t.position.y += delta * 2.0;
        if (t.userData.pop <= 0.001) {
          this.threeScene.remove(t);
          t.geometry?.dispose?.();
          t.material?.dispose?.();
          this._targets.splice(i, 1);
          this._spawnTarget();
        }
      }
    }
  }
}

