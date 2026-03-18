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
import { ObjectPool } from '../../utils/ObjectPool.js';

// YENİ ARAÇLAR
import { MemoryCleaner } from '../../utils/MemoryCleaner.js';
import { AnimationManager } from '../../utils/AnimationManager.js';

export class MyGame extends Engine {
    constructor() {
        super(document.body);

        // 1. Kamera Kurulumu
        this.cameraManager = new CameraManager(this.scene);
        this.cameraManager.setPreset('isometric');
        this.setCamera(this.cameraManager);

        // POST-PROCESSING & PARTICLES
        this.postProcessor = new PostProcessManager(this.renderer, this.scene, this.cameraManager.getThreeCamera());
        this.postProcessor.setBloomOptions(1.2, 0.5, 0.85);
        this.particleManager = new ParticleManager(this.scene);

        // UI MANAGER
        this.ui = new UIManager();
        this.ui.addText('score', 'SCORE: 0', 20, 20, { color: '#f1c40f', size: 30 });
        this.ui.addProgressBar('hp', 'calc(50% - 100px)', 20, 200, 25, '#e74c3c');
        this.ui.updateText('score', 'HAVUZ: 20/20'); 
        this.ui.addText('info', 'Aşama 5: Fare ile TIKLA ve oraya ateş et!', 20, 60, { color: '#bdc3c7', size: 16 });
        
        // --- YENİ: EVENT BUS KULLANIMI ---
        this.currentHp = 100;
        this.events.on('hp_changed', (newHp) => {
            this.ui.updateProgressBar('hp', newHp);
        });

        // AUDIO MANAGER
        this.audioManager = new AudioManager(this.cameraManager);

        // 2. Input
        this.input = new InputManager();
        this.input.onAttack = () => this.shoot(); 

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
        this.groundMesh = new THREE.Mesh(groundGeo, groundMat); // Raycaster için sınıf değişkenine atadık
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);
        
        this.physics.createGround();
        this.groundMesh.rotation.x = -Math.PI / 2;

        // LEVEL PARSER SİMÜLASYONU
        this.levelParser = new LevelParser(this.physics, this.scene);
        const mockGltfScene = new THREE.Group();
        const parsedData = this.levelParser.parse(mockGltfScene);

        // 5. Karakter Ekleme
        this.player = new ModularCharacter(this.scene, 0, 0, { colorSuit: 0xe74c3c, speed: 8 });
        this.add(this.player);

        // DÜŞMAN EKLEME (AI)
        const enemySpawnPos = parsedData.spawnPoints['Enemy'] ? parsedData.spawnPoints['Enemy'][0] : new THREE.Vector3(-5, 0, -5);
        this.enemy = new Enemy(this.scene, enemySpawnPos.x, enemySpawnPos.z, this.player);
        this.enemy.hp = 100; // Düşman canı
        this.add(this.enemy); 

        // MERMİ HAVUZU
        this.bullets = [];
        this.bulletPool = new ObjectPool(() => {
            const mat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), mat);
            return mesh;
        }, 20); 

        this.start();
    }

    shoot() {
        const bullet = this.bulletPool.get();
        bullet.position.copy(this.player.group.position);
        bullet.position.y += 1; 
        
        // --- YENİ: RAYCASTER (FARENİN TIKLADIĞI YERE ATEŞ ET) ---
        // Lazerin kameradan çıkıp zemine (groundMesh) çarpıp çarpmadığına bakıyoruz
        const intersects = this.input.getRaycastIntersection(this.cameraManager.getThreeCamera(), [this.groundMesh]);
        let dir = new THREE.Vector3();

        if (intersects.length > 0) {
            // Farenin 3 boyutlu dünyadaki hedef noktası
            const targetPoint = intersects[0].point;
            // Karakteri oraya doğru döndür
            this.player.group.lookAt(new THREE.Vector3(targetPoint.x, this.player.group.position.y, targetPoint.z));
            
            // Merminin fırlama vektörünü (yönünü) hesapla
            dir.subVectors(targetPoint, bullet.position).normalize();
        } else {
            // Ekranda boşa tıklanırsa düz gitsin
            dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.group.rotation.y);
        }
        
        bullet.userData = { 
            velocity: dir.multiplyScalar(20), 
            life: 2.0 
        };
        
        this.scene.add(bullet);
        this.bullets.push(bullet);

        this.particleManager.emit(bullet.position, 5, { color: 0xf1c40f, speed: 5, life: 0.2, scale: 0.5 });
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
                    1, { color: 0x7f8c8d, speed: 2, scale: 0.3, life: 0.5 }
                );
            }
        } else {
            this.player.fsm.setState('idle');
        }

        if (this.particleManager) this.particleManager.update(delta);

        // MERMİLER VE ÇARPIŞMALAR
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            
            b.position.addScaledVector(b.userData.velocity, delta);
            b.userData.life -= delta;

            // Düşmana çarptı mı?
            if (!this.enemy.isDestroyed && b.position.distanceTo(this.enemy.group.position) < 1.5) {
                this.particleManager.emit(this.enemy.group.position, 10, { color: 0x8e44ad, speed: 5 });
                b.userData.life = 0; 
                
                this.enemy.group.position.addScaledVector(b.userData.velocity.clone().normalize(), 0.5);
                this.enemy.hp -= 25;

                // --- YENİ: MEMORY CLEANER (Düşman ölünce GPU'yu temizle) ---
                if (this.enemy.hp <= 0) {
                    this.enemy.isDestroyed = true;
                    // Objeyi sahneden sil, RAM ve GPU (ekran kartı) tarafında Geometry/Material'i yok et
                    MemoryCleaner.dispose(this.enemy.group);
                    this.remove(this.enemy); // Engine döngüsünden sil
                    this.ui.updateText('info', 'Düşman yok edildi! GPU belleği temizlendi.');
                }
            }

            if (b.userData.life <= 0) {
                this.scene.remove(b);
                this.bullets.splice(i, 1);
                this.bulletPool.release(b); 
                this.ui.updateText('score', `HAVUZ: ${this.bulletPool.getFreeCount()}/20`);
            }
        }

        // DÜŞMAN SALDIRI KONTROLÜ
        if (!this.enemy.isDestroyed && this.enemy.fsm.getCurrentState() === 'attack') {
            this.currentHp -= 20 * delta;
            if (this.currentHp < 0) this.currentHp = 100;
            
            // YENİ: UI'ı manuel güncellemek yerine Olay Yöneticisi'ne yayın yapıyoruz!
            this.events.emit('hp_changed', this.currentHp);
            
            if (Math.random() > 0.8) {
                this.particleManager.emit(this.player.group.position, 1, { color: 0x900000, speed: 3, scale: 0.4, life: 0.4 });
            }
        }

        this.cameraManager.updateFollow(this.player.group.position, 0, delta);
    }
}