import * as THREE from 'three';
import { resources as Res } from '../../engine/resources/ResourceLibrary.js';
import { ObjectPool } from '../../engine/object/ObjectPool.js';
import { RenderSettings } from '../../../examples/run-showcase/data/RenderSettings.js';

/**
 * CityKit — Utilities for procedural city generation, road building, and vehicle meshes.
 */
export const CityKit = {
    _textureCache: new Map(),
    _vehiclePool: null,

    /**
     * Initializes the vehicle pool if not already present.
     */
    _initPool() {
        if (this._vehiclePool) return;
        this._vehiclePool = new ObjectPool(() => this._buildVehicleMesh(), {
            initialSize: 5,
            maxSize: 100
        });
    },

    /**
     * Creates a stone pavement texture using a canvas.
     */
    createPavementTexture(options = {}) {
        const key = `pavement_${options.color || 'default'}_${options.repeatX || 6}`;
        if (this._textureCache.has(key)) return this._textureCache.get(key);

        const {
            width = 512,
            height = 512,
            color = '#6e6e6c',
            repeatX = 6,
            repeatY = 18
        } = options;

        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        const ctx = c.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);

        const base = [105, 108, 106];
        for (let row = 0; row < 14; row++) {
            for (let col = 0; col < 14; col++) {
                const ox = col * 36 + (row % 2) * 18;
                const oy = row * 36;
                const w = 32 + Math.random() * 6;
                const h = 30 + Math.random() * 8;
                const jitter = () => (Math.random() - 0.5) * 8;
                ctx.fillStyle = `rgb(${base[0] + jitter()},${base[1] + jitter()},${base[2] + jitter()})`;
                ctx.beginPath();
                const rx = 4;
                ctx.moveTo(ox + rx, oy);
                ctx.lineTo(ox + w - rx, oy);
                ctx.quadraticCurveTo(ox + w, oy, ox + w, oy + rx);
                ctx.lineTo(ox + w, oy + h - rx);
                ctx.quadraticCurveTo(ox + w, oy + h, ox + w - rx, oy + h);
                ctx.lineTo(ox + rx, oy + h);
                ctx.quadraticCurveTo(ox, oy + h, ox, oy + h - rx);
                ctx.lineTo(ox, oy + rx);
                ctx.quadraticCurveTo(ox, oy, ox + rx, oy);
                ctx.closePath();
                ctx.fill();
            }
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        tex.colorSpace = THREE.SRGBColorSpace;
        
        this._textureCache.set(key, tex);
        return tex;
    },

    /**
     * Creates a randomized license plate texture.
     */
    createLicensePlateTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 128, 32);
        ctx.fillStyle = '#003399';
        ctx.fillRect(0, 0, 16, 32);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 126, 30);
        
        const city = Math.floor(Math.random() * 81 + 1).toString().padStart(2, '0');
        const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                      (Math.random() > 0.5 ? String.fromCharCode(65 + Math.floor(Math.random() * 26)) : '');
        const numbers = Math.floor(Math.random() * 9000 + 100).toString().slice(0, 4);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${city} ${letters} ${numbers}`, 72, 24);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    },

    /**
     * Acquires a pooled vehicle mesh and sets its paint color.
     */
    createVehicleMesh(color = 0xc0392b) {
        this._initPool();
        const mesh = this._vehiclePool.acquire();
        
        // Update vehicle primary paint color
        const paintMat = Res.getMaterial(`car_paint_${color}`, () => new THREE.MeshStandardMaterial({
            color: color, roughness: 0.38, metalness: 0.55
        }));
        
        mesh.traverse(o => {
            if (o.userData.isPaintable) o.material = paintMat;
        });
        
        return mesh;
    },

    /**
     * Releases a vehicle mesh back into the pool.
     */
    releaseVehicleMesh(mesh) {
        if (this._vehiclePool && mesh) {
            this._vehiclePool.release(mesh);
        }
    },

    /**
     * Internal: Builds a new vehicle mesh structure.
     */
    _buildVehicleMesh() {
        const group = new THREE.Group();
        
        // Default paint (will be overridden on acquire)
        const paint = Res.getMaterial('car_paint_default', () => new THREE.MeshStandardMaterial({
            color: 0xffffff, roughness: 0.38, metalness: 0.55
        }));
        
        const plastic = Res.getMaterial('car_plastic', () => new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1e, roughness: 0.65 
        }));
        
        const glassMat = Res.getMaterial('car_glass', () => new THREE.MeshStandardMaterial({
            color: 0x0d1520, roughness: 0.08, metalness: 0.65, transparent: true, opacity: 0.82
        }));
        
        const rubber = Res.getMaterial('car_rubber', () => new THREE.MeshStandardMaterial({ 
            color: 0x0a0a0a, roughness: 0.98 
        }));
        
        const emissiveHead = Res.getMaterial('car_light_front', () => new THREE.MeshStandardMaterial({
            color: 0xfff8e8, emissive: 0xffe8b8, emissiveIntensity: 0.45, roughness: 0.35
        }));
        
        const emissiveTail = Res.getMaterial('car_light_back', () => new THREE.MeshStandardMaterial({
            color: 0x8b0000, emissive: 0xff2200, emissiveIntensity: 0.35, roughness: 0.4
        }));

        const wr = 0.34;
        const chassis = new THREE.Mesh(Res.getBox(1.92, 0.52, 4.35), paint);
        chassis.position.set(0, wr + 0.26, 0);
        chassis.userData.isPaintable = true;
        group.add(chassis);

        const cabin = new THREE.Mesh(Res.getBox(1.78, 0.68, 2.15), paint);
        cabin.position.set(0, wr + 0.86, -0.2);
        cabin.userData.isPaintable = true;
        group.add(cabin);

        // Windows
        const wind = new THREE.Mesh(Res.getPlane(1.55, 0.62), glassMat);
        wind.position.set(0, wr + 0.95, 0.72);
        wind.rotation.x = -0.32;
        group.add(wind);

        // Wheels
        const wheelGeo = Res.getCylinder(wr, wr, 0.22, 20);
        [[-0.86, 1.32], [0.86, 1.32], [-0.86, -1.32], [0.86, -1.32]].forEach(([wx, wz]) => {
            const w = new THREE.Mesh(wheelGeo, rubber);
            w.rotation.z = Math.PI / 2;
            w.position.set(wx, wr, wz);
            group.add(w);
        });

        // Lights
        const lightGeo = Res.getBox(0.38, 0.14, 0.08);
        [[-0.55, 2.18], [0.55, 2.18]].forEach(([hx, hz]) => {
            const h = new THREE.Mesh(lightGeo, emissiveHead);
            h.position.set(hx, wr + 0.35, hz);
            h.name = 'car_front_light';
            group.add(h);
        });
        
        const tailGeo = Res.getBox(0.32, 0.12, 0.06);
        [[-0.5, -2.2], [0.5, -2.2]].forEach(([tx, tz]) => {
            const t = new THREE.Mesh(tailGeo, emissiveTail);
            t.position.set(tx, wr + 0.32, tz);
            t.name = 'car_back_light';
            group.add(t);
        });

        // Plates - Shared geometry, but unique texture per physical car instance (pooled)
        const plateTex = this.createLicensePlateTexture();
        const plateMat = new THREE.MeshStandardMaterial({ map: plateTex }); 
        const plateF = new THREE.Mesh(Res.getPlane(0.5, 0.12), plateMat);
        plateF.position.set(0, wr + 0.2, 2.4);
        group.add(plateF);

        group.traverse(o => {
            if (o.isMesh) {
                const isProp = o.name.includes('light') || o.name.includes('plate');
                o.castShadow = isProp ? RenderSettings.policy.cast.props : RenderSettings.policy.cast.vehicles;
                o.receiveShadow = RenderSettings.policy.receive.vehicles;
            }
        });

        return group;
    }
};
