import * as THREE from 'three';
import { createHumanoid } from './HumanoidBuilder.js';

/**
 * Purely aesthetic helicopter landing sequence.
 * Helicopter flies in, lands, soldiers disembark, look around, reboard, helicopter flies away.
 * Then loops after a cooldown.
 */

// ─── Helicopter Mesh ─────────────────────────────────────────

function createHelicopter() {
    const heli = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d5a3e, metalness: 0.6, roughness: 0.35 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.45, metalness: 1, roughness: 0 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff0000, emissiveIntensity: 1.0 });

    // ── Main fuselage ──
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 3.0), bodyMat);
    fuselage.position.y = 0;
    fuselage.castShadow = true;
    heli.add(fuselage);

    // Nose (front taper)
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 6), bodyMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, -0.1, 2.0);
    nose.castShadow = true;
    heli.add(nose);

    // Cockpit glass
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    cockpit.position.set(0, 0.45, 1.2);
    cockpit.scale.set(1.2, 0.8, 1.5);
    heli.add(cockpit);

    // Side panels with windows
    for (let side = -1; side <= 1; side += 2) {
        // Side door area
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 1.0), darkMat);
        door.position.set(side * 0.72, 0, 0);
        heli.add(door);

        // Side windows
        for (let i = 0; i < 2; i++) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 0.3), glassMat);
            win.position.set(side * 0.73, 0.15, 0.3 - i * 0.6);
            heli.add(win);
        }
    }

    // ── Tail boom ──
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 3.0, 8), bodyMat);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 0.2, -2.8);
    tailBoom.castShadow = true;
    heli.add(tailBoom);

    // Tail fin (vertical stabilizer)
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.5), bodyMat);
    tailFin.position.set(0, 0.7, -4.0);
    heli.add(tailFin);

    // Horizontal stabilizer
    const hStab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.4), bodyMat);
    hStab.position.set(0, 0.5, -4.0);
    heli.add(hStab);

    // Tail rotor disc
    const tailRotor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.03, 16),
        new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.25 })
    );
    tailRotor.position.set(0.15, 0.7, -4.2);
    tailRotor.rotation.z = Math.PI / 2;
    tailRotor.userData.tailRotor = true;
    heli.add(tailRotor);

    // ── Landing skids ──
    const skidMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
    const skidGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8);
    for (let side = -1; side <= 1; side += 2) {
        // Horizontal skid
        const skid = new THREE.Mesh(skidGeo, skidMat);
        skid.rotation.x = Math.PI / 2;
        skid.position.set(side * 0.6, -0.7, 0);
        heli.add(skid);

        // Vertical struts (2 per side)
        const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6);
        for (let i = -1; i <= 1; i += 2) {
            const strut = new THREE.Mesh(strutGeo, skidMat);
            strut.position.set(side * 0.6, -0.45, i * 0.7);
            heli.add(strut);
        }
    }

    // ── Main rotor assembly ──
    const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12), darkMat);
    rotorHub.position.y = 0.6;
    heli.add(rotorHub);

    // Rotor mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), darkMat);
    mast.position.y = 0.75;
    heli.add(mast);

    // Rotor disc (transparent spinning disc)
    const mainRotor = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 3.5, 0.03, 32),
        new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.15 })
    );
    mainRotor.position.y = 0.92;
    mainRotor.userData.mainRotor = true;
    heli.add(mainRotor);

    // Actual rotor blades (4)
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });
    const bladeGroup = new THREE.Group();
    bladeGroup.position.y = 0.92;
    bladeGroup.userData.bladeGroup = true;
    for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 0.18), bladeMat);
        blade.rotation.y = (Math.PI / 2) * i;
        blade.position.x = 0;
        bladeGroup.add(blade);
    }
    heli.add(bladeGroup);

    // ── Details ──
    // Position light (red)
    const posLight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), accentMat);
    posLight.position.set(0, -0.5, -1.5);
    heli.add(posLight);

    // Anti-collision beacon on top
    const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff0000, emissiveIntensity: 2.0 })
    );
    beacon.position.set(0, 0.55, -0.5);
    beacon.userData.beacon = true;
    heli.add(beacon);

    // Exhaust pipes
    for (let side = -1; side <= 1; side += 2) {
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8), darkMat);
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(side * 0.45, 0.35, -1.5);
        heli.add(exhaust);
    }

    heli.scale.setScalar(0.6);
    return heli;
}

// ─── Soldier (reusing HumanoidBuilder) ───────────────────────

