import * as THREE from 'three';
import { RenderSettings } from '../../../examples/run-showcase/data/RenderSettings.js';

/**
 * WeatherSystem — Core kit for managing environment effects like rain and day/night cycles.
 */
export class WeatherSystem {
    constructor(options = {}) {
        this.context = null;
        this.isRaining = options.isRaining || false;
        this.timeCycle = options.startTime || 0.5; // 0.5 = Noon
        this.cycleSpeed = options.cycleSpeed || 0.005;
        
        this.rainGroup = new THREE.Group();
        this.rainGroup.name = 'WeatherSystem_RainGroup';
        this.rainGroup.visible = this.isRaining;
        
        this.sun = null;
        this.moon = null;
        this.ambient = null;
        
        this._elapsed = 0;
        this._nightActive = false;
        this._originalLights = new Map();
        
        this.rainCount = options.rainCount || 6000;
        this.rainSize = options.rainSize || 2.0;
        this.rainOpacity = options.rainOpacity || 0.6;
    }

    /**
     * Called when the system is registered with the scene.
     */
    onAttach(context) {
        this.context = context;
        const scene = this.context.scene.getRenderScene();
        
        scene.add(this.rainGroup);
        this._createRaindrops(this.rainCount);
        this._initLights(scene);
        this.setRain(this.isRaining);
    }

    _initLights(scene) {
        scene.traverse(obj => {
            if (obj.isDirectionalLight && !this.sun) this.sun = obj;
            if (obj.isAmbientLight && !this.ambient) this.ambient = obj;
        });

        // Create a Moon light if it doesn't exist
        this.moon = new THREE.DirectionalLight(0x405090, 0);
        this.moon.name = 'WeatherSystem_MoonLight';
        scene.add(this.moon);
    }

    _createRaindrops(count) {
        const dropGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 350;
            positions[i * 3 + 1] = Math.random() * 80;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 250;
            velocities[i] = 40 + Math.random() * 20;
        }

        dropGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const rainMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: this.rainSize,
            transparent: true,
            opacity: this.rainOpacity,
            sizeAttenuation: false,
            depthTest: false
        });

        this.points = new THREE.Points(dropGeo, rainMat);
        this.rainGroup.add(this.points);
        this.rainVelocities = velocities;
    }

    setRain(active) {
        this.isRaining = active;
        this.rainGroup.visible = active;
    }

    update(delta) {
        if (!this.context) return;
        
        this._elapsed += delta;
        this._updateTimeCycle(delta);
        this._updateRain(delta);
    }

    _updateTimeCycle(delta) {
        this.timeCycle = (this.timeCycle + delta * this.cycleSpeed) % 1.0;
        const scene = this.context.scene.getRenderScene();
        
        // Define key timeframes for interpolation
        // 0.0: Midnight, 0.25: Sunrise, 0.5: Noon, 0.75: Sunset
        const states = [
            { time: 0.0,  amb: 0x101a30, ambInt: 0.65, sky: 0x02050c, sunInt: 0.0, moonInt: 0.6,  fog: 0x02050c },
            { time: 0.22, amb: 0x101a30, ambInt: 0.65, sky: 0x02050c, sunInt: 0.0, moonInt: 0.6,  fog: 0x02050c },
            { time: 0.30, amb: 0xff7e4d, ambInt: 0.85, sky: 0x6e3a2a, sunInt: 0.6, moonInt: 0.0,  fog: 0x4a2518 },
            { time: 0.50, amb: 0xffffff, ambInt: 1.00, sky: 0x7fb5e5, sunInt: 1.6, moonInt: 0.0,  fog: 0xc9e2ff },
            { time: 0.70, amb: 0xffffff, ambInt: 1.00, sky: 0x7fb5e5, sunInt: 1.6, moonInt: 0.0,  fog: 0xc9e2ff },
            { time: 0.78, amb: 0xff6b35, ambInt: 0.88, sky: 0x8a3a2a, sunInt: 0.7, moonInt: 0.0,  fog: 0x4a1a0a },
            { time: 0.85, amb: 0x101a30, ambInt: 0.65, sky: 0x02050c, sunInt: 0.0, moonInt: 0.6,  fog: 0x02050c },
            { time: 1.00, amb: 0x101a30, ambInt: 0.65, sky: 0x02050c, sunInt: 0.0, moonInt: 0.6,  fog: 0x02050c }
        ];

        // Find current pair for LERP
        let s0 = states[0], s1 = states[states.length - 1];
        for (let i = 0; i < states.length - 1; i++) {
            if (this.timeCycle >= states[i].time && this.timeCycle <= states[i + 1].time) {
                s0 = states[i];
                s1 = states[i + 1];
                break;
            }
        }

        const t = (this.timeCycle - s0.time) / (s1.time - s0.time || 0.001);
        
        // Colors
        const cAmb = new THREE.Color(s0.amb).lerp(new THREE.Color(s1.amb), t);
        const cSky = new THREE.Color(s0.sky).lerp(new THREE.Color(s1.sky), t);
        
        // Intensities
        const iAmb = s0.ambInt + (s1.ambInt - s0.ambInt) * t;
        const iSun = s0.sunInt + (s1.sunInt - s0.sunInt) * t;
        const iMoon = s0.moonInt + (s1.moonInt - s0.moonInt) * t;

        // Position Sun & Moon
        const angle = (this.timeCycle * Math.PI * 2) - (Math.PI / 2);
        const radius = 120;
        const sunPos = new THREE.Vector3(Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius, Math.cos(angle) * radius);
        const moonPos = new THREE.Vector3(-sunPos.x, -sunPos.y, -sunPos.z);
        
        // Get player position for shadow tracking
        const player = this.context.scene.player?.position || this.context.scene.player?.group?.position || new THREE.Vector3();

        if (this.sun) {
            // Shadow Throttling: Update shadow camera and trigger shadow map render only at 15-20 fps
            const lastPos = this._lastSunPos || new THREE.Vector3();
            const shouldUpdateShadow = sunPos.distanceTo(lastPos) > 0.05 || (this._shadowTick || 0) > 4;

            if (shouldUpdateShadow) {
                this.sun.position.copy(sunPos).add(player);
                this.sun.target.position.copy(player);
                this.sun.target.updateMatrixWorld();
                this._lastSunPos = sunPos.clone();
                this._shadowTick = 0;
                
                // Manual Shadow Update Trigger
                const renderer = this.context.getRenderer?.();
                if (renderer && !RenderSettings.shadows.autoUpdate) {
                    renderer.shadowMap.needsUpdate = true;
                }
            } else {
                this._shadowTick = (this._shadowTick || 0) + 1;
            }

            this.sun.intensity = this.isRaining ? 0 : iSun;
            this.sun.color.copy(cAmb).lerp(new THREE.Color(0xffffff), 0.5);
            this.sun.position.y = Math.max(0.1, this.sun.position.y);
            
            // Apply RenderSettings and Layer constraints
            if (this.sun.shadow) {
                const s = RenderSettings.shadows.camera.size;
                this.sun.shadow.camera.left = -s;
                this.sun.shadow.camera.right = s;
                this.sun.shadow.camera.top = s;
                this.sun.shadow.camera.bottom = -s;
                
                // PERFORMANCE: Shadow camera ONLY sees Layer 1
                // This will skip intersection tests for ALL objects NOT on Layer 1
                this.sun.shadow.camera.layers.set(1);
                
                this.sun.shadow.camera.updateProjectionMatrix();
                
                if (this.sun.shadow.mapSize.x !== RenderSettings.shadows.resolution) {
                    this.sun.shadow.mapSize.set(RenderSettings.shadows.resolution, RenderSettings.shadows.resolution);
                }
            }
        }

        if (this.moon) {
            this.moon.position.copy(moonPos);
            this.moon.intensity = this.isRaining ? 0 : iMoon;
            this.moon.position.y = Math.max(0.1, this.moon.position.y);
        }

        if (this.ambient) {
            if (this.isRaining) {
                this.ambient.intensity = 0.85;
                this.ambient.color.setHex(0xa6c4ff);
                if (scene.background?.isColor) scene.background.setHex(0x334455);
            } else {
                this.ambient.intensity = iAmb;
                this.ambient.color.copy(cAmb);
                if (scene.background?.isColor) scene.background.copy(cSky);
            }
        }

        // Interpolate Fog if present
        const cFog = new THREE.Color(s0.fog).lerp(new THREE.Color(s1.fog), t);
        if (scene.fog) {
            scene.fog.color.copy(cFog);
            if (this.isRaining) {
                scene.fog.density = 0.015;
            } else {
                // Thicker fog at night/dawn
                const density = 0.005 + (1 - iAmb) * 0.01;
                scene.fog.density = density;
            }
        }

        // Handle night-time objects toggle
        const isNight = this.timeCycle < 0.26 || this.timeCycle > 0.78;
        if (isNight !== this._nightActive) {
            this._nightActive = isNight;
            this._toggleNightObjects(scene, isNight);
        }
    }

    _toggleNightObjects(scene, isNight) {
        scene.traverse(obj => {
            if (obj.name === 'lamp_bulb') {
                if (obj.material) obj.material.emissiveIntensity = isNight ? 2.5 : 0.0;
            }
            if (obj.name === 'lamp_light') {
                obj.intensity = isNight ? 16 : 0;
            }
            if (obj.name === 'window_glow') {
                if (obj.material) {
                    obj.material.emissive = new THREE.Color(isNight ? 0xfff0aa : 0x000000);
                    obj.material.emissiveIntensity = isNight ? 0.35 : 0.0;
                }
            }
            if (obj.name === 'car_front_light') {
                if (obj.material) obj.material.emissiveIntensity = isNight ? 5.0 : 0.2;
            }
            if (obj.name === 'car_back_light') {
                if (obj.material) obj.material.emissiveIntensity = isNight ? 2.5 : 0.1;
            }
            if (obj.name === 'screen_glow') {
                if (obj.material) obj.material.emissiveIntensity = isNight ? 1.0 : 0.2;
            }
        });
    }

    _updateRain(delta) {
        if (!this.isRaining) return;

        const positions = this.points.geometry.attributes.position.array;
        for (let i = 0; i < this.rainVelocities.length; i++) {
            positions[i * 3 + 1] -= this.rainVelocities[i] * delta;
            positions[i * 3] += 7 * delta;
            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 80;
                positions[i * 3] += (Math.random() - 0.5) * 5;
            }
        }
        this.points.geometry.attributes.position.needsUpdate = true;
    }
}
