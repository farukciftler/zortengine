import {
    CameraManager,
    InputManager,
    UIManager
} from 'zortengine/browser';
import { PhysicsManager } from 'zortengine/physics';

export class ZigzagBootstrap {
    constructor(scene) {
        this.scene = scene;
    }

    registerCoreSystems() {
        const platform = this.scene.engine.platform;
        const physics = this.scene.registerSystem('physics', new PhysicsManager({
            gravity: { x: 0, y: -18, z: 0 },
            defaultContactMaterial: { friction: 0.5, restitution: 0 }
        }), { priority: 100 });

        const cameraManager = this.scene.registerSystem('camera', new CameraManager(
            this.scene.getRenderScene()
        ), { priority: 10 });

        const input = this.scene.registerSystem('input', new InputManager({
            platform,
            domElement: this.scene.engine.renderer?.domElement,
            pointerLockElement: this.scene.engine.renderer?.domElement,
            autoAttach: false
        }), { priority: 5 });

        this.scene.registerSystem('ui', new UIManager({
            platform,
            parent: this.scene.engine.container
        }), { priority: 200 });

        return { physics, cameraManager, input };
    }
}
