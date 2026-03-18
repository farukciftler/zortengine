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
        
        this.domElement = config.domElement || document.body;
        this.joystickZoneId = config.joystickZoneId || null;
        this.attackButtonId = config.attackButtonId || null;

        document.addEventListener('mousemove', e => {
            if (document.pointerLockElement === document.body) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
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

        // Optional Joystick setup if nipplejs is loaded
        if (window.nipplejs && this.joystickZoneId) {
            const zone = document.getElementById(this.joystickZoneId);
            if (zone) {
                const joystickManager = nipplejs.create({
                    zone: zone,
                    mode: 'static',
                    position: { left: '50%', top: '50%' },
                    color: 'white',
                    size: 100
                });
                joystickManager.on('move', (evt, data) => {
                    this.joystickDir.x = Math.cos(data.angle.radian);
                    this.joystickDir.z = -Math.sin(data.angle.radian);
                });
                joystickManager.on('end', () => { this.joystickDir = { x: 0, z: 0 }; });
            }
        }

        if (this.attackButtonId) {
            const btn = document.getElementById(this.attackButtonId);
            if (btn) {
                btn.addEventListener('pointerdown', () => {
                    if (this.onAttack) this.onAttack();
                });
            }
        }
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
