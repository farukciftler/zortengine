import * as THREE from 'three';
import { BrowserPlatform } from '../core/BrowserPlatform.js';
import { EventEmitter } from '../utils/EventEmitter.js';

export class InputManager {
    constructor(config = {}) {
        this.keys = {};
        this.joystickDir = { x: 0, z: 0 };
        this.isAttacking = false;
        this.bindings = {
            'forward': ['w', 'arrowup'],
            'backward': ['s', 'arrowdown'],
            'left': ['a', 'arrowleft'],
            'right': ['d', 'arrowright'],
            'attack': [],
            'jump': [' '],
            'skill1': ['q'],
            'restart': ['r']
        };
        this.events = new EventEmitter();

        this.onAttack = null;
        this.onViewToggle = null;
        this.onJump = null;
        this.isFpsMode = false;
        this.mouseDelta = { x: 0, y: 0 };
        this.mousePos = new THREE.Vector2(0, 0);
        this.raycaster = new THREE.Raycaster();

        this.platform = config.platform || new BrowserPlatform();
        this.domElement = config.domElement || this.platform.getBody();
        this.pointerLockElement = config.pointerLockElement || this.domElement;
        this.removeListeners = [];

        if (config.autoAttach !== false) {
            this.attach();
        }
    }

    attach() {
        if (this.removeListeners.length > 0) return;

        this.removeListeners.push(
            this.platform.addEventListener('document', 'mousemove', event => {
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
                if (this.isFpsMode && !this.isPointerLocked()) {
                    this.requestPointerLock();
                    return;
                }

                this.triggerAction('attack');
            })
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

                if (event.key === ' ' && this.onJump) {
                    this.onJump();
                }

                if (event.key === ' ') {
                    this.triggerAction('jump');
                }

                if (key === 'q') {
                    this.triggerAction('skill1');
                }

                if (key === 'r') {
                    this.triggerAction('restart');
                }

                if (key === 'v') {
                    this.triggerAction('viewToggle');
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

    triggerAction(actionName) {
        this.events.emit(actionName);

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