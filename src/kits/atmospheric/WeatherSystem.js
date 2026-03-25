import * as THREE from 'three';

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
        const angle = (this.timeCycle * Math.PI * 2) - (Math.PI / 2);
        const radius = 120;

        const sunX = Math.cos(angle) * radius * 0.5;
        const sunY = Math.sin(angle) * radius;
        const sunZ = Math.cos(angle) * radius;

        const moonX = -sunX;
        const moonY = -sunY;
        const moonZ = -sunZ;

        const isNight = sunY < 0;
        const sunsetThreshold = 0.28;

        if (isNight !== this._nightActive) {
            this._nightActive = isNight;
            this._toggleNightObjects(scene, isNight);
        }

        if (this.sun) {
            this.sun.position.set(sunX, Math.max(0.1, sunY), sunZ);
            if (isNight || this.isRaining) {
                this.sun.intensity = 0;
            } else {
                let intensity = Math.min(1.0, sunY / (radius * 0.3)) * 1.5;
                this.sun.intensity = intensity;
                const sunsetFactor = Math.abs(sunY / radius);
                if (sunsetFactor < sunsetThreshold) {
                    const t = 1.0 - (sunsetFactor / sunsetThreshold);
                    this.sun.color.setHSL(0.08, 0.9, 0.5 + 0.2 * (1 - t));
                } else {
                    this.sun.color.setHex(0xffffff);
                }
            }
        }

        if (this.moon) {
            this.moon.position.set(moonX, Math.max(0.1, moonY), moonZ);
            if (!isNight || this.isRaining) {
                this.moon.intensity = 0;
            } else {
                const moonHeightFactor = Math.abs(moonY / radius);
                this.moon.intensity = 0.45 * moonHeightFactor;
            }
        }

        if (this.ambient) {
            if (this.isRaining) {
                this.ambient.intensity = 0.85;
                this.ambient.color.setHex(0xa6c4ff);
                if (scene.background?.isColor) scene.background.setHex(0x334455);
            } else if (isNight) {
                const moonFactor = Math.abs(moonY / radius);
                this.ambient.intensity = 0.65 + (moonFactor * 0.15);
                this.ambient.color.setHex(0x1a2a4a);
                if (scene.background?.isColor) scene.background.setHex(0x050a18);
            } else {
                const sunsetFactor = Math.abs(sunY / radius);
                if (sunsetFactor < sunsetThreshold) {
                    this.ambient.intensity = 0.65;
                    this.ambient.color.setHex(0xffaa77);
                    if (scene.background?.isColor) scene.background.setHex(0x884422);
                } else {
                    this.ambient.intensity = 1.0;
                    this.ambient.color.setHex(0xffffff);
                    if (scene.background?.isColor) scene.background.setHex(0x7fb5e5);
                }
            }
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
