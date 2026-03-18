import * as THREE from 'three';
import { ObjectPool } from '../../engine/object/ObjectPool.js';

export class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.rng = null;

        this.baseGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        this.pool = new ObjectPool(() => {
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            return new THREE.Mesh(this.baseGeometry, mat);
        }, 100);
    }

    onAttach(context) {
        this.rng = context?.engine?.random || null;
    }

    emit(position, count = 10, options = {}) {
        const color = options.color || 0xcccccc;
        const speed = options.speed || 5;
        const life = options.life || 1.0;
        const scale = options.scale || 1.0;
        const random = () => this.rng ? this.rng.float(-0.5, 0.5) : (Math.random() - 0.5);
        const randomPositive = () => this.rng ? this.rng.float(0, 1) : Math.random();

        for (let i = 0; i < count; i++) {
            const p = this.pool.get();
            p.material.color.setHex(color);
            p.position.copy(position);

            p.position.x += random() * 0.5;
            p.position.y += random() * 0.5;
            p.position.z += random() * 0.5;

            p.scale.setScalar(scale);

            p.userData = {
                velocity: new THREE.Vector3(
                    random() * speed,
                    randomPositive() * speed,
                    random() * speed
                ),
                life,
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

            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
                this.pool.release(p);
            }
        }
    }
}
