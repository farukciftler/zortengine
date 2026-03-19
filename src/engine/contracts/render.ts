export interface VectorLike {
    x: number;
    y: number;
    z: number;
}

export interface TransformLike {
    position: VectorLike;
    rotation: VectorLike;
    scale?: VectorLike;
}

export interface RenderNodeHandle {
    add?(child: RenderNodeHandle | unknown): void;
    remove?(child: RenderNodeHandle | unknown): void;
    getNativeNode?(): unknown;
}

export interface SceneHandle extends RenderNodeHandle {
    setBackground?(background: unknown): void;
    getNativeScene?(): unknown;
}

export interface CameraHandle {
    onResize?(aspect: number, width: number, height: number): void;
    getNativeCamera?(): unknown;
}

export interface PostProcessorHandle {
    setCamera?(camera: CameraHandle | unknown): void;
    render?(): void;
    onResize?(width: number, height: number): void;
}

export interface RendererFrame {
    scene: SceneHandle | unknown;
    camera: CameraHandle | unknown;
    postProcessor?: PostProcessorHandle | unknown;
}

export interface RendererAdapter {
    mount(options: { container?: unknown; platform: unknown; viewport?: { width: number; height: number } }): void;
    createSceneHandle(options?: { background?: unknown; nativeScene?: unknown }): SceneHandle;
    render(frame: RendererFrame): void;
    resize(width: number, height: number): void;
    setSize?(width: number, height: number): void;
    setPixelRatio?(ratio: number): void;
    dispose(): void;
}
