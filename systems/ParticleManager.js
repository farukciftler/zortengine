import * as THREE from 'three';
import { ObjectPool } from '../utils/ObjectPool.js';

export class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        
        this.baseGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        
        // YENİ: Performans için Parçacık Havuzu (Object Pool)
        // Her seferinde yeni Mesh yaratmak RAM'i şişirir, bu yüzden 100 parçacıklı bir havuz kuruyoruz.
        this.pool = new ObjectPool(() => {
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            return new THREE.Mesh(this.baseGeometry, mat);
        }, 100);
    }

    emit(position, count = 10, options = {}) {
        const color = options.color || 0xcccccc;
        const speed = options.speed || 5;
        const life = options.life || 1.0;
        const scale = options.scale || 1.0;

        for (let i = 0; i < count; i++) {
            // new THREE.Mesh yerine havuzdan çekiyoruz
            const p = this.pool.get();
            p.material.color.setHex(color);
            p.position.copy(position);
            
            p.position.x += (Math.random() - 0.5) * 0.5;
            p.position.y += (Math.random() - 0.5) * 0.5;
            p.position.z += (Math.random() - 0.5) * 0.5;
            
            p.scale.setScalar(scale);

            p.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * speed, 
                    Math.random() * speed, 
                    (Math.random() - 0.5) * speed
                ),
                life: life,
                maxLife: life
            };
            
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.position.addScaledVector(p.userData.velocity, delta);
            p.userData.velocity.y -= 9.8 * delta;
            
            p.userData.life -= delta;
            const ratio = Math.max(0, p.userData.life / p.userData.maxLife);
            p.scale.setScalar(ratio);

            // Ömrü bitince objeyi çöpe atmak yerine havuza geri koy!
            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
                this.pool.release(p); 
            }
        }
    }
}