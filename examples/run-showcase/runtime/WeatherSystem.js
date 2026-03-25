import * as THREE from 'three';

/**
 * Manages atmospheric effects: Day/Night cycle and rain.
 * Fixed: Night is no longer pitch black, rain and sun are mutually exclusive.
 */
export class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.isRaining = false;
        this.rainGroup = new THREE.Group();
        this._elapsed = 0;
        
        // Time cycle (0 to 1, where 0.25 is noon)
        this.timeCycle = 0.25; 
        this.cycleSpeed = 0.006; 
        
        this.sun = null;
        this.ambient = null;
        
        // Timer for toggling rain automatically (so they don't overlap)
        this._rainCheckTime = 0;
    }

    setup() {
        this.scene.threeScene.add(this.rainGroup);
        this._createRaindrops(6000);
        this._findLights();
    }

    _findLights() {
        this.scene.threeScene.traverse(obj => {
            if (obj.isDirectionalLight) this.sun = obj;
            if (obj.isAmbientLight) this.ambient = obj;
        });
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
            opacity: 0.65,
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
        this._updateWeatherCycle(delta);
        this._updateTimeCycle(delta);
        this._updateRain(delta);
    }

    _updateWeatherCycle(delta) {
        this._rainCheckTime += delta;
        // Automatically toggle rain every 40 seconds for variety, 
        // ensuring it happens mostly when sun is low or toggled off.
        if (this._rainCheckTime > 40) {
            this._rainCheckTime = 0;
            // Only rain if we're not set to manual? 
            // For now, let's keep it simple: if it's raining, we'll hide the sun.
        }
    }

    _updateTimeCycle(delta) {
        this.timeCycle = (this.timeCycle + delta * this.cycleSpeed) % 1.0;
        if (this.scene.hud) {
            this.scene.hud.updateTime(this.timeCycle);
        }

        const angle = this.timeCycle * Math.PI * 2;
        const radius = 100;

        const sunX = Math.cos(angle) * radius;
        const sunY = Math.sin(angle) * radius;
        const sunZ = Math.sin(angle) * radius * 0.5;

        const isNight = sunY < 0;
        const sunsetThreshold = 0.25;

        if (this.sun) {
            this.sun.position.set(sunX, Math.max(0.1, sunY), sunZ);
            
            // MUTUAL EXCLUSION: If raining, hide sun completely
            if (isNight || this.isRaining) {
                this.sun.intensity = 0;
            } else {
                let intensity = Math.min(1.0, sunY / (radius * 0.3)) * 1.5;
                this.sun.intensity = intensity;

                const sunsetFactor = Math.abs(sunY / radius);
                if (sunsetFactor < sunsetThreshold) {
                    const t = 1.0 - (sunsetFactor / sunsetThreshold);
                    this.sun.color.setHSL(0.1, 0.8, 0.5 + 0.2 * (1-t));
                } else {
                    this.sun.color.setHex(0xffffff);
                }
            }
        }

        if (this.ambient) {
            const sunsetFactor = Math.abs(sunY / radius);
            
            if (this.isRaining) {
                // Fixed Overcast lighting (not too dark)
                this.ambient.intensity = 0.85;
                this.ambient.color.setHex(0xa6c4ff);
                if (this.scene.threeScene.background) this.scene.threeScene.background.setHex(0x445566);
            } else if (isNight) {
                // FIXED: Night is much brighter now, like original setup but blue-tinted
                this.ambient.intensity = 0.75; 
                this.ambient.color.setHex(0x2a3a5a);
                if (this.scene.threeScene.background) this.scene.threeScene.background.setHex(0x0a1020);
            } else {
                // Normal Day/Sunset
                if (sunsetFactor < sunsetThreshold) {
                    this.ambient.intensity = 0.6 + (0.9 - 0.6) * (sunsetFactor / sunsetThreshold);
                    this.ambient.color.setHex(0xffd7b5);
                    if (this.scene.threeScene.background) this.scene.threeScene.background.setHex(0xcc6633);
                } else {
                    this.ambient.intensity = 0.95;
                    this.ambient.color.setHex(0xffffff);
                    if (this.scene.threeScene.background) this.scene.threeScene.background.setHex(0x8899aa);
                }
            }
        }
    }

    _updateRain(delta) {
        if (!this.isRaining) {
            this.rainGroup.visible = false;
            return;
        }

        this.rainGroup.visible = true;
        if (this.scene.player) {
            const p = this.scene.player.group.position;
            this.rainGroup.position.set(p.x * 0.5, 0, p.z * 0.5);
        }

        const positions = this.points.geometry.attributes.position.array;
        for (let i = 0; i < this.rainVelocities.length; i++) {
            positions[i * 3 + 1] -= this.rainVelocities[i] * delta;
            positions[i * 3] += 6 * delta;

            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 80;
                positions[i * 3] += (Math.random() - 0.5) * 5;
                positions[i * 3 + 2] += (Math.random() - 0.5) * 5;
            }
        }
        this.points.geometry.attributes.position.needsUpdate = true;
    }
}
