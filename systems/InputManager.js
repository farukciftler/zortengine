import * as THREE from 'three';

export class InputManager {
    constructor(config = {}) {
        this.keys = {};
        this.joystickDir = { x: 0, z: 0 };
        this.isAttacking = false;
        
        // -- YENİ: Eylem Haritası (Action Mapping) --
        this.bindings = {
            'forward': ['w', 'arrowup'],
            'backward': ['s', 'arrowdown'],
            'left': ['a', 'arrowleft'],
            'right': ['d', 'arrowright'],
            'attack': [' '] // İleride fare sol tık da eklenebilir
        };
        
        // Callbacks
        this.onAttack = null;
        this.onViewToggle = null;
        this.onJump = null;
        this.isFpsMode = false;

        this.mouseDelta = { x: 0, y: 0 };
        this.mousePos = new THREE.Vector2(0, 0); 
        this.raycaster = new THREE.Raycaster();
        
        this.domElement = config.domElement || document.body;

        document.addEventListener('mousemove', e => {
            if (document.pointerLockElement === document.body) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
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
            if (e.key === ' ' && this.onAttack) this.onAttack(); // Space tuşu için direkt tetik
            if (key === 'v' && this.onViewToggle) this.onViewToggle();
        });

        window.addEventListener('keyup', e => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
        });
    }

    // Tuş atamasını değiştir (Örn: Ayarlar Menüsünden)
    bind(action, keysArray) {
        this.bindings[action] = keysArray;
    }

    // Bir eylemin aktif olup olmadığını kontrol et
    isActionActive(action) {
        if (!this.bindings[action]) return false;
        return this.bindings[action].some(k => this.keys[k.toLowerCase()]);
    }

    getRaycastIntersection(camera, objectsToTest) {
        this.raycaster.setFromCamera(this.mousePos, camera);
        return this.raycaster.intersectObjects(objectsToTest, true);
    }

    getMovementVector() {
        let mx = 0, mz = 0;
        
        // Artık harf yerine eylem soruyoruz
        if (this.isActionActive('forward')) mz -= 1;
        if (this.isActionActive('backward')) mz += 1;
        if (this.isActionActive('left')) mx -= 1;
        if (this.isActionActive('right')) mx += 1;

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