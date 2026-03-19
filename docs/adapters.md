# Adapter Guide

In the V2 foundation, the main boundary between the engine and concrete platforms is the `adapter` layer.

## Layers

- `src/engine/`: lifecycle, orchestration, plugin host, snapshot, asset ownership
- `src/adapters/browser/`: input, UI, camera, browser platform
- `src/adapters/render/`: `ThreeRendererAdapter`, particle, post-process, `ThreeAssetLoader`
- `src/adapters/audio/`: `AudioManager`
- `src/adapters/physics/`: physics bindings

## Renderer Contract

A renderer adapter must provide at least this surface:

- `mount({ container, platform })`
- `createSceneHandle({ background, nativeScene })`
- `render({ scene, camera, postProcessor })`
- `resize(width, height)`
- `dispose()`

`ThreeRendererAdapter` creates `THREE.WebGLRenderer`, but this concrete type is no longer created directly by the `Engine`.

## Scene Handle

`GameScene` now provides this generic surface in addition to the `threeScene` field:

- `getSceneHandle()`
- `getRenderScene()`

In this way, renderer-aware code sits on the concrete native scene with `getRenderScene()`, and engine code sits on the generic boundary with `sceneHandle`.

## Asset Loader Boundary

`AssetLoader` is now a generic capability dispatcher. Knowledge of `THREE.TextureLoader`, `AudioLoader`, and `GLTFLoader` has been moved into `ThreeAssetLoader`.

When writing a new adapter:

1. Create an `AssetLoader` derivative.
2. Register type-based loaders with `registerCapability(type, { load, dispose })`.
3. Integrate ownership and dispose flow with `AssetStore`.

