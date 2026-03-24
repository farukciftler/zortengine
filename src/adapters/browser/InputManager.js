import * as THREE from 'three';
import { BrowserPlatform } from './BrowserPlatform.js';
import { EventEmitter } from '../../engine/events/EventEmitter.js';

export class InputManager {
    constructor(config = {}) {
        this.keys = {};
        this.joystickDir = { x: 0, z: 0 };
        this.isAttacking = false;
        this.bindings = config.bindings || {
            default: {
                'forward': ['w', 'arrowup'],
                'backward': ['s', 'arrowdown'],
                'left': ['a', 'arrowleft'],
                'right': ['d', 'arrowright'],
                'attack': [],
                'jump': [' '],
                'skill1': ['q'],
                'restart': ['r'],
                'viewToggle': ['v']
            }
        };
        if (!config.bindings) {
            this.bindings.coop = {
                'forward': ['i'],
                'backward': ['k'],
                'left': ['j'],
                'right': ['l'],
                'attack': ['enter'],
                'jump': ['p'],
                'skill1': ['o'],
                'restart': [],
                'viewToggle': []
            };
        }
        this.events = new EventEmitter();
        this.commandQueue = [];
        this.commandHistory = [];

        this.onAttack = null;
        this.onViewToggle = null;
        this.onJump = null;
        this.isFpsMode = false;
        this.mouseDelta = { x: 0, y: 0 };
        this.mousePos = new THREE.Vector2(0, 0);
        this.clientX = 0;
        this.clientY = 0;
        this.raycaster = new THREE.Raycaster();

        this.platform = config.platform || new BrowserPlatform();
        this.domElement = config.domElement || this.platform.getBody();
        this.pointerLockElement = config.pointerLockElement || this.domElement;
        this.removeListeners = [];

        // Mobile/Touch state
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.touchStartTime = 0;
        this.touchStartPos = new THREE.Vector2();

        if (config.autoAttach !== false) {
            this.attach();
        }
    }

    attach() {
        if (this.removeListeners.length > 0) return;

        this.removeListeners.push(
            this.platform.addEventListener('document', 'mousemove', event => {
                this.clientX = event.clientX;
                this.clientY = event.clientY;
                if (this.isPointerLocked()) {
                    this.mouseDelta.x += event.movementX;
                    this.mouseDelta.y += event.movementY;
                }

                const viewport = this.platform.getViewportSize();
                this.mousePos.x = (event.clientX / viewport.width) * 2 - 1;
                this.mousePos.y = -(event.clientY / viewport.height) * 2 + 1;
            })
        );

        this.removeListeners.push(
            this.platform.addEventListener(this.domElement, 'click', () => {
                if (this.isFpsMode && !this.isPointerLocked() && window.innerWidth > 768) {
                    this.requestPointerLock();
                    return;
                }

                this.triggerAction('attack');
            })
        );

        // Touch Support
        this.removeListeners.push(
            this.platform.addEventListener(this.domElement, 'touchstart', event => {
                const touch = event.touches[0];
                this.lastTouchX = touch.clientX;
                this.lastTouchY = touch.clientY;
                this.touchStartTime = Date.now();
                this.touchStartPos.set(touch.clientX, touch.clientY);
                
                // Update mousePos for raycasting
                const viewport = this.platform.getViewportSize();
                this.mousePos.x = (touch.clientX / viewport.width) * 2 - 1;
                this.mousePos.y = -(touch.clientY / viewport.height) * 2 + 1;
                
                // On iOS/Android, we often want to prevent default to avoid scrolling while playing
                if (this.isFpsMode) {
                   // event.preventDefault(); // Might block UI buttons if not careful
                }
            }, { passive: true })
        );

        this.removeListeners.push(
            this.platform.addEventListener(this.domElement, 'touchmove', event => {
                const touch = event.touches[0];
                const dx = touch.clientX - this.lastTouchX;
                const dy = touch.clientY - this.lastTouchY;

                if (this.isFpsMode) {
                    this.mouseDelta.x += dx * 2.0; // Boost sensitivity for touch
                    this.mouseDelta.y += dy * 2.0;
                }

                this.lastTouchX = touch.clientX;
                this.lastTouchY = touch.clientY;

                const viewport = this.platform.getViewportSize();
                this.mousePos.x = (touch.clientX / viewport.width) * 2 - 1;
                this.mousePos.y = -(touch.clientY / viewport.height) * 2 + 1;
                
                if (this.isFpsMode) {
                    event.preventDefault(); // Prevent scrolling in TPS mode
                }
            }, { passive: false })
        );

        this.removeListeners.push(
            this.platform.addEventListener(this.domElement, 'touchend', event => {
                const duration = Date.now() - this.touchStartTime;
                const dist = this.touchStartPos.distanceTo(new THREE.Vector2(this.lastTouchX, this.lastTouchY));

                // If it was a quick tap without much movement, trigger attack (tap-to-move)
                if (duration < 300 && dist < 15) {
                    this.triggerAction('attack');
                }
            }, { passive: true })
        );

        this.removeListeners.push(
            this.platform.addEventListener('window', 'keydown', event => {
                const key = event.key.toLowerCase();

                if (key === ' ' || key === 'q' || key.startsWith('arrow')) {
                    event.preventDefault();
                }

                this.keys[key] = true;

                if (event.repeat) {
                    return;
                }

                for (const [profile, bindings] of Object.entries(this.bindings)) {
                    for (const [actionName, keys] of Object.entries(bindings)) {
                        if (keys.includes(key)) {
                            this.triggerAction(actionName, { profile, key });
                        }
                    }
                }
            })
        );

        this.removeListeners.push(
            this.platform.addEventListener('window', 'keyup', event => {
                const key = event.key.toLowerCase();
                this.keys[key] = false;
            })
        );
    }

