import * as THREE from 'three';

export class CameraManager {
    constructor(scene, aspect = window.innerWidth / window.innerHeight) {
        this.scene = scene;
        
        // Orthographic (Top-down / Iso)
        const d = 15;
        this.orthoCam = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.orthoCam.position.set(20, 20, 20);
        if (this.scene) this.orthoCam.lookAt(this.scene.position);
        
        // Perspective (FPS / TPS)
        this.perspCam = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        this.currentType = 'ortho'; // 'ortho' or 'persp'
        this.activeCamera = this.orthoCam;
        this.presetOptions = { orthoOffset: new THREE.Vector3(20, 25, 20) };
    }

    getThreeCamera() {
        return this.activeCamera;
    }

    setMode(mode) {
        if (mode === 'ortho' || mode === 'isometric') {
            this.activeCamera = this.orthoCam;
            this.currentType = 'ortho';
        } else if (mode === 'persp' || mode === 'fps' || mode === 'tps') {
            this.activeCamera = this.perspCam;
            this.currentType = 'persp';
        }
    }

    setPreset(presetName) {
        if (presetName === 'isometric') {
            this.setMode('ortho');
            this.presetOptions = { orthoOffset: new THREE.Vector3(20, 25, 20) };
        } else if (presetName === 'top-down') {
            this.setMode('ortho');
            // Offset for pure top-down look
            this.presetOptions = { orthoOffset: new THREE.Vector3(0, 30, 0) };
        } else if (presetName === 'fps') {
            this.setMode('persp');
            // Right in the face, no back offset
            this.presetOptions = { rightOffset: 0, backOffset: 0, heightOffset: 1.6 };
        } else if (presetName === 'tps' || presetName === 'over-shoulder') {
            this.setMode('persp');
            // Typical over the shoulder view
            this.presetOptions = { rightOffset: 0.8, backOffset: 4.0, heightOffset: 1.5 };
        }
    }

    onResize(aspect) {
        const d = 15;
        this.orthoCam.left = -d * aspect;
        this.orthoCam.right = d * aspect;
        this.orthoCam.top = d;
        this.orthoCam.bottom = -d;
        this.orthoCam.updateProjectionMatrix();

        this.perspCam.aspect = aspect;
        this.perspCam.updateProjectionMatrix();
    }

    updateFollow(targetPos, targetRotY = 0, delta = 0.016, customOptions = {}) {
        const options = { ...this.presetOptions, ...customOptions };

        if (this.currentType === 'ortho') {
            const offset = options.orthoOffset || new THREE.Vector3(20, 25, 20);
            this.activeCamera.position.lerp(targetPos.clone().add(offset), 5 * delta);
            this.activeCamera.lookAt(targetPos);
        } else if (this.currentType === 'persp') {
            const pitch = options.pitch || 0;
            const target = targetPos.clone();
            target.y += (options.heightOffset || 1.5);

            const dir = new THREE.Vector3(0, 0, 1);
            dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
            dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotY);

            const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotY);
            
            const rightOffset = options.rightOffset !== undefined ? options.rightOffset : 0.8;
            const backOffset = options.backOffset !== undefined ? options.backOffset : 4.0;

            this.activeCamera.position.copy(target);
            this.activeCamera.position.add(right.multiplyScalar(rightOffset));
            this.activeCamera.position.sub(dir.clone().multiplyScalar(backOffset));
            
            this.activeCamera.position.y = Math.max(0.5, this.activeCamera.position.y);
            this.activeCamera.lookAt(this.activeCamera.position.clone().add(dir));
        }
    }
}
