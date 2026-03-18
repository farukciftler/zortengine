import * as THREE from 'three';
import { ObjectPool } from 'zortengine';

export class ProjectileSystem {
    constructor(options = {}) {
        this.scene = options.scene;
        this.particleManager = options.particleManager;
        this.damageSystem = options.damageSystem || null;
        this.onAmmoChanged = options.onAmmoChanged || null;
        this.bullets = [];
        this.targetProvider = null;
        this.onTargetDestroyed = null;
        this.damage = options.damage ?? 25;
        this.totalCount = options.poolSize || 20;

        this.pool = new ObjectPool(() => {
            const material = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
            return new THREE.Mesh(new THREE.SphereGeometry(0.2), material);
        }, this.totalCount);

        this._notifyAmmo();
    }

    setTarget(target, onTargetDestroyed = null) {
        this.targetProvider = () => (target ? [target] : []);
        this.onTargetDestroyed = onTargetDestroyed;
    }

    setTargetProvider(provider, onTargetDestroyed = null) {
        this.targetProvider = provider;
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
        this._notifyAmmo();
    }

    update(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.position.addScaledVector(bullet.userData.velocity, delta);
            bullet.userData.life -= delta;

            const hitTarget = this._findHitTarget(bullet);
            if (hitTarget) {
                if (this.particleManager) {
                    this.particleManager.emit(bullet.position, 10, { color: 0x8e44ad, speed: 5 });
                }

                bullet.userData.life = 0;
                hitTarget.group.position.addScaledVector(bullet.userData.velocity.clone().normalize(), 0.5);

                if (this.damageSystem) {
                    this.damageSystem.applyDamage(hitTarget, this.damage, {
                        type: 'projectile',
                        source: 'player'
                    });
                }

                if (hitTarget.getComponent?.('health') && !hitTarget.getComponent('health').isAlive() && this.onTargetDestroyed) {
                    this.onTargetDestroyed(hitTarget);
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

    _findHitTarget(bullet) {
        if (!this.targetProvider) return null;

        const targets = this.targetProvider() || [];
        for (const target of targets) {
            if (!target || target.isDestroyed) continue;
            if (bullet.position.distanceTo(target.group.position) < 1.5) {
                return target;
            }
        }

        return null;
    }
}
