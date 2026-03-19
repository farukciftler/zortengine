/**
 * React Native input manager — touch/gesture tabanlı
 * InputManager ile aynı API: triggerAction, getMovementVector, getMouseDelta, getRaycastIntersection,
 * consumeCommands, drainReplayFrame, enqueueExternalCommands, on, off, joystickDir
 */
import * as THREE from 'three';
import { EventEmitter } from '../../engine/events/EventEmitter.js';

function getPanResponder() {
    try {
        return require('react-native').PanResponder;
    } catch {
        return null;
    }
}

const SWIPE_THRESHOLD = 30;
const TAP_MAX_DURATION = 200;

export class RNInputManager {
    constructor(config = {}) {
        this.keys = {};
        this.joystickDir = { x: 0, z: 0 };
        this.events = new EventEmitter();
        this.commandQueue = [];
        this.commandHistory = [];
        this.onAttack = null;
        this.onViewToggle = null;
        this.onJump = null;
        this.isFpsMode = false;
        this.mouseDelta = { x: 0, y: 0 };
        this.touchPos = new THREE.Vector2(0, 0);
        this.raycaster = new THREE.Raycaster();
        this.platform = config.platform || null;
        this._touchStart = null;
        this._touchLast = null;
        this._panResponder = null;
        this._viewRef = config.viewRef ?? null;

        this.bindings = config.bindings || {
            default: {
                forward: [],
                backward: [],
                left: [],
                right: [],
                attack: [],
                jump: [],
                skill1: [],
                restart: [],
                viewToggle: []
            },
            mobile: {
                forward: ['swipe_up'],
                backward: ['swipe_down'],
                left: ['swipe_left'],
                right: ['swipe_right'],
                attack: ['tap'],
                jump: ['swipe_up', 'double_tap'],
                skill1: [],
                restart: [],
                viewToggle: []
            }
        };

        if (config.autoAttach !== false) {
            this.attach(config.viewRef);
        }
    }

    _getViewportSize() {
        if (this.platform?.getViewportSize) {
            return this.platform.getViewportSize();
        }
        try {
            const D = require('react-native').Dimensions;
            const { width, height } = D.get('window');
            return { width: width || 1, height: height || 1 };
        } catch {
            return { width: 1, height: 1 };
        }
    }

    _touchToNDC(pageX, pageY) {
        const vp = this._getViewportSize();
        return {
            x: (pageX / vp.width) * 2 - 1,
            y: -(pageY / vp.height) * 2 + 1
        };
    }

