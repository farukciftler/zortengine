import * as THREE from 'three';
import { Engine } from '../../core/Engine.js';
import { CameraManager } from '../../systems/CameraManager.js';
import { InputManager } from '../../systems/InputManager.js';
import { ModularCharacter } from '../../objects/ModularCharacter.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

import { PostProcessManager } from '../../systems/PostProcessManager.js';
import { ParticleManager } from '../../systems/ParticleManager.js';
import { UIManager } from '../../systems/UIManager.js';

import { AudioManager } from '../../systems/AudioManager.js';
import { LevelParser } from '../../utils/LevelParser.js';
import { Enemy } from '../../objects/Enemy.js';

// YENİ EKLENEN SİSTEM (AŞAMA 4 - Performans)
import { ObjectPool } from '../../utils/ObjectPool.js';

export class MyGame extends Engine {
    constructor() {
        super(document.body);

        // 1. Kamera Kurulumu
        this.cameraManager = new CameraManager(this.scene);
        this.cameraManager.setPreset('isometric');
        this.setCamera(this.cameraManager);

        // POST-PROCESSING (BLOOM)
        this.postProcessor = new PostProcessManager(this.renderer, this.scene, this.cameraManager.getThreeCamera());
        this.postProcessor.setBloomOptions(1.2, 0.5, 0.85);

        // PARTICLE MANAGER (Artık ObjectPool kullanıyor)
        this.particleManager = new ParticleManager(this.scene);

        // UI MANAGER
        this.ui = new UIManager();
        this.ui.addText('score', 'SCORE: 0', 20, 20, { color: '#f1c40f', size: 30 });
        this.ui.addProgressBar('hp', 'calc(50% - 100px)', 20, 200, 25, '#e74c3c');
        this.ui.updateText('score', 'HAVUZ: 20/20'); // Boş mermi sayısını göstermek için
        this.ui.addText('info', 'Aşama 4: Boşluk (Space) tuşuna basarak ateş et!', 20, 60, { color: '#bdc3c7', size: 16 });
        this.currentHp = 100;

        // AUDIO MANAGER
        this.audioManager = new AudioManager(this.cameraManager);

        // 2. Input
        this.input = new InputManager();
        
        // -- YENİ: ATEŞ ETME TETİĞİ --
        this.input.onAttack = () => this.shoot(); // Boşluk tuşu veya ekrana tıklama

        // 3. Aydınlatma
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // 4. Zemin
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);
        
        this.physics.createGround();
        groundMesh.rotation.x = -Math.PI / 2;

        // LEVEL PARSER SİMÜLASYONU
        this.levelParser = new LevelParser(this.physics, this.scene);
        const mockGltfScene = new THREE.Group();
        
