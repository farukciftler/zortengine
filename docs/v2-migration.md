# V1 -> V2 Migration

This document summarizes the transition from the existing `zortengine` surface to the contract-first v2 surface.

## Public API Changes

- `zortengine/browser` now only carries the browser-specific surface.
- `AudioManager` is now under `zortengine/audio`.
- `ParticleManager`, `PostProcessManager`, `ThreeRendererAdapter`, and `ThreeAssetLoader` are now under `zortengine/render`.
- `zortengine/gameplay` is the new semantic facade.
- `zortengine/objects` is still maintained as a compatibility alias, but new code should use `gameplay`.

## Engine Setup

Old:

```js
const engine = new Engine(document.body, { seed: 'abc' });
```

New:

```js
const assetLoader = new ThreeAssetLoader();
const engine = new Engine(document.body, {
  seed: 'abc',
  rendererAdapter: new ThreeRendererAdapter(),
  assets: new AssetStore({ loader: assetLoader }),
  assetLoader
});
```

## Scenes and Assets

- Use `retainAsset()` / `releaseAsset()` if assets will be held within a `GameScene`.
- `sceneHandle` and `getRenderScene()` are the new renderer boundary surfaces.
- `threeScene` is still available for compatibility, but new engine-level code should use `sceneHandle`.

## Plugin System

In the old structure, modules were connected manually. The new model:

```js
engine.use(plugin);
scene.use(plugin);
```

Plugins can declare capabilities and dependencies.

