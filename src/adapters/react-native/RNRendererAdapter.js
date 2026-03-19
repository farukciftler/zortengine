/**
 * React Native renderer adapter — expo-gl ile (expo-three bağımlılığı olmadan)
 * ThreeRendererAdapter ile aynı contract: mount, createSceneHandle, unwrapScene, unwrapCamera, render, resize, dispose
 */
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

export class RNRendererAdapter {
    constructor(options = {}) {
        this.options = options;
        this.renderer = null;
        this.gl = null;
    }

    mount(options = {}) {
        if (this.renderer) {
            return this.renderer;
        }

        const gl = options.gl;
        if (!gl) {
            throw new Error('RNRendererAdapter.mount requires options.gl (expo-gl context)');
        }

        this.gl = gl;
        const viewport = options.platform?.getViewportSize?.() || options.viewport || {
            width: gl.drawingBufferWidth || 1,
            height: gl.drawingBufferHeight || 1
        };

        // three.js, DOM canvas bekler. expo-gl context için minimal canvas shim.
        if (!gl.canvas) {
            gl.canvas = {
                width: viewport.width,
                height: viewport.height,
                style: {},
                addEventListener() {},
                removeEventListener() {}
            };
        } else {
            gl.canvas.width = viewport.width;
            gl.canvas.height = viewport.height;
            gl.canvas.addEventListener = gl.canvas.addEventListener || (() => {});
            gl.canvas.removeEventListener = gl.canvas.removeEventListener || (() => {});
        }

        this.renderer = new THREE.WebGLRenderer({
            antialias: this.options.antialias ?? true,
            alpha: this.options.alpha ?? false,
            canvas: gl.canvas,
            context: gl,
        });
        this.renderer.setSize(viewport.width, viewport.height);
        this.renderer.shadowMap.enabled = this.options.shadows ?? false;
        if (this.renderer.shadowMap) {
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
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
        // expo-gl: frame'i ekrana bas
        this.gl?.endFrameEXP?.();
    }

    resize(width, height) {
        this.renderer?.setSize?.(width, height);
    }

    dispose() {
        this.renderer?.dispose?.();
        this.renderer = null;
        this.gl = null;
    }
}
