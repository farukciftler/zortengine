# Adapter Rehberi

V2 tabaninda engine ile concrete platformlar arasindaki ana sinir `adapter` katmanidir.

## Katmanlar

- `src/engine/`: lifecycle, orchestration, plugin host, snapshot, asset ownership
- `src/adapters/browser/`: input, UI, camera, browser platform
- `src/adapters/render/`: `ThreeRendererAdapter`, particle, post-process, `ThreeAssetLoader`
- `src/adapters/audio/`: `AudioManager`
- `src/adapters/physics/`: physics binding'leri

## Renderer Contract

Bir renderer adapter asgari olarak su yuzeyi saglamalidir:

- `mount({ container, platform })`
- `createSceneHandle({ background, nativeScene })`
- `render({ scene, camera, postProcessor })`
- `resize(width, height)`
- `dispose()`

`ThreeRendererAdapter`, `THREE.WebGLRenderer` olusturur ama bu concrete tip artik `Engine` tarafinda dogrudan yaratilmamaktadir.

## Scene Handle

`GameScene` artik `threeScene` alanina ek olarak su generic yuzeyi sunar:

- `getSceneHandle()`
- `getRenderScene()`

Bu sayede renderer-aware kod `getRenderScene()` ile concrete native scene'e, engine kodu ise `sceneHandle` ile generic boundary'ye oturur.

## Asset Loader Siniri

`AssetLoader` artik generic capability dispatcher'dir. `THREE.TextureLoader`, `AudioLoader`, `GLTFLoader` bilgisi `ThreeAssetLoader` icine tasinmistir.

Yeni adapter yazarken:

1. `AssetLoader` turevi olusturun.
2. `registerCapability(type, { load, dispose })` ile type bazli loader'lari kaydedin.
3. `AssetStore` ile ownership ve dispose akisina entegre edin.
