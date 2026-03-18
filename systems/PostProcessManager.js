import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class PostProcessManager {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer);
        
        // Temel render katmanı
        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);
        
        // Parlama (Bloom) katmanı
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight), 
            1.5, // Güç (Strength)
            0.4, // Yarıçap (Radius)
            0.85 // Eşik (Threshold) - Hangi parlaklıktaki objeler parlasın
        );
        this.composer.addPass(this.bloomPass);
    }

    setCamera(camera) {
        this.renderPass.camera = camera;
    }

    setBloomOptions(strength, radius, threshold) {
        if (strength !== undefined) this.bloomPass.strength = strength;
        if (radius !== undefined) this.bloomPass.radius = radius;
        if (threshold !== undefined) this.bloomPass.threshold = threshold;
    }

    render() {
        this.composer.render();
    }

    onResize(width, height) {
        this.composer.setSize(width, height);
    }
}