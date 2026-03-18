import * as THREE from 'three';
import { PhysicsManager } from '../systems/PhysicsManager.js';

export class Engine {
    constructor(container, options = {}) {
        this.isHeadless = options.headless || false;
        this.clock = new THREE.Clock();
        this.objects = [];
        
        // Initialize Physics Manager
        this.physics = new PhysicsManager();

        if (!this.isHeadless) {
            this.container = container || document.body;
            this.scene = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.container.appendChild(this.renderer.domElement);
            this.camera = null;
            window.addEventListener('resize', () => this.onWindowResize());
        } else {
            // Sunucu (Node.js) tarafında çalışması için sahte sahne (Mock Scene)
            this.scene = { add: () => {}, remove: () => {} }; 
        }
    }

    setCamera(camera) {
        this.camera = camera;
    }

    add(object) {
        this.objects.push(object);
        if (object.mesh) {
            this.scene.add(object.mesh);
        } else if (object.group) {
            this.scene.add(object.group);
        } else if (object instanceof THREE.Object3D) {
            this.scene.add(object);
        }
    }

    remove(object) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
        if (object.mesh) {
            this.scene.remove(object.mesh);
        } else if (object.group) {
            this.scene.remove(object.group);
        } else if (object instanceof THREE.Object3D) {
            this.scene.remove(object);
        }
    }

    start() {
        this.clock.start();
        this.loop();
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // Update Physics
        if (this.physics) {
            this.physics.update(delta);
        }

        this.update(delta, time);
        
        // Update all objects automatically if they have an update method
        for (let obj of this.objects) {
            if (typeof obj.update === 'function') {
                obj.update(delta, time);
            }
        }

        this.render();
    }

    update(delta, time) {
        // Override in specific game
    }

    render() {
        if (this.isHeadless) return; // Sunucuda render yapılmaz
        
        if (this.camera && this.scene) {
            // If camera is a wrapper, get the internal THREE camera
            const cam = this.camera.getThreeCamera ? this.camera.getThreeCamera() : this.camera;
            
            if (this.postProcessor) {
                this.postProcessor.setCamera(cam);
                this.postProcessor.render();
            } else {
                this.renderer.render(this.scene, cam);
            }
        }
    }

    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.camera && typeof this.camera.onResize === 'function') {
            this.camera.onResize(aspect);
        }
        if (this.postProcessor) {
            this.postProcessor.onResize(window.innerWidth, window.innerHeight);
        }
    }
}
