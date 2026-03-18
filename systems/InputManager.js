import * as THREE from 'three';

export class InputManager {
    constructor(config = {}) {
        this.keys = {};
        this.joystickDir = { x: 0, z: 0 };
        this.isAttacking = false;
        
        // Callbacks
        this.onAttack = null;
        this.onViewToggle = null;
        this.onJump = null;
        this.isFpsMode = false;

        this.mouseDelta = { x: 0, y: 0 };
        // YENİ: Raycaster (Lazer) için mutlak fare pozisyonu (-1 ile +1 arası normalize edilmiş)
        this.mousePos = new THREE.Vector2(0, 0); 
        this.raycaster = new THREE.Raycaster();
        
        this.domElement = config.domElement || document.body;
        this.joystickZoneId = config.joystickZoneId || null;
        this.attackButtonId = config.attackButtonId || null;

        document.addEventListener('mousemove', e => {
            if (document.pointerLockElement === document.body) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
            
            // Farenin tarayıcıdaki gerçek koordinatlarını Raycast için Three.js diline çevir
            this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        document.addEventListener('click', () => {
            if (this.isFpsMode && document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            } else if (this.onAttack) {
                this.onAttack();
            }
        });

        window.addEventListener('keydown', e => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            if (e.key === ' ' && this.onJump) this.onJump();
            if (key === 'v' && this.onViewToggle) this.onViewToggle();
        });

        window.addEventListener('keyup', e => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
        });
    }

    // YENİ: Kameradan farenin olduğu noktaya lazer (raycast) gönderip çarptığı objeleri bul
    getRaycastIntersection(camera, objectsToTest) {
        this.raycaster.setFromCamera(this.mousePos, camera);
        return this.raycaster.intersectObjects(objectsToTest, true);
    }

    isKeyDown(key) {
        return !!this.keys[key.toLowerCase()];
    }

    getMovementVector() {
        let mx = 0, mz = 0;
        if (this.isKeyDown('w') || this.isKeyDown('arrowup')) mz -= 1;
        if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) mz += 1;
        if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) mx -= 1;
        if (this.isKeyDown('d') || this.isKeyDown('arrowright')) mx += 1;

        if (mx !== 0 || mz !== 0) {
            const len = Math.sqrt(mx * mx + mz * mz);
            mx /= len; mz /= len;
        } else {
            mx = this.joystickDir.x;
            mz = this.joystickDir.z;
        }
        return { x: mx, z: mz };
    }

    getMouseDelta() {
        const dx = this.mouseDelta.x;
        const dy = this.mouseDelta.y;
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        return { x: dx, y: dy };
    }
}