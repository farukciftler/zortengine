import * as THREE from 'three';

export class CameraManager {
    constructor(scene, aspect = CameraManager.getDefaultAspect()) {
        this.scene = scene;

        const frustumSize = 18;
        this.orthoSize = frustumSize;
        this.orthoCam = new THREE.OrthographicCamera(
            -frustumSize * aspect,
            frustumSize * aspect,
            frustumSize,
            -frustumSize,
            1,
            1000
        );
        this.orthoCam.position.set(18, 18, 18);
        if (this.scene) this.orthoCam.lookAt(this.scene.position);

        this.perspCam = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);

        this.currentType = 'ortho';
        this.activeCamera = this.orthoCam;
        this.presetOptions = {
            orthoOffset: new THREE.Vector3(18, 18, 18),
            lookOffset: new THREE.Vector3(0, 1.5, 0)
        };
        this.raycaster = new THREE.Raycaster();
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
        if (presetName === 'isometric' || presetName === '2.5d') {
            this.setMode('ortho');
            this.presetOptions = {
                orthoOffset: new THREE.Vector3(18, 18, 18),
                lookOffset: new THREE.Vector3(0, 1.5, 0),
                smoothing: 6
            };
        } else if (presetName === 'top-down') {
            this.setMode('ortho');
            this.presetOptions = {
                orthoOffset: new THREE.Vector3(0, 30, 0),
                lookOffset: new THREE.Vector3(0, 0, 0),
                smoothing: 5
            };
        } else if (presetName === 'fps') {
            this.setMode('persp');
            this.presetOptions = { rightOffset: 0, backOffset: 0, heightOffset: 1.6 };
        } else if (presetName === 'tps' || presetName === 'over-shoulder') {
            this.setMode('persp');
            this.presetOptions = { rightOffset: 0, backOffset: 5.5, heightOffset: 1.6 };
        }
    }

    onResize(aspect) {
        const d = this.orthoSize;
        this.orthoCam.left = -d * aspect;
        this.orthoCam.right = d * aspect;
        this.orthoCam.top = d;
        this.orthoCam.bottom = -d;
        this.orthoCam.updateProjectionMatrix();

        this.perspCam.aspect = aspect;
        this.perspCam.updateProjectionMatrix();
    }

    updateFollow(targetPos, targetRotY = 0, delta = 0.016, customOptions = {}, obstacles = []) {
        const options = { ...this.presetOptions, ...customOptions };
        let lookTarget = targetPos.clone().add(options.lookOffset || new THREE.Vector3());

        if (this.currentType === 'ortho') {
            const offset = options.orthoOffset || new THREE.Vector3(18, 18, 18);
            const desiredPos = targetPos.clone().add(offset);
            const smoothing = options.smoothing || 6;
            this.activeCamera.position.lerp(desiredPos, smoothing * delta);
            this.activeCamera.lookAt(lookTarget);
        } else if (this.currentType === 'persp') {
            lookTarget.y += (options.heightOffset || 1.5);

            const distance = options.backOffset !== undefined ? options.backOffset : 4.0;
            const pitch = customOptions.pitch || 0;
            const yaw = targetRotY;
            const rightOffset = options.rightOffset || 0;

            const offset = new THREE.Vector3(
                distance * Math.sin(yaw) * Math.cos(pitch) + rightOffset * Math.cos(yaw),
                distance * Math.sin(pitch),
                distance * Math.cos(yaw) * Math.cos(pitch) - rightOffset * Math.sin(yaw)
            );

            let desiredPos = lookTarget.clone().add(offset);

            if (obstacles.length > 0) {
                const dirFromTargetToCam = new THREE.Vector3().subVectors(desiredPos, lookTarget);
                const dist = dirFromTargetToCam.length();
                dirFromTargetToCam.normalize();

                this.raycaster.set(lookTarget, dirFromTargetToCam);
                this.raycaster.far = dist;
                const hits = this.raycaster.intersectObjects(obstacles, true);

                if (hits.length > 0) {
                    desiredPos.copy(lookTarget).add(dirFromTargetToCam.multiplyScalar(Math.max(0.2, hits[0].distance - 0.2)));
                }
            }

            this.activeCamera.position.copy(desiredPos);
            this.activeCamera.lookAt(lookTarget);
        }
    }

    static getDefaultAspect() {
        if (typeof window !== 'undefined' && window.innerHeight) {
            return window.innerWidth / window.innerHeight;
        }
        return 1;
    }
}
