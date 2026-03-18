import * as THREE from 'three';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

import { 
    Engine, CameraManager, InputManager, ModularCharacter, 
    PostProcessManager, ParticleManager, UIManager, AudioManager, 
    LevelParser, Enemy, ObjectPool, MemoryCleaner, AnimationManager 
} from 'zortengine';

export class MyGame extends Engine {
    constructor() {
        super(document.body);

        this.environmentMeshes = []; // Kamera duvar çarpışması ve Raycast için ortam listesi

        // 1. Kamera
        this.cameraManager = new CameraManager(this.scene);
        this.cameraManager.setPreset('tps'); // TPS (Omuz üstü) açısı Kamera Oklüzyonunu daha iyi gösterir
        this.setCamera(this.cameraManager);

        this.postProcessor = new PostProcessManager(this.renderer, this.scene, this.cameraManager.getThreeCamera());
        this.postProcessor.setBloomOptions(1.2, 0.5, 0.85);
        this.particleManager = new ParticleManager(this.scene);

        // UI
        this.ui = new UIManager();
        this.ui.addProgressBar('hp', 'calc(50% - 100px)', 20, 200, 25, '#e74c3c');
        this.ui.updateText('score', 'HAVUZ: 20/20'); 
        this.ui.addText('info', 'Gerçek TPS: Ekrana tıkla (Mouse kilitlenir). Fareyle etrafa bak!', 20, 60, { color: '#bdc3c7', size: 16 });
        this.ui.addCrosshair('crosshair'); // Nişangah ID ile eklendi
        
        this.currentHp = 100;
        this.events.on('hp_changed', (newHp) => {
            this.ui.updateProgressBar('hp', newHp);
        });

        this.audioManager = new AudioManager(this.cameraManager);

        // 2. Input
        this.input = new InputManager();
        this.input.isFpsMode = true; 
        this.input.onAttack = () => this.shoot(); 

        // -- 'V' Tuşu ile Top-Down Görünümüne Geçiş --
        this.isTopDown = false;
        this.input.onViewToggle = () => {
            this.isTopDown = !this.isTopDown;
            if (this.isTopDown) {
                this.cameraManager.setPreset('top-down');
                document.exitPointerLock(); // Kuşbakışında fare kilidini aç
                this.ui.updateText('info', 'Top-Down Modu: Fareyle tıklayarak ateş et. V ile TPS\'ye dön.');
                if(this.ui.elements['crosshair']) this.ui.elements['crosshair'].style.display = 'none';
            } else {
                this.cameraManager.setPreset('tps');
                this.ui.updateText('info', 'TPS Modu: Ekrana tıklayarak fareyi kilitle.');
                if(this.ui.elements['crosshair']) this.ui.elements['crosshair'].style.display = 'block';
            }
        };

        // Kamera Yönlendirme (Yaw / Pitch) Açıları
        this.yaw = 0;   
        this.pitch = 0; 

        // 3. Işıklar
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // 4. Zemin
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
        this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
        this.groundMesh.receiveShadow = true;
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.scene.add(this.groundMesh);
        this.physics.createGround();
        this.environmentMeshes.push(this.groundMesh);

        // -- YENİ: Karmaşık Geometri (Eğimli Rampa) Trimesh Testi --
        const rampGeo = new THREE.BoxGeometry(6, 1, 10);
        const rampMat = new THREE.MeshStandardMaterial({ color: 0xe67e22 });
        this.rampMesh = new THREE.Mesh(rampGeo, rampMat);
        this.rampMesh.position.set(-8, 1, 5);
        this.rampMesh.rotation.z = -Math.PI / 8; // Hafif eğimli rampa
        this.rampMesh.castShadow = true;
        this.rampMesh.receiveShadow = true;
        this.scene.add(this.rampMesh);
        this.environmentMeshes.push(this.rampMesh);
        // Rampanın tam geometrisini Trimesh ile fiziğe ekle
        const rampBody = this.physics.createTrimesh(rampGeo, 0, this.rampMesh.position, this.rampMesh.quaternion);
        this.physics.addBody(rampBody, this.rampMesh); // mesh senkronu için

        // 5. Gökten düşen kutu
        const boxGeo = new THREE.BoxGeometry(2, 2, 2);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x3498db, emissive: 0x3498db, emissiveIntensity: 2.0 });
        this.physicsBoxMesh = new THREE.Mesh(boxGeo, boxMat);
        this.physicsBoxMesh.castShadow = true;
        this.scene.add(this.physicsBoxMesh);
        const boxBody = this.physics.createBox(2, 2, 2, 5, {x: 3, y: 20, z: -3});
        this.physics.addBody(boxBody, this.physicsBoxMesh);
        this.environmentMeshes.push(this.physicsBoxMesh); // Kamerayı bu kutu da engellesin

        // 6. FİZİKSEL OYUNCU (Kinematic Controller)
        this.player = new ModularCharacter(this.scene, 0, 0, { colorSuit: 0xe74c3c, speed: 8 });
        this.add(this.player);
        // -- YENİ: Oyuncunun artık bir kütlesi ve bedeni (Kapsül/Küre) var.
        this.playerBody = this.physics.createCharacterBody(0.6, {x: 0, y: 5, z: 0});
        this.physics.addBody(this.playerBody, this.player.group);

        // DÜŞMAN
        this.enemy = new Enemy(this.scene, 5, 0, this.player);
        this.enemy.hp = 100;
        this.add(this.enemy); 

        // MERMİ HAVUZU
        this.bullets = [];
        this.bulletPool = new ObjectPool(() => {
            const mat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
            return new THREE.Mesh(new THREE.SphereGeometry(0.2), mat);
        }, 20); 

        this.start();
    }

    shoot() {
        // TPS modundaysak farenin kilitli olmasını bekle (değilse atış yapma)
        if (!this.isTopDown && document.pointerLockElement !== document.body) return;

        const bullet = this.bulletPool.get();
        bullet.position.copy(this.player.group.position);
        bullet.position.y += 1.2; 
        
        let dir = new THREE.Vector3();
        const cam = this.cameraManager.getThreeCamera();

        if (this.isTopDown) {
            // Top-Down: Fare imlecinin dünyada düştüğü yere doğru lazer at
            const intersects = this.input.getRaycastIntersection(cam, this.environmentMeshes);
            if (intersects.length > 0) {
                const targetPoint = intersects[0].point;
                // Yere doğru saplanmaması için Y eksenini mermi hizasında tut
                dir.subVectors(new THREE.Vector3(targetPoint.x, bullet.position.y, targetPoint.z), bullet.position).normalize();
            } else {
                dir.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.group.rotation.y);
            }
        } else {
            // TPS: Mermiler kameranın tam baktığı yöne (Nişangaha doğru) JİLET GİBİ DÜZ gider
            cam.getWorldDirection(dir);
        }
        
        // Karakter ateş ettiği yöne (Merminin gidiş yönüne) yatay olarak dönsün
        this.player.group.rotation.y = Math.atan2(dir.x, dir.z);
        
        bullet.userData = { velocity: dir.multiplyScalar(50), life: 2.0 };
        this.scene.add(bullet);
        this.bullets.push(bullet);

        this.particleManager.emit(bullet.position, 5, { color: 0xf1c40f, speed: 5, life: 0.2, scale: 0.5 });
        this.ui.updateText('score', `HAVUZ: ${this.bulletPool.getFreeCount()}/20`);
    }

    update(delta, time) {
        // --- FARE İLE ETRAFA BAKMA (MOUSE LOOK) SADECE TPS İÇİN ---
        if (document.pointerLockElement === document.body && !this.isTopDown) {
            const mouseDelta = this.input.getMouseDelta();
            this.yaw -= mouseDelta.x * 0.002; // Sağa sola hız ayarlandı
            this.pitch += mouseDelta.y * 0.002; // YUKARI/AŞAĞI TERSİNE ÇEVRİLDİ (Doğru hissiyat için + yapıldı)
            this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));
        }

        const move = this.input.getMovementVector();

        // KUSURSUZ KAMERAYA GÖRE HAREKET (RELATIVE MOVEMENT)
        const cam = this.cameraManager.getThreeCamera();
        const camForward = new THREE.Vector3();
        cam.getWorldDirection(camForward); 
        camForward.y = 0; 
        camForward.normalize();

        const camRight = new THREE.Vector3();
        // -- YENİ: A ve D tuşlarının TERS ÇALIŞMASINI ÖNLEYEN DÜZELTME --
        // Sıralama değişti: (Forward x Up) = Right
        camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

        const moveDir = new THREE.Vector3();
        // W tuşu (İleri = move.z: -1), S tuşu (Geri = move.z: +1)
        if (move.z !== 0) moveDir.addScaledVector(camForward, -move.z);
        
        // A tuşu (Sol = move.x: -1), D tuşu (Sağ = move.x: +1)
        if (move.x !== 0) moveDir.addScaledVector(camRight, move.x);

        if (moveDir.lengthSq() > 0) moveDir.normalize();

        // Fiziğe hızı uygula 
        const currentSpeed = 12;
        this.playerBody.velocity.x = moveDir.x * currentSpeed;
        this.playerBody.velocity.z = moveDir.z * currentSpeed;

        if (move.x !== 0 || move.z !== 0) {
            // Yürürken karakter hareket ettiği yöne yumuşak değil DİREKT baksın
            this.player.group.rotation.y = Math.atan2(moveDir.x, moveDir.z); 
            this.player.fsm.setState('walk');

            if (Math.random() > 0.7) {
                this.particleManager.emit(
                    new THREE.Vector3(this.player.group.position.x, 0.1, this.player.group.position.z),
                    1, { color: 0x7f8c8d, speed: 2, scale: 0.3, life: 0.5 }
                );
            }
        } else {
            this.player.fsm.setState('idle');
        }

        if (this.particleManager) this.particleManager.update(delta);

        // MERMİLER
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.position.addScaledVector(b.userData.velocity, delta);
            b.userData.life -= delta;

            if (!this.enemy.isDestroyed && b.position.distanceTo(this.enemy.group.position) < 1.5) {
                this.particleManager.emit(this.enemy.group.position, 10, { color: 0x8e44ad, speed: 5 });
                b.userData.life = 0; 
                this.enemy.group.position.addScaledVector(b.userData.velocity.clone().normalize(), 0.5);
                this.enemy.hp -= 25;

                if (this.enemy.hp <= 0) {
                    this.enemy.isDestroyed = true;
                    MemoryCleaner.dispose(this.enemy.group);
                    this.remove(this.enemy); 
                }
            }

            if (b.userData.life <= 0) {
                this.scene.remove(b);
                this.bullets.splice(i, 1);
                this.bulletPool.release(b); 
            }
        }

        // DÜŞMAN SALDIRISI
        if (!this.enemy.isDestroyed && this.enemy.fsm.getCurrentState() === 'attack') {
            this.currentHp -= 20 * delta;
            if (this.currentHp < 0) this.currentHp = 100;
            this.events.emit('hp_changed', this.currentHp);
            
            if (Math.random() > 0.8) {
                this.particleManager.emit(this.player.group.position, 1, { color: 0x900000, speed: 3, scale: 0.4, life: 0.4 });
            }
        }

        // -- KAMERAYI YAW VE PITCH AÇILARI İLE GÜNCELLE --
        this.cameraManager.updateFollow(this.player.group.position, this.yaw, delta, { pitch: this.pitch }, this.environmentMeshes);
    }
}