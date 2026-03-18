import * as THREE from 'three';

export class CameraManager {
    constructor(scene, aspect = window.innerWidth / window.innerHeight) {
        this.scene = scene;
        
        const d = 15;
        this.orthoCam = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.orthoCam.position.set(20, 20, 20);
        if (this.scene) this.orthoCam.lookAt(this.scene.position);
        
        this.perspCam = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        this.currentType = 'ortho'; 
        this.activeCamera = this.orthoCam;
        this.presetOptions = { orthoOffset: new THREE.Vector3(20, 25, 20) };
        
        // YENİ: Kamera duvar çarpışması için Raycaster
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
        if (presetName === 'isometric') {
            this.setMode('ortho');
            this.presetOptions = { orthoOffset: new THREE.Vector3(20, 25, 20) };
        } else if (presetName === 'top-down') {
            this.setMode('ortho');
            this.presetOptions = { orthoOffset: new THREE.Vector3(0, 30, 0) };
        } else if (presetName === 'fps') {
            this.setMode('persp');
            this.presetOptions = { rightOffset: 0, backOffset: 0, heightOffset: 1.6 };
        } else if (presetName === 'tps' || presetName === 'over-shoulder') {
            this.setMode('persp');
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

    // YENİ: obstacles parametresi eklendi (Çarpışma duvarları listesi)
    updateFollow(targetPos, targetRotY = 0, delta = 0.016, customOptions = {}, obstacles = []) {
        const options = { ...this.presetOptions, ...customOptions };
        let lookTarget = targetPos.clone();

        if (this.currentType === 'ortho') {
            const offset = options.orthoOffset || new THREE.Vector3(0, 30, 10);
            const desiredPos = targetPos.clone().add(offset);
            // Kuş bakışı kamerada yumuşak takip (lerp) kalabilir
            this.activeCamera.position.lerp(desiredPos, 5 * delta);
            this.activeCamera.lookAt(targetPos);
        } else if (this.currentType === 'persp') {
            // Karakterin baş hizasına odaklan (GTA Tarzı)
            lookTarget.y += (options.heightOffset || 1.5);
            
            const distance = options.backOffset !== undefined ? options.backOffset : 4.0;
            const pitch = customOptions.pitch || 0;
            const yaw = targetRotY;

            // KÜRESEL KOORDİNATLAR (Spherical Coordinates) ile Kusursuz Yörünge (Orbit)
            const offset = new THREE.Vector3(
                distance * Math.sin(yaw) * Math.cos(pitch),
                distance * Math.sin(pitch),
                distance * Math.cos(yaw) * Math.cos(pitch)
            );

            let desiredPos = lookTarget.clone().add(offset);

            // SPRING ARM (Kamera Duvar Çarpışması)
            if (obstacles.length > 0) {
                const dirFromTargetToCam = new THREE.Vector3().subVectors(desiredPos, lookTarget);
                const dist = dirFromTargetToCam.length();
                dirFromTargetToCam.normalize();
                
                // Lazer atışı baş hizasından kameraya doğru gidiyor
                this.raycaster.set(lookTarget, dirFromTargetToCam);
                this.raycaster.far = dist; 
                const hits = this.raycaster.intersectObjects(obstacles, true);
                
                if (hits.length > 0) {
                    // Kamera bir şeye çarptı! Çarptığı noktanın 0.2 birim önüne al ki duvarın içine girmesin
                    desiredPos.copy(lookTarget).add(dirFromTargetToCam.multiplyScalar(Math.max(0.2, hits[0].distance - 0.2)));
                }
            }

            // Fare (Mouse Look) akıcılığı için TPS kamerasında 'lerp' KULLANMIYORUZ! Direkt kopyalıyoruz.
            // Bu sayede fare çevrildiğinde kamera sakız gibi sallanmaz, titremez (Kafayı yemez).
            this.activeCamera.position.copy(desiredPos);
            this.activeCamera.lookAt(lookTarget);
        }
    }
}
