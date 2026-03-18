import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class PostProcessManager {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer);

        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);

        const width = typeof window !== 'undefined' ? window.innerWidth : 1;
        const height = typeof window !== 'undefined' ? window.innerHeight : 1;
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            1.5,
            0.4,
            0.85
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
