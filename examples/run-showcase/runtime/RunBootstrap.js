import {
    CameraManager,
    InputManager,
    UIManager
} from 'zortengine/browser';
import { AudioManager } from 'zortengine/audio';
import { ParticleManager } from 'zortengine/render';
import {
    DebugOverlaySystem,
    EventTraceSystem,
    InspectorPanelSystem
} from 'zortengine/devtools';
import {
    AbilitySystem,
    DamageSystem,
    ModifierSystem,
    StatusEffectSystem
} from 'zortengine/kits';
import { PhysicsManager } from 'zortengine/physics';

export class RunBootstrap {
    constructor(scene) {
        this.scene = scene;
    }

    registerCoreSystems() {
        const platform = this.scene.engine.platform;
        const physics = this.scene.registerSystem('physics', new PhysicsManager({
            gravity: { x: 0, y: -18, z: 0 },
            defaultContactMaterial: {
                friction: 0.45,
                restitution: 0.02
            }
        }), { priority: 100 });
        const cameraManager = this.scene.registerSystem('camera', new CameraManager(this.scene.getRenderScene()), { priority: 10 });
        const input = this.scene.registerSystem('input', new InputManager({
            platform,
            domElement: this.scene.engine.renderer?.domElement,
            pointerLockElement: this.scene.engine.renderer?.domElement,
            autoAttach: false
        }), { priority: 5 });
        const particles = this.scene.registerSystem('particles', new ParticleManager(this.scene.getRenderScene()), { priority: 110 });
        const damage = this.scene.registerSystem('damage', new DamageSystem(), { priority: 103 });
        this.scene.modifierSystem = this.scene.registerSystem('modifiers', new ModifierSystem(), { priority: 101 });
        const abilities = this.scene.registerSystem('abilities', new AbilitySystem(), { priority: 104 });
        this.scene.statusSystem = this.scene.registerSystem('statuses', new StatusEffectSystem({
            effectRegistry: this.scene.effectRegistry
        }), { priority: 102 });
        const ui = this.scene.registerSystem('ui', new UIManager({
            platform,
            parent: this.scene.engine.container
        }), { priority: 200 });
        this.scene.registerSystem('audio', new AudioManager(cameraManager), { priority: 20 });
        this.scene.registerSystem('debugOverlay', new DebugOverlaySystem({ ui }), { priority: 300 });
        this.scene.registerSystem('eventTrace', new EventTraceSystem({ ui }), { priority: 301 });
        this.scene.registerSystem('inspectorPanel', new InspectorPanelSystem({ ui }), { priority: 302 });

        cameraManager.setPreset('2.5d');
        this.scene.setCamera(cameraManager);
        return {
            physics,
            cameraManager,
            input,
            particles,
            damage,
            abilities,
            ui
        };
    }
}
