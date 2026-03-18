import * as THREE from 'three';
import { ObjectPool } from 'zortengine';

export class ProjectileSystem {
    constructor(options = {}) {
        this.scene = options.scene;
        this.particleManager = options.particleManager;
        this.onAmmoChanged = options.onAmmoChanged || null;
        this.bullets = [];
        this.target = null;
        this.onTargetDestroyed = null;
        this.totalCount = options.poolSize || 20;

        this.pool = new ObjectPool(() => {
            const material = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
            return new THREE.Mesh(new THREE.SphereGeometry(0.2), material);
        }, this.totalCount);

        this._notifyAmmo();
    }

    setTarget(target, onTargetDestroyed = null) {
        this.target = target;
        this.onTargetDestroyed = onTargetDestroyed;
    }

    shoot(origin, direction) {
        const bullet = this.pool.get();
        bullet.position.copy(origin);
        bullet.position.y += 1.2;
        bullet.userData = {
            velocity: direction.clone().normalize().multiplyScalar(50),
            life: 2.0
        };

        this.scene.add(bullet);
        this.bullets.push(bullet);

        if (this.particleManager) {
            this.particleManager.emit(bullet.position, 5, {
                color: 0xf1c40f,
                speed: 5,
                life: 0.2,
                scale: 0.5
            });
        }

        this._notifyAmmo();
    }

    update(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.position.addScaledVector(bullet.userData.velocity, delta);
            bullet.userData.life -= delta;

            if (this.target && !this.target.isDestroyed && bullet.position.distanceTo(this.target.group.position) < 1.5) {
                if (this.particleManager) {
                    this.particleManager.emit(this.target.group.position, 10, { color: 0x8e44ad, speed: 5 });
                }

                bullet.userData.life = 0;
                this.target.group.position.addScaledVector(bullet.userData.velocity.clone().normalize(), 0.5);
                this.target.hp -= 25;

                if (this.target.hp <= 0 && this.onTargetDestroyed) {
                    this.onTargetDestroyed(this.target);
                }
            }

            if (bullet.userData.life <= 0) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
                this.pool.release(bullet);
                this._notifyAmmo();
            }
        }
    }

    _notifyAmmo() {
        if (this.onAmmoChanged) {
            this.onAmmoChanged(this.pool.getFreeCount(), this.totalCount);
        }
    }
}