function createSoldier() {
    const hue = 0.3 + Math.random() * 0.1; // olive/green
    const color = new THREE.Color().setHSL(hue, 0.4, 0.35).getHex();
    const headColor = new THREE.Color().setHSL(hue, 0.3, 0.55).getHex();
    const mesh = createHumanoid(color, headColor, false);
    mesh.scale.setScalar(0.5);
    return mesh;
}

// ─── States ──────────────────────────────────────────────────
const STATE = {
    FLYING_IN: 0,
    LANDING: 1,
    DOORS_OPEN: 2,
    SOLDIERS_EXITING: 3,
    LOOKING_AROUND: 4,
    SOLDIERS_RETURNING: 5,
    TAKING_OFF: 6,
    FLYING_AWAY: 7,
    COOLDOWN: 8,
};

// ─── Main Class ──────────────────────────────────────────────

export class HeliLanding {
    constructor(threeScene, landingPos) {
        this.scene = threeScene;
        this.landingPos = landingPos.clone();
        this.landingPos.y = 0.75; // ground level for skids (skids are at -0.7)

        this.heli = createHelicopter();
        this.scene.add(this.heli);

        // Start position (high in the sky, far away)
        this.startPos = this.landingPos.clone().add(new THREE.Vector3(30, 18, 25));
        this.exitPos = this.landingPos.clone().add(new THREE.Vector3(-35, 20, -30));

        this.heli.position.copy(this.startPos);

        // Soldiers
        this.soldiers = [];
        this.soldierTargets = [];
        for (let i = 0; i < 4; i++) {
            const s = createSoldier();
            s.visible = false;
            this.scene.add(s);
            this.soldiers.push(s);

            // Spread positions around helicopter
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            const dist = 2.0 + Math.random() * 0.5;
            this.soldierTargets.push(
                this.landingPos.clone().add(new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist))
            );
        }

