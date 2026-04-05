import { System } from 'zortengine';
import * as THREE from 'three';

export class BalanceSystem extends System {
    constructor() {
        super();
        this.torque = 0;
        this.angularVelocity = 0;
        this.tilt = 0;
        this.damping = 0.95;
        this.sensitivity = 0.01;
        this.criticalAngle = Math.PI / 4; // 45 degrees
    }

    onAttach(context) {
        this.scene = context.scene;
    }

    update(delta, time) {
        const scene = this.scene;
        if (!scene.platform) return;

        let totalTorque = 0;
        const platformWidth = 10;
        
        // Calculate torque from all objects on the platform
        scene.objects.forEach(obj => {
            if (obj === scene.platform) return;
            
            // Get world position for torque calculation
            const pos = obj.group.position;
            
            // Torque = mass * distance
            const mass = obj.mass || 1;
            totalTorque += mass * pos.x;
        });

        // Update angular physics
        this.angularVelocity += totalTorque * this.sensitivity * delta;
        this.angularVelocity *= this.damping;
        this.tilt += this.angularVelocity * delta;

        // Apply tilt to platform
        scene.platform.group.rotation.z = -this.tilt;

        // Apply sliding force to objects on the platform
        const slideThreshold = 0.15; // ~8.5 degrees
        if (Math.abs(this.tilt) > slideThreshold) {
            const slideForce = (this.tilt / this.criticalAngle) * 5 * delta;
            scene.objects.forEach(obj => {
                if (obj === scene.platform) return;
                
                if (obj.body) {
                    obj.body.position.x += slideForce;
                } else {
                    obj.group.position.x += slideForce;
                }
                
                // If it slides off the edge, remove it
                if (Math.abs(obj.group.position.x) > 5.5) {
                    if (obj === scene.player) {
                        this.gameOver();
                    } else {
                        scene.remove(obj);
                    }
                }
            });
        }

        // Visual Feedback (Emissive intensity based on tilt)
        const intensity = Math.abs(this.tilt) / this.criticalAngle;
        scene.platform.group.children[0].material.emissiveIntensity = 0.2 + intensity * 0.8;
        if (intensity > 0.8) {
            scene.platform.group.children[0].material.emissive.setHex(0xff0000);
        } else {
            scene.platform.group.children[0].material.emissive.setHex(0x00f3ff);
        }

        // Check fail condition
        if (Math.abs(this.tilt) > this.criticalAngle) {
            this.gameOver();
        }

        // Simple UI Update (if DOM elements exist)
        const uiTilt = document.getElementById('tilt-fill');
        if (uiTilt) {
            const percentage = 50 + (this.tilt / this.criticalAngle) * 50;
            uiTilt.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
            uiTilt.style.background = intensity > 0.7 ? '#ff0000' : '#00f3ff';
        }
    }

    gameOver() {
        console.log("GAME OVER");
        // Simple restart: reset all blocks and player
        this.tilt = 0;
        this.angularVelocity = 0;
        this.scene.objects.forEach(obj => {
            if (obj.isBlock) {
                this.scene.remove(obj);
            }
        });
        if (this.scene.player) {
            this.scene.player.group.position.set(0, 0.25, 0);
        }
        
        const balanceEl = document.getElementById('balance-val');
        if (balanceEl) {
            balanceEl.innerText = "RESTARTING...";
            setTimeout(() => { balanceEl.innerText = "PERFECT"; }, 2000);
        }
    }
}
