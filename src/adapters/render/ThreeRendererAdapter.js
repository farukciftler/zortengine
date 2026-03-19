import * as THREE from 'three';

class ThreeSceneHandle {
    constructor(scene) {
        this.scene = scene || new THREE.Scene();
    }

    add(node) {
        const nativeNode = node?.getNativeNode?.() || node?.group || node?.mesh || node;
        if (nativeNode?.isObject3D) {
            this.scene.add(nativeNode);
        }
    }

    remove(node) {
        const nativeNode = node?.getNativeNode?.() || node?.group || node?.mesh || node;
        if (nativeNode?.isObject3D) {
            this.scene.remove(nativeNode);
        }
    }

    setBackground(background) {
        this.scene.background = background;
    }

    getNativeScene() {
        return this.scene;
    }
}

export class ThreeRendererAdapter {
    constructor(options = {}) {
        this.options = options;
        this.renderer = null;
        this.container = null;
    }

    mount(options = {}) {
        if (this.renderer) {
            return this.renderer;
        }

        const viewport = options.platform?.getViewportSize?.() || { width: 1, height: 1 };
        this.container = options.container || null;
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.options.antialias ?? true,
            ...this.options.rendererOptions
        });
        this.renderer.setSize(viewport.width, viewport.height);
        this.renderer.shadowMap.enabled = this.options.shadows ?? true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container?.appendChild?.(this.renderer.domElement);
        return this.renderer;
    }

    createSceneHandle(options = {}) {
        const handle = new ThreeSceneHandle(options.nativeScene);
        if (options.background !== undefined) {
            handle.setBackground(options.background);
        }
        return handle;
    }

    unwrapScene(scene) {
        return scene?.getNativeScene?.() || scene?.threeScene || scene?.scene || scene || null;
    }

    unwrapCamera(camera) {
        return camera?.getNativeCamera?.() || camera?.getThreeCamera?.() || camera || null;
    }

    render(frame) {
        if (!this.renderer) return;
        const scene = this.unwrapScene(frame?.scene);
        const camera = this.unwrapCamera(frame?.camera);
        const postProcessor = frame?.postProcessor || null;

        if (!scene || !camera) {
            return;
        }

        if (postProcessor?.render) {
            postProcessor.setCamera?.(camera);
            postProcessor.render();
            return;
        }

        this.renderer.render(scene, camera);
    }

    resize(width, height) {
        this.renderer?.setSize?.(width, height);
    }

    setSize(width, height) {
        this.resize(width, height);
    }

    setPixelRatio(ratio) {
        this.renderer?.setPixelRatio?.(ratio);
    }

    dispose() {
        this.renderer?.dispose?.();
        this.renderer = null;
        this.container = null;
    }
}