        this.state = STATE.FLYING_IN;
        this.stateTimer = 0;
        this.totalTimer = 0;
    }

    update(delta, time) {
        this.stateTimer += delta;
        this.totalTimer += delta;

        // Always spin rotors
        this.heli.traverse(child => {
            if (child.userData.bladeGroup) {
                child.rotation.y += delta * 25;
            }
            if (child.userData.tailRotor) {
                child.rotation.x += delta * 35;
            }
            if (child.userData.beacon) {
                child.material.emissiveIntensity = 1.0 + Math.sin(time * 8) * 1.5;
            }
        });

        switch (this.state) {
            case STATE.FLYING_IN:
                this._flyToward(this.landingPos.clone().add(new THREE.Vector3(0, 5, 0)), delta, 4);
                if (this.heli.position.distanceTo(this.landingPos.clone().add(new THREE.Vector3(0, 5, 0))) < 1) {
                    this._changeState(STATE.LANDING);
                }
                break;

            case STATE.LANDING: {
                const target = this.landingPos.clone();
                target.y = 0.5;
                this._flyToward(target, delta, 1.5);
                if (this.heli.position.distanceTo(target) < 0.15) {
                    this.heli.position.copy(target);
                    this._changeState(STATE.DOORS_OPEN);
                }
                break;
            }

            case STATE.DOORS_OPEN:
                if (this.stateTimer > 0.8) {
                    // Show soldiers at helicopter position
                    for (let i = 0; i < this.soldiers.length; i++) {
                        this.soldiers[i].position.copy(this.landingPos);
                        this.soldiers[i].position.y = 0.4;
                        this.soldiers[i].visible = true;
                    }
                    this._changeState(STATE.SOLDIERS_EXITING);
                }
                break;

            case STATE.SOLDIERS_EXITING: {
                let allArrived = true;
                for (let i = 0; i < this.soldiers.length; i++) {
                    const s = this.soldiers[i];
                    const target = this.soldierTargets[i];
                    const dir = target.clone().sub(s.position);
                    if (dir.length() > 0.1) {
                        allArrived = false;
                        dir.normalize();
                        s.position.add(dir.multiplyScalar(delta * 2));
                        s.position.y = 0.4;
                        // Face movement direction
                        s.lookAt(target.x, 0.4, target.z);
                        // Walk animation
                        const ud = s.userData;
                        if (ud.legL && ud.legR) {
                            const t = time * 8 + i;
                            ud.legL.rotation.x = Math.sin(t) * 0.4;
                            ud.legR.rotation.x = -Math.sin(t) * 0.4;
                            ud.armL.rotation.x = -Math.sin(t) * 0.3;
                            ud.armR.rotation.x = Math.sin(t) * 0.3;
                        }
                    }
                }
                if (allArrived) {
                    this._changeState(STATE.LOOKING_AROUND);
                }
                break;
            }

            case STATE.LOOKING_AROUND:
                // Soldiers look around for a few seconds
                for (let i = 0; i < this.soldiers.length; i++) {
                    const s = this.soldiers[i];
                    s.rotation.y = Math.sin(time * 1.5 + i * 1.5) * 1.2;
                    // Idle limbs
                    const ud = s.userData;
                    if (ud.legL) {
                        ud.legL.rotation.x = 0;
                        ud.legR.rotation.x = 0;
                        ud.armL.rotation.x = Math.sin(time * 2 + i) * 0.1;
                        ud.armR.rotation.x = -Math.sin(time * 2 + i) * 0.1;
                    }
                }
                if (this.stateTimer > 5) {
                    this._changeState(STATE.SOLDIERS_RETURNING);
                }
                break;

            case STATE.SOLDIERS_RETURNING: {
                let allBack = true;
                for (let i = 0; i < this.soldiers.length; i++) {
                    const s = this.soldiers[i];
                    const target = this.landingPos.clone();
                    target.y = 0.4;
                    const dir = target.clone().sub(s.position);
                    if (dir.length() > 0.2) {
                        allBack = false;
                        dir.normalize();
                        s.position.add(dir.multiplyScalar(delta * 2.5));
                        s.lookAt(target.x, 0, target.z);
                        const ud = s.userData;
                        if (ud.legL) {
                            const t = time * 8 + i;
                            ud.legL.rotation.x = Math.sin(t) * 0.4;
                            ud.legR.rotation.x = -Math.sin(t) * 0.4;
                        }
                    }
                }
                if (allBack) {
                    for (const s of this.soldiers) s.visible = false;
                    this._changeState(STATE.TAKING_OFF);
                }
                break;
            }

            case STATE.TAKING_OFF: {
                const liftTarget = this.landingPos.clone().add(new THREE.Vector3(0, 6, 0));
                this._flyToward(liftTarget, delta, 2);
                if (this.heli.position.distanceTo(liftTarget) < 0.5) {
                    this._changeState(STATE.FLYING_AWAY);
                }
                break;
            }

            case STATE.FLYING_AWAY:
                this._flyToward(this.exitPos, delta, 5);
                if (this.heli.position.distanceTo(this.exitPos) < 2) {
                    this._changeState(STATE.COOLDOWN);
                }
                break;

            case STATE.COOLDOWN:
                this.heli.visible = false;
                if (this.stateTimer > 20) {
                    // Reset and start again
                    this.heli.position.copy(this.startPos);
                    this.heli.visible = true;
                    this._changeState(STATE.FLYING_IN);
                }
                break;
        }
    }

    _flyToward(target, delta, speed) {
        const dir = target.clone().sub(this.heli.position);
        const dist = dir.length();
        if (dist > 0.01) {
            dir.normalize();
            const move = Math.min(dist, speed * delta);
            this.heli.position.add(dir.multiplyScalar(move));

            // Face movement direction (YAW only)
            const flatDir = dir.clone();
            flatDir.y = 0;
            if (flatDir.lengthSq() > 0.001) {
                flatDir.normalize();
                const lookTarget = this.heli.position.clone().add(flatDir);
                const targetQ = new THREE.Quaternion();
                const m = new THREE.Matrix4().lookAt(this.heli.position, lookTarget, new THREE.Vector3(0, 1, 0));
                targetQ.setFromRotationMatrix(m);
                this.heli.quaternion.slerp(targetQ, delta * 3);
            }

            // Forward tilt (pitch) manually based on horizontal speed
            const hSpeed = Math.sqrt(dir.x * dir.x + dir.z * dir.z) * speed;
            const targetPitch = Math.min(0.25, hSpeed * 0.08);

            const euler = new THREE.Euler().setFromQuaternion(this.heli.quaternion, 'YXZ');
            euler.x = -targetPitch; // Pitch down
            this.heli.quaternion.setFromEuler(euler);

        } else {
            // Level out
            const euler = new THREE.Euler().setFromQuaternion(this.heli.quaternion, 'YXZ');
            euler.x = THREE.MathUtils.lerp(euler.x, 0, delta * 3);
            this.heli.quaternion.setFromEuler(euler);
        }
    }

    _changeState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
}