    attach(viewRef) {
        this._viewRef = viewRef || this._viewRef;
        if (this._panResponder) return this;

        const PanResponder = getPanResponder();
        if (!PanResponder) return this;

        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { pageX, pageY } = evt.nativeEvent;
                const now = Date.now();
                this._touchStart = { x: pageX, y: pageY, time: now };
                this._touchLast = { x: pageX, y: pageY, time: now };
                const ndc = this._touchToNDC(pageX, pageY);
                this.touchPos.set(ndc.x, ndc.y);

                // Anlık tepki için "down" event'i
                this.events.emit('pressStart', { x: pageX, y: pageY, time: now });
                this.events.emit('pointerDown', { x: pageX, y: pageY, time: now, pointerType: 'touch' });
            },
            onPanResponderMove: (evt) => {
                const { pageX, pageY } = evt.nativeEvent;
                if (this._touchLast) {
                    const dx = pageX - this._touchLast.x;
                    const dy = pageY - this._touchLast.y;
                    this.mouseDelta.x += dx;
                    this.mouseDelta.y += dy;
                    this._touchLast.x = pageX;
                    this._touchLast.y = pageY;
                    this._touchLast.time = Date.now();

                    // Basılıyken hareket: swipe aksiyonu yerine "drag" emit ediyoruz
                    // joystickDir sıfırlanmaz - Joystick bileşeni setJoystickDir ile yönetir
                    this.events.emit('drag', { dx, dy, x: pageX, y: pageY, time: this._touchLast.time });
                    this.events.emit('pointerMove', { dx, dy, x: pageX, y: pageY, time: this._touchLast.time, pointerType: 'touch' });
                }
                const ndc = this._touchToNDC(pageX, pageY);
                this.touchPos.set(ndc.x, ndc.y);
            },
            onPanResponderRelease: (evt) => {
                const { pageX, pageY } = evt.nativeEvent;
                const ndc = this._touchToNDC(pageX, pageY);
                this.touchPos.set(ndc.x, ndc.y);

                if (!this._touchStart) return;
                const dx = pageX - this._touchStart.x;
                const dy = pageY - this._touchStart.y;
                const now = Date.now();
                const dt = now - this._touchStart.time;

                if (dt < TAP_MAX_DURATION && Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
                    this.triggerAction('attack', { profile: 'mobile' });
                }
                // joystickDir sıfırlanmaz - Joystick bileşeni setJoystickDir ile yönetir
                this._touchStart = null;
                this._touchLast = null;

                this.events.emit('pressEnd', { x: pageX, y: pageY, time: now });
                this.events.emit('pointerUp', { x: pageX, y: pageY, time: now, pointerType: 'touch' });
            }
        });
        return this;
    }

    getPanHandlers() {
        return this._panResponder?.panHandlers ?? {};
    }

    onAttach() {
        this.attach(this._viewRef);
    }

    detach() {
        this._panResponder = null;
        this._touchStart = null;
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
        return false;
    }

    requestPointerLock() {}
    exitPointerLock() {}

    triggerAction(actionName, payload = {}) {
        const command = {
            action: actionName,
            profile: payload.profile || 'mobile',
            key: payload.key || null,
            time: Date.now()
        };
        this.commandQueue.push(command);
        this.commandHistory.push(command);
        this.events.emit(actionName, command);

        if (actionName === 'attack' && this.onAttack) this.onAttack();
        if (actionName === 'jump' && this.onJump) this.onJump();
        if (actionName === 'viewToggle' && this.onViewToggle) this.onViewToggle();
    }

    setJoystickDir(x, z) {
        this.joystickDir.x = x;
        this.joystickDir.z = z;
    }

    bind(action, keysArray, profile = 'mobile') {
        if (!this.bindings[profile]) this.bindings[profile] = {};
        this.bindings[profile][action] = keysArray;
    }

    isActionActive(action, profile = 'mobile') {
        return this.bindings[profile]?.[action]?.some(k => this.keys[k]) ?? false;
    }

    getRaycastIntersection(camera, objectsToTest) {
        const cam = camera?.getNativeCamera?.() || camera?.getThreeCamera?.() || camera;
        if (!cam) return [];
        this.raycaster.setFromCamera(this.touchPos, cam);
        return this.raycaster.intersectObjects(objectsToTest, true);
    }

    getMovementVector(profile = 'mobile') {
        let mx = this.joystickDir.x;
        let mz = this.joystickDir.z;
        if (this.isActionActive('forward', profile)) mz -= 1;
        if (this.isActionActive('backward', profile)) mz += 1;
        if (this.isActionActive('left', profile)) mx -= 1;
        if (this.isActionActive('right', profile)) mx += 1;
        if (mx !== 0 || mz !== 0) {
            const len = Math.sqrt(mx * mx + mz * mz);
            mx /= len;
            mz /= len;
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
        const consumed = [];
        const remaining = [];
        for (const cmd of this.commandQueue) {
            if (!profile || cmd.profile === profile) consumed.push(cmd);
            else remaining.push(cmd);
        }
        this.commandQueue = remaining;
        return consumed;
    }

    drainReplayFrame(tick) {
        return { tick, commands: this.consumeCommands() };
    }

    enqueueExternalCommands(commands = []) {
        for (const cmd of commands) {
            this.commandQueue.push(cmd);
            this.events.emit(cmd.action, cmd);
        }
    }
}
