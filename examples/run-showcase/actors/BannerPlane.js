import * as THREE from 'three';

/**
 * BannerPlane — A propeller airplane that flies across the sky
 * trailing a text banner behind it. Loops on a large circuit.
 *
 * Usage:
 *   const plane = new BannerPlane(threeScene, { text: 'HELLO WORLD' });
 *   plane.setup();
 *   // In update loop:
 *   plane.update(delta);
 */
export class BannerPlane {
    /**
     * @param {THREE.Scene} scene - The Three.js scene to add the airplane to.
     * @param {object} opts
     * @param {string} [opts.text='HIRE ME!'] - The banner text.
     * @param {number} [opts.altitude=45] - Flight altitude.
     * @param {number} [opts.speed=12] - Flight speed.
     * @param {number} [opts.radius=120] - Orbit radius.
     * @param {number} [opts.bannerColor='#e53935'] - Banner background color.
     */
    constructor(scene, opts = {}) {
        this.scene = scene;
        this.text = opts.text || 'HIRE ME!';
        this.altitude = opts.altitude || 45;
        this.speed = opts.speed || 12;
        this.radius = opts.radius || 120;
        this.bannerColor = opts.bannerColor || '#e53935';

        this.group = null;
        this.propeller = null;
        this.angle = 0;
    }

    setup() {
        this.group = new THREE.Group();

        // ── Airplane Body ────────────────────────────────────────────────────

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3, metalness: 0.2 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.4 });
        const windowMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, metalness: 0.6, roughness: 0.1 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.9, roughness: 0.1 });

        const plane = new THREE.Group();

        // Fuselage (elongated cylinder)
        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 5, 8), bodyMat);
        fuselage.rotation.z = Math.PI / 2;
        plane.add(fuselage);

        // Nose cone
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8), bodyMat);
        nose.rotation.z = -Math.PI / 2;
        nose.position.x = 3.1;
        plane.add(nose);

        // Tail cone
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.5, 8), bodyMat);
        tail.rotation.z = Math.PI / 2;
        tail.position.x = -3.2;
        plane.add(tail);

        // Red stripe on body
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 1.3), accentMat);
        stripe.position.y = 0.1;
        plane.add(stripe);

        // Wings
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 6), wingMat);
        wing.position.set(0.3, 0, 0);
        plane.add(wing);

        // Wing tips (red)
        [-3, 3].forEach(z => {
            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.3), accentMat);
            tip.position.set(0.3, 0, z);
            plane.add(tip);
        });

        // Tail Fin (Vertical)
        const vFin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.08), accentMat);
        vFin.position.set(-3, 0.9, 0);
        plane.add(vFin);

        // Tail Fin (Horizontal)
        const hFin = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 2.5), wingMat);
        hFin.position.set(-3, 0.3, 0);
        plane.add(hFin);

        // Windows (small blue dots along fuselage)
        for (let i = -3; i <= 2; i++) {
            const win = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), windowMat);
            win.scale.set(1, 1, 0.3);
            win.position.set(i * 0.6, 0.3, 0.55);
            plane.add(win);
            const win2 = win.clone();
            win2.position.z = -0.55;
            plane.add(win2);
        }

        // ── Propeller ────────────────────────────────────────────────────────
        this.propeller = new THREE.Group();
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8), metalMat);
        hub.rotation.z = Math.PI / 2;
        this.propeller.add(hub);

        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 0.04), metalMat);
            blade.rotation.x = (i / 3) * Math.PI * 2;
            blade.position.y = Math.cos(blade.rotation.x) * 0.9;
            blade.position.z = Math.sin(blade.rotation.x) * 0.9;
            this.propeller.add(blade);
        }
        this.propeller.position.x = 3.7;
        plane.add(this.propeller);

        // ── Banner ───────────────────────────────────────────────────────────
        const bannerCanvas = document.createElement('canvas');
        bannerCanvas.width = 1024;
        bannerCanvas.height = 128;
        const ctx = bannerCanvas.getContext('2d');
        ctx.fillStyle = this.bannerColor;
        ctx.fillRect(0, 0, 1024, 128);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, 512, 64);

        const bannerTex = new THREE.CanvasTexture(bannerCanvas);
        const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });

        const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.5), bannerMat);
        bannerMesh.position.set(-9, -0.3, 0);
        plane.add(bannerMesh);

        // Tow ropes (connecting banner to plane)
        const ropeMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const rope1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.5, 4), ropeMat);
        rope1.rotation.z = Math.PI / 2;
        rope1.position.set(-4.5, -0.15, 0.6);
        plane.add(rope1);
        const rope2 = rope1.clone();
        rope2.position.z = -0.6;
        plane.add(rope2);

        // Scale up the whole plane
        plane.scale.set(1.2, 1.2, 1.2);

        this.group.add(plane);
        this.group.position.y = this.altitude;
        this.scene.add(this.group);
    }

    /**
     * Update the airplane position and propeller rotation.
     * @param {number} delta - Time since last frame in seconds.
     */
    update(delta) {
        if (!this.group) return;

        this.angle += delta * (this.speed / this.radius);

        // Circular flight path
        const x = Math.cos(this.angle) * this.radius;
        const z = Math.sin(this.angle) * this.radius;

        this.group.position.x = x;
        this.group.position.z = z;

        // Face direction of travel (tangent to circle)
        this.group.rotation.y = -this.angle + Math.PI / 2;

        // Slight banking during turns
        this.group.rotation.z = Math.sin(this.angle * 2) * 0.08;

        // Propeller spin
        if (this.propeller) {
            this.propeller.rotation.x += delta * 35;
        }
    }

    dispose() {
        if (this.group) {
            this.scene.remove(this.group);
            this.group = null;
        }
    }
}