    onAttach() {
        this.attach();
    }

    detach() {
        this.removeListeners.forEach(removeListener => removeListener());
        this.removeListeners = [];
    }

    onDetach() {
        this.detach();
    }

    dispose() {
        this.detach();
        this.keys = {};
    }

    on(eventName, listener) {
        this.events.on(eventName, listener);
    }

    off(eventName, listener) {
        this.events.off(eventName, listener);
    }

    isPointerLocked() {
        return this.platform.getPointerLockElement() === this.pointerLockElement;
    }

    requestPointerLock() {
        this.platform.requestPointerLock(this.pointerLockElement);
    }

    exitPointerLock() {
        this.platform.exitPointerLock();
    }

    triggerAction(actionName, payload = {}) {
        const command = {
            action: actionName,
            profile: payload.profile || 'default',
            key: payload.key || null,
            time: Date.now()
        };
        this.commandQueue.push(command);
        this.commandHistory.push(command);
        this.events.emit(actionName, command);

        if (actionName === 'attack' && this.onAttack) {
            this.onAttack();
        }

        if (actionName === 'jump' && this.onJump) {
            this.onJump();
        }

        if (actionName === 'viewToggle' && this.onViewToggle) {
            this.onViewToggle();
        }
    }

    bind(action, keysArray, profile = 'default') {
        if (!this.bindings[profile]) {
            this.bindings[profile] = {};
        }
        this.bindings[profile][action] = keysArray;
    }

    isActionActive(action, profile = 'default') {
        if (!this.bindings[profile]?.[action]) return false;
        return this.bindings[profile][action].some(k => this.keys[k.toLowerCase()]);
    }

    getRaycastIntersection(camera, objectsToTest) {
        this.raycaster.setFromCamera(this.mousePos, camera);
        return this.raycaster.intersectObjects(objectsToTest, true);
    }

    getMovementVector(profile = 'default') {
        let mx = 0;
        let mz = 0;

        if (this.isActionActive('forward', profile)) mz -= 1;
        if (this.isActionActive('backward', profile)) mz += 1;
        if (this.isActionActive('left', profile)) mx -= 1;
        if (this.isActionActive('right', profile)) mx += 1;

        if (mx !== 0 || mz !== 0) {
            const len = Math.sqrt(mx * mx + mz * mz);
            mx /= len;
            mz /= len;
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

    consumeCommands(profile = null) {
        const remaining = [];
        const consumed = [];

        for (const command of this.commandQueue) {
            if (!profile || command.profile === profile) {
                consumed.push(command);
            } else {
                remaining.push(command);
            }
        }

        this.commandQueue = remaining;
        return consumed;
    }

    drainReplayFrame(tick) {
        const commands = this.consumeCommands();
        return {
            tick,
            commands
        };
    }

    enqueueExternalCommands(commands = []) {
        for (const command of commands) {
            this.commandQueue.push(command);
            this.events.emit(command.action, command);
        }
    }
}
