# V1 -> V2 Migration

Bu belge mevcut `zortengine` surface'inden contract-first v2 surface'ine gecisi ozetler.

## Public API Degisiklikleri

- `zortengine/browser` artik yalnizca browser-specific surface tasir.
- `AudioManager` artik `zortengine/audio` altindadir.
- `ParticleManager`, `PostProcessManager`, `ThreeRendererAdapter`, `ThreeAssetLoader` artik `zortengine/render` altindadir.
- `zortengine/gameplay` yeni semantic facade'dir.
- `zortengine/objects` halen compatibility alias olarak korunur ama yeni kod `gameplay` kullanmalidir.

## Engine Kurulumu

Eski:

```js
const engine = new Engine(document.body, { seed: 'abc' });
```

Yeni:

```js
const assetLoader = new ThreeAssetLoader();
const engine = new Engine(document.body, {
  seed: 'abc',
  rendererAdapter: new ThreeRendererAdapter(),
  assets: new AssetStore({ loader: assetLoader }),
  assetLoader
});
```

## Scene ve Assetler

- `GameScene` icinde asset tutulacaksa `retainAsset()` / `releaseAsset()` kullanin.
- `sceneHandle` ve `getRenderScene()` yeni renderer boundary yuzeyidir.
- `threeScene` compatibility icin halen mevcuttur ancak yeni engine-level kod `sceneHandle` kullanmalidir.

## Plugin Sistemi

Eski yapida moduller elle baglaniyordu. Yeni model:

```js
engine.use(plugin);
scene.use(plugin);
```

Plugin'ler capability ve dependency bildirebilir.