        const invisibleWall = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4));
        invisibleWall.position.set(8, 1, 8);
        invisibleWall.name = "BrickWall_Collider";
        mockGltfScene.add(invisibleWall);

        const spawnPoint = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
        spawnPoint.position.set(-8, 0, -8);
        spawnPoint.name = "Spawn_Enemy";
        mockGltfScene.add(spawnPoint);

        const parsedData = this.levelParser.parse(mockGltfScene);

        // 5. Gökten düşen parlayan (Bloom) kutu
        const boxGeo = new THREE.BoxGeometry(2, 2, 2);
        const boxMat = new THREE.MeshStandardMaterial({ 
            color: 0x3498db, 
            emissive: 0x3498db,
            emissiveIntensity: 2.0 
        });
        this.physicsBoxMesh = new THREE.Mesh(boxGeo, boxMat);
        this.physicsBoxMesh.castShadow = true;
        this.scene.add(this.physicsBoxMesh);
        
        const boxBody = this.physics.createBox(2, 2, 2, 5, {x: 3, y: 20, z: -3});
        this.physics.addBody(boxBody, this.physicsBoxMesh);

        // 6. Karakter Ekleme
        this.player = new ModularCharacter(this.scene, 0, 0, { colorSuit: 0xe74c3c, speed: 8 });
        this.add(this.player);

        // DÜŞMAN EKLEME (AI)
        const enemySpawnPos = parsedData.spawnPoints['Enemy'] ? parsedData.spawnPoints['Enemy'][0] : new THREE.Vector3(-10, 0, -10);
        this.enemy = new Enemy(this.scene, enemySpawnPos.x, enemySpawnPos.z, this.player);
        this.add(this.enemy); 

        // -- YENİ: MERMİ HAVUZU --
        this.bullets = [];
        this.bulletPool = new ObjectPool(() => {
            const mat = new THREE.MeshBasicMaterial({ color: 0xf1c40f }); // Sarı parlak mermi
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), mat);
            return mesh;
        }, 20); // 20 mermilik havuz (Sürekli dönüştürülecek)

        this.start();
    }

    shoot() {
        const bullet = this.bulletPool.get(); // Mermiyi havuzdan al
        bullet.position.copy(this.player.group.position);
        bullet.position.y += 1; // Göğüs hizasından ateşle
        
        // Karakterin baktığı yönü bul
        const dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.group.rotation.y);
        
        bullet.userData = { 
            velocity: dir.multiplyScalar(20), // Hız: Saniyede 20 birim
            life: 2.0 // 2 saniye sonra yok olur (havuza döner)
        };
        
        this.scene.add(bullet);
        this.bullets.push(bullet);

        // Namlu ucu alevi (Mermi ateşlenince çıkan tozlar)
        this.particleManager.emit(bullet.position, 5, { color: 0xf1c40f, speed: 5, life: 0.2, scale: 0.5 });
        
        // UI Güncelle (Havuzdaki boş mermi sayısı)
        this.ui.updateText('score', `HAVUZ: ${this.bulletPool.getFreeCount()}/20`);
    }

    update(delta, time) {
        const move = this.input.getMovementVector();

        if (move.x !== 0 || move.z !== 0) {
            this.player.group.position.x += move.x * this.player.speed * delta;
            this.player.group.position.z += move.z * this.player.speed * delta;

            const angle = Math.atan2(move.x, move.z);
            this.player.group.rotation.y = angle;

            this.player.fsm.setState('walk');

            if (Math.random() > 0.7) {
                this.particleManager.emit(
                    new THREE.Vector3(this.player.group.position.x, 0.1, this.player.group.position.z),
                    1, 
                    { color: 0x7f8c8d, speed: 2, scale: 0.3, life: 0.5 }
                );
            }
        } else {
            this.player.fsm.setState('idle');
        }

        if (this.particleManager) {
            this.particleManager.update(delta);
        }

        // -- YENİ: MERMİLERİ HAREKET ETTİR VE ÇARPIŞMAYI KONTROL ET --
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            
            // Mermiyi ileri it
            b.position.addScaledVector(b.userData.velocity, delta);
            b.userData.life -= delta;

            // Düşmana çarptı mı? (Basit mesafe kontrolü)
            if (b.position.distanceTo(this.enemy.group.position) < 1.5) {
                // Çarpma efekti (Mor/Kırmızı parçacıklar)
                this.particleManager.emit(this.enemy.group.position, 10, { color: 0x8e44ad, speed: 5 });
                b.userData.life = 0; // Mermiyi hemen yok et (havuza döndür)
                
                // Düşmanı geriye doğru it (Knockback)
                this.enemy.group.position.addScaledVector(b.userData.velocity.clone().normalize(), 0.5);
            }

            // Ömrü bittiyse (veya çarptıysa) sahneden silip havuza atıyoruz
            if (b.userData.life <= 0) {
                this.scene.remove(b);
                this.bullets.splice(i, 1);
                this.bulletPool.release(b); // RAM'e geri yük bindirmiyoruz
                this.ui.updateText('score', `HAVUZ: ${this.bulletPool.getFreeCount()}/20`);
            }
        }

        // DÜŞMAN SALDIRI KONTROLÜ
        if (this.enemy.fsm.getCurrentState() === 'attack') {
            this.currentHp -= 20 * delta;
            if (this.currentHp < 0) this.currentHp = 100;
            this.ui.updateProgressBar('hp', this.currentHp);
            
            if (Math.random() > 0.8) {
                this.particleManager.emit(this.player.group.position, 1, { color: 0x900000, speed: 3, scale: 0.4, life: 0.4 });
            }
        }

        this.cameraManager.updateFollow(this.player.group.position, 0, delta);
    }
}