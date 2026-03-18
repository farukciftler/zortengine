import * as THREE from 'three';
import { ObjectPool } from '../utils/ObjectPool.js';

export class ProjectileSystem {
    constructor(options = {}) {
        this.scene = options.scene;
        this.particleManager = options.particleManager;
        this.damageSystem = options.damageSystem || null;
        this.onCountChanged = options.onCountChanged || options.onAmmoChanged || null;
        this.projectiles = [];
        this.targetProvider = null;
        this.onTargetDestroyed = null;
        this.damage = options.damage ?? 25;
        this.totalCount = options.poolSize || 20;

        this.pool = new ObjectPool(() => {
            const material = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
            return new THREE.Mesh(new THREE.SphereGeometry(0.2), material);
        }, this.totalCount);

        this._notifyCount();
    }

    setTarget(target, onTargetDestroyed = null) {
        this.targetProvider = () => (target ? [target] : []);
        this.onTargetDestroyed = onTargetDestroyed;
    }

    setTargetProvider(provider, onTargetDestroyed = null) {
        this.targetProvider = provider;
        this.onTargetDestroyed = onTargetDestroyed;
    }

    shoot(origin, direction, options = {}) {
        const projectile = this.pool.get();
        projectile.position.copy(origin);
        projectile.position.y += options.heightOffset ?? 1.2;
        projectile.userData = {
            velocity: direction.clone().normalize().multiplyScalar(options.speed ?? 50),
            life: options.life ?? 2.0,
            damage: options.damage ?? this.damage
        };

        this.scene.add(projectile);
        this.projectiles.push(projectile);
        this._notifyCount();
    }

    update(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.position.addScaledVector(projectile.userData.velocity, delta);
            projectile.userData.life -= delta;

            const hitTarget = this._findHitTarget(projectile);
            if (hitTarget) {
                if (this.particleManager) {
                    this.particleManager.emit(projectile.position, 10, { color: 0x8e44ad, speed: 5 });
                }

                projectile.userData.life = 0;
                hitTarget.group.position.addScaledVector(projectile.userData.velocity.clone().normalize(), 0.5);

                if (this.damageSystem) {
                    this.damageSystem.applyDamage(hitTarget, projectile.userData.damage, {
                        type: 'projectile',
                        source: 'player'
                    });
                }

                if (hitTarget.getComponent?.('health') && !hitTarget.getComponent('health').isAlive() && this.onTargetDestroyed) {
                    this.onTargetDestroyed(hitTarget);
                }
            }

            if (projectile.userData.life <= 0) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
                this.pool.release(projectile);
                this._notifyCount();
            }
        }
    }

    _notifyCount() {
        if (this.onCountChanged) {
            this.onCountChanged(this.pool.getFreeCount(), this.totalCount);
        }
    }

    _findHitTarget(projectile) {
        if (!this.targetProvider) return null;

        const targets = this.targetProvider() || [];
        for (const target of targets) {
            if (!target || target.isDestroyed) continue;
            if (projectile.position.distanceTo(target.group.position) < 1.5) {
                return target;
            }
        }

        return null;
    }
}
