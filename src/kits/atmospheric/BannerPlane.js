import * as THREE from 'three';
import { RenderSettings } from '../../../examples/run-showcase/data/RenderSettings.js';

/**
 * BannerPlane — An atmospheric element that flies in a circular path trailing a text banner.
 */
export class BannerPlane {
    constructor(options = {}) {
        this.context = null;
        this.text = options.text || 'ZORT ENGINE';
        this.altitude = options.altitude || 50;
        this.speed = options.speed || 12;
        this.radius = options.radius || 120;
        this.bannerColor = options.bannerColor || '#d35400';
        
        this.group = new THREE.Group();
        this.propeller = null;
        this.angle = 0;
    }

    onAttach(context) {
        this.context = context;
        this.setup();
    }

    setup() {
        const scene = this.context.scene.getRenderScene();
        this._buildPlane();
        this.group.position.y = this.altitude;
        scene.add(this.group);
    }

    _buildPlane() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3 });
        const accentMat = new THREE.MeshStandardMaterial({ color: this.bannerColor, roughness: 0.4 });
        const windowMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, metalness: 0.6 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.9 });

        const plane = new THREE.Group();

        // Fuselage
        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 5, 8), bodyMat);
        fuselage.rotation.z = Math.PI / 2;
        plane.add(fuselage);

        // Nose & Tail
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8), bodyMat);
        nose.rotation.z = -Math.PI / 2;
        nose.position.x = 3.1;
        plane.add(nose);

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.5, 8), bodyMat);
        tail.rotation.z = Math.PI / 2;
        tail.position.x = -3.2;
        plane.add(tail);

        // Wings
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 6), bodyMat);
        wing.position.set(0.3, 0, 0);
        plane.add(wing);

        // Propeller
        this.propeller = new THREE.Group();
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8), metalMat);
        hub.rotation.z = Math.PI / 2;
        this.propeller.add(hub);
        const bladeGeo = new THREE.BoxGeometry(0.15, 1.8, 0.04);
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(bladeGeo, metalMat);
            blade.rotation.x = (i / 3) * Math.PI * 2;
            blade.position.y = Math.cos(blade.rotation.x) * 0.9;
            blade.position.z = Math.sin(blade.rotation.x) * 0.9;
            this.propeller.add(blade);
        }
        this.propeller.position.x = 3.7;
        plane.add(this.propeller);

        // Banner
        const bannerCanvas = document.createElement('canvas');
        bannerCanvas.width = 1024; bannerCanvas.height = 128;
        const ctx = bannerCanvas.getContext('2d');
        ctx.fillStyle = this.bannerColor;
        ctx.fillRect(0, 0, 1024, 128);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, 512, 64);

        const bannerMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 1.5),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bannerCanvas), side: THREE.DoubleSide })
        );
        bannerMesh.position.set(-9, -0.3, 0);
        plane.add(bannerMesh);

        plane.scale.set(1.2, 1.2, 1.2);
        
        plane.traverse(o => {
            if (o.isMesh) {
                o.castShadow = RenderSettings.policy.cast.atmospheric;
                o.receiveShadow = RenderSettings.policy.receive.props;
            }
        });

        this.group.add(plane);
    }

    update(delta) {
        if (!this.group) return;

        this.angle += delta * (this.speed / this.radius);
        this.group.position.x = Math.cos(this.angle) * this.radius;
        this.group.position.z = Math.sin(this.angle) * this.radius;
        this.group.rotation.y = -this.angle + Math.PI / 2;
        this.group.rotation.z = Math.sin(this.angle * 2) * 0.08;

        if (this.propeller) {
            this.propeller.rotation.x += delta * 35;
        }
    }

    dispose() {
        if (this.group && this.context) {
            this.context.getRenderScene().remove(this.group);
        }
    }
}
