import * as THREE from 'three';
import { GameScene } from 'zortengine/src/engine/index.js';
import { getRallyPedals } from '../rallyBridge.js';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Basit ralli: kapalı pist üzerinde ilerleme + lateral kayma ile viraj.
 * Sol joystick: sadece direksiyon (x). Gaz/fren App tarafındaki pedallardan (rallyBridge).
 */
export class RallyScene extends GameScene {
  constructor() {
    super({ name: 'rally', background: new THREE.Color(0x87a8c4) });
    this._curve = null;
    this._trackLength = 1;
    this._s = 0;
    this._lateral = 0;
    this._speed = 0;
    this._maxLateral = 3.2;
    this._carGroup = null;
    this._lap = 0;
    this._lastU = -1;
    this._roadHalfWidth = 3.6;
  }

  setup() {
    const { width, height } = this.engine?.platform?.getViewportSize?.() || { width: 1, height: 1 };
    const aspect = width / Math.max(1, height);

    const camera = new THREE.PerspectiveCamera(58, aspect, 0.5, 500);
    this.setCamera(camera);

    this.threeScene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff5e6, 1.0);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    this.threeScene.add(sun);

    this._buildTrack();
    this._buildCar();
    this._buildDecor();

    const input = this.engine._rnInputManager;
    if (input) {
      this.registerSystem('input', input);
    }
  }

  /**
   * Yatay düzlemde (XZ) merkez çizgiye göre şerit — TubeGeometry şeridi
   * bazen dikey/twist göründüğü için elle quad şeridi kullanıyoruz.
   */
  _createRibbonRoadGeometry(curve, halfWidth, segments) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const p = curve.getPointAt(u);
      const tan = curve.getTangentAt(u);
      let right = new THREE.Vector3().crossVectors(tan, up);
      if (right.lengthSq() < 1e-8) {
        right.set(1, 0, 0);
      } else {
        right.normalize();
      }

      const y = 0.04;
      const pl = new THREE.Vector3().copy(p).addScaledVector(right, halfWidth);
      const pr = new THREE.Vector3().copy(p).addScaledVector(right, -halfWidth);
      pl.y = y;
      pr.y = y;

      positions.push(pl.x, pl.y, pl.z, pr.x, pr.y, pr.z);
      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, u, 1, u);
    }

    const indices = [];
    const stride = 2;
    for (let i = 0; i < segments; i++) {
      const a = i * stride;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  _buildTrack() {
    const pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(45, 0, 15),
      new THREE.Vector3(85, 0, 5),
      new THREE.Vector3(110, 0, -35),
      new THREE.Vector3(95, 0, -75),
      new THREE.Vector3(55, 0, -95),
      new THREE.Vector3(10, 0, -80),
      new THREE.Vector3(-25, 0, -45),
      new THREE.Vector3(-35, 0, -5),
    ];
    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.35);
    this._curve = curve;
    this._trackLength = curve.getLength();

    const halfWidth = 3.6;
    this._roadHalfWidth = halfWidth;

    const roadGeo = this._createRibbonRoadGeometry(curve, halfWidth, 240);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x3d3d3b,
      roughness: 0.94,
      metalness: 0.04
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.receiveShadow = true;
    this.threeScene.add(road);

    // Orta çizgi (sarı şerit)
    const centerGeo = this._createRibbonRoadGeometry(curve, 0.12, 240);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      roughness: 0.85,
      metalness: 0.05
    });
    const centerStrip = new THREE.Mesh(centerGeo, centerMat);
    centerStrip.position.y = 0.02;
    this.threeScene.add(centerStrip);

    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(320, 320),
      new THREE.MeshStandardMaterial({ color: 0x3d5c3a, roughness: 0.98, metalness: 0 })
    );
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.15;
    terrain.receiveShadow = true;
    this.threeScene.add(terrain);
  }

  _buildCar() {
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.55, 3.8),
      new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.45, metalness: 0.35 })
    );
    body.position.y = 0.45;
    body.castShadow = true;
    g.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.4, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.3, metalness: 0.5 })
    );
    cabin.position.set(0, 0.85, -0.2);
    cabin.castShadow = true;
    g.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wx = 0.95;
    const wz = [1.1, -1.1];
    for (const z of wz) {
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(sx * wx, 0.35, z);
        w.castShadow = true;
        g.add(w);
      }
    }

    this.threeScene.add(g);
    this._carGroup = g;
  }

  _buildDecor() {
    const coneGeo = new THREE.ConeGeometry(0.35, 0.9, 6);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.7 });
    const curve = this._curve;
    if (!curve) return;

    const n = 48;
    const coneOffset = this._roadHalfWidth + 0.6;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const p = curve.getPointAt(u);
      const p2 = curve.getPointAt((u + 0.002) % 1);
      const tan = new THREE.Vector3().subVectors(p2, p).normalize();
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      for (const side of [-1, 1]) {
        const c = new THREE.Mesh(coneGeo, coneMat);
        c.position.copy(p).addScaledVector(right, side * coneOffset);
        c.position.y = 0.45;
        c.castShadow = true;
        this.threeScene.add(c);
      }
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

  onUpdate(delta) {
    if (!this._curve || !this._carGroup) return;

    const input = this.engine?._rnInputManager;
    const move = input?.getMovementVector?.('mobile') || { x: 0, z: 0 };
    // Sadece direksiyon (joystick z gaz için kullanılmıyor)
    const steer = clamp(move.x, -1, 1);

    const { gas, brake } = getRallyPedals();
    const maxSpeed = 42;
    let targetSpeed = maxSpeed * gas;
    if (brake > 0) {
      targetSpeed *= 1 - brake * 0.92;
    }
    const accelFollow = 10;
    this._speed += (targetSpeed - this._speed) * (1 - Math.exp(-accelFollow * delta));
    if (brake > 0.05) {
      this._speed -= brake * 28 * delta;
    }
    if (gas < 0.02) {
      this._speed *= Math.exp(-2.8 * delta);
    }
    this._speed = Math.max(0, this._speed);

    this._s += this._speed * delta;
    const len = this._trackLength;
    const u = (this._s % len) / len;

    if (this._lastU > 0.85 && u < 0.15) {
      this._lap++;
    }
    this._lastU = u;

    const lateralSmooth = 8;
    const targetLat = steer * this._maxLateral * 0.92;
    this._lateral += (targetLat - this._lateral) * (1 - Math.exp(-lateralSmooth * delta));

    const p = this._curve.getPointAt(u);
    const tan = this._curve.getTangentAt(u);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tan, up).normalize();
    const pos = new THREE.Vector3().copy(p).addScaledVector(right, this._lateral);
    pos.y = 0;

    this._carGroup.position.copy(pos);
    const look = new THREE.Vector3().copy(pos).add(tan);
    this._carGroup.lookAt(look.x, pos.y + 0.3, look.z);

    const cam = this.getCamera();
    const threeCam = cam?.getNativeCamera?.() || cam?.getThreeCamera?.() || cam;
    if (threeCam) {
      const back = tan.clone().multiplyScalar(-14);
      const upOff = new THREE.Vector3(0, 6.5, 0);
      const camTarget = pos.clone().add(back).add(upOff);
      threeCam.position.lerp(camTarget, 1 - Math.exp(-5 * delta));
      const lookAt = pos.clone();
      lookAt.y += 1.2;
      threeCam.lookAt(lookAt);
    }

  }
}
