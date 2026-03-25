import * as THREE from 'three';

/**
 * Manages atmospheric effects: Day/Night cycle, Sun/Moon, Rain, and Night-time illumination.
 */
export class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.isRaining = false;
        this.rainGroup = new THREE.Group();
        this._elapsed = 0;
        
        // Time cycle (0 to 1, where 0.5 is noon)
        this.timeCycle = 0.5; 
        this.cycleSpeed = 0.005; 
        
        this.sun = null;
        this.moon = null;
        this.ambient = null;
        
        this._nightActive = false;
        this._rainCheckTime = 0;
    }

    setup() {
        this.scene.threeScene.add(this.rainGroup);
        this._createRaindrops(6300);
        this._initLights();
    }

    _initLights() {
        this.scene.threeScene.traverse(obj => {
            if (obj.isDirectionalLight && !this.sun) this.sun = obj;
            if (obj.isAmbientLight) this.ambient = obj;
        });

        // Create a Moon light (Directional)
        this.moon = new THREE.DirectionalLight(0x405090, 0); // Faint blue at start
        this.moon.position.set(0, -100, 0);
        this.scene.threeScene.add(this.moon);
    }

    _createRaindrops(count) {
        const dropGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 1] = Math.random() * 80;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            velocities[i] = 40 + Math.random() * 20;
        }

        dropGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const rainMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2.0,
            transparent: true,
            opacity: 0.6,
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
        this._elapsed += delta;
        this._updateTimeCycle(delta);
        this._updateRain(delta);
    }

    _updateTimeCycle(delta) {
        this.timeCycle = (this.timeCycle + delta * this.cycleSpeed) % 1.0;
        if (this.scene.hud) {
            this.scene.hud.updateTime(this.timeCycle);
        }

        const angle = (this.timeCycle * Math.PI * 2) - (Math.PI / 2);
        const radius = 120;

        const sunX = Math.cos(angle) * radius * 0.5;
        const sunY = Math.sin(angle) * radius;
        const sunZ = Math.cos(angle) * radius;

        // Moon is opposite to the sun
        const moonX = -sunX;
        const moonY = -sunY;
        const moonZ = -sunZ;

        const isNight = sunY < 0;
        const sunsetThreshold = 0.28;

        // Toggle Night Illumination (Street lights, Windows)
        if (isNight !== this._nightActive) {
            this._nightActive = isNight;
            this._toggleNightObjects(isNight);
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
                    this.sun.color.setHSL(0.08, 0.9, 0.5 + 0.2 * (1-t)); // Golden hour
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
                if (this.scene.threeScene.background) this.scene.threeScene.background.setHex(0x334455);
            } else if (isNight) {
                const moonFactor = Math.abs(moonY / radius);
                this.ambient.intensity = 0.65 + (moonFactor * 0.15);
                this.ambient.color.setHex(0x1a2a4a); // Deep blue-navy
                if (this.scene.threeScene.background) this.scene.threeScene.background.setHex(0x050a18);
            } else {
                const sunsetFactor = Math.abs(sunY / radius);
                if (sunsetFactor < sunsetThreshold) {
                    this.ambient.intensity = 0.65;
                    this.ambient.color.setHex(0xffaa77); // Sunset orange
                    if (this.scene.threeScene.background) this.scene.threeScene.background.setHex(0x884422);
                } else {
                    this.ambient.intensity = 1.0;
                    this.ambient.color.setHex(0xffffff);
                    if (this.scene.threeScene.background) this.scene.threeScene.background.setHex(0x7fb5e5); // Sky blue
                }
            }
        }
    }

    _toggleNightObjects(isNight) {
        this.scene.threeScene.traverse(obj => {
            // 1. Street Lamp Bulbs
            if (obj.name === 'lamp_bulb') {
                if (obj.material) obj.material.emissiveIntensity = isNight ? 2.5 : 0.0;
            }
            // 2. Street Lamp Point Lights
            if (obj.name === 'lamp_light') {
                obj.intensity = isNight ? 16 : 0;
            }
            // 3. Window Glass
            if (obj.name === 'window_glow') {
                if (obj.material) {
                    obj.material.emissive = new THREE.Color(isNight ? 0xfff0aa : 0x000000);
                    obj.material.emissiveIntensity = isNight ? 0.35 : 0.0;
                }
            }
            // 4. Car Lights
            if (obj.name === 'car_front_light') {
                if (obj.material) obj.material.emissiveIntensity = isNight ? 5.0 : 0.2;
            }
            if (obj.name === 'car_back_light') {
                if (obj.material) obj.material.emissiveIntensity = isNight ? 2.5 : 0.1;
            }
            // 5. Monitor Screens
            if (obj.name === 'screen_glow') {
                if (obj.material) obj.material.emissiveIntensity = isNight ? 1.0 : 0.2;
            }
        });
    }

    _updateRain(delta) {
        if (!this.isRaining) {
            this.rainGroup.visible = false;
            return;
        }
        this.rainGroup.visible = true;
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
