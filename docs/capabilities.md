# 🛸 ZortEngine Master Documentation

Welcome to the comprehensive guide for ZortEngine, a modular, high-performance 3D engine built for web and mobile.

---

## 🏗️ 1. Core Architecture & Patterns

ZortEngine follows a decoupled, system-oriented architecture that separates **State**, **Logic**, and **Visuals**.

### 🧪 1.1 The Engine Instance
The `Engine` is the central orchestrator. It manages the simulation loop, platform adapters, and global plugin registry.
- **Initialization**: `new Engine(container, options)`
- **The Loop**: Runs a fixed-step simulation (`fixedDelta`) with a variable render step for maximum stability.
- **Global Events**: `engine.events` (EventEmitter) for cross-scene communication.

### 🎬 1.2 Scene Lifecycle
Logic is organized into `GameScene`s. Scenes are isolated containers for objects and systems.
- **Lifecycle Hooks**: `setup()`, `onEnter()`, `onExit()`, `update(delta, time)`.
- **System Context**: Systems registered to a scene gain access to the `engine` and `scene` references automatically.

### ⚙️ 1.3 The System Pattern
Systems are logic-only classes that process GameObjects or handle global mechanics.
- **Registration**: `scene.registerSystem(name, systemInstance)`
- **Communication**: Systems should interact via events or by retrieving other systems through `scene.getSystem(name)`.

### 📦 1.4 GameObject & Components
`GameObject` is the base entity. It provides a `THREE.Group` for visuals and an `update` hook.
- **Visuals**: Attach Three.js meshes/groups to `gameObject.group`.
- **Lifecycle**: `onAddedToScene(scene)`, `onRemovedFromScene(scene)`.
- **Object Pooling**: Use `ObjectPool` for high-frequency entities (bullets, particles) to avoid GC pressure.

---

## 🔌 2. Extending the Engine (Plugins & Adapters)

### 🧩 2.1 Plugin System
Plugins allow you to add new capabilities to the Engine or specific Scenes.
- **Manifest**: Requires `id`, `scope` ('engine' or 'scene'), and optional `dependencies`.
- **Capabilities**: Plugins can declare `capabilities` (e.g., 'rendered', 'physics') that other systems can check for.
```javascript
engine.use({
    manifest: { id: 'my-plugin', capabilities: ['cool-logic'] },
    install: (context) => { /* logic */ }
});
```

### 🌉 2.2 Adapters (Infrastructure)
Adapters bridge the core logic to specific platforms or libraries.
- **Renderer**: `ThreeRendererAdapter` (Three.js integration).
- **Platform**: `BrowserPlatform` (DOM/Window) vs `RNPlatform` (React Native).
- **Physics**: `PhysicsManager` (Oimo/Ammo wrapping).
- **Audio**: `AudioManager` (Web Audio / Positional Sound).
- **Input**: `InputManager` (Keyboard, Mouse, Gamepad, Touch).

---

## 📦 3. Asset Pipeline & Loading

The `AssetStore` manages resources with a **Retain/Release** (Reference Counting) model to prevent memory leaks.

- **Loading**: `engine.assets.load(definition, { owner })`
- **Reference Counting**: Multiple owners (e.g., separate scenes) can retain the same asset. It is only disposed when the last owner releases it.
- **Asset Definitions**: Simple JS objects containing `id`, `url`, and `type` (e.g., 'gltf', 'texture').
- **Automatic Cleanup**: Scenes automatically release their owned assets on `dispose()`.

---

## 🛠️ 4. Official Game Kits (Logic Library)

### 🏃 4.1 Combat & Abilities
- **AbilitySystem**: Registry and cooldown manager for actor abilities.
- **WaveSystem**: Data-driven enemy wave generation and difficulty scaling.
- **CombatDirector**: Coordinates damage, hazards, and tactical AI pacing.
- **Targeting**: Optimized utilities for spatial target acquisition (Nearest, ConeView).
- **DamageSystem**: Centralized health, damage, and death handling.
- **ProjectileSystem**: High-performance pooled projectile management.

### 🗨️ 4.2 Interaction & UI
- **InteractionSystem**: Proximity-based object interaction triggers.
- **DialogueSystem**: Logic for branching nested conversations.
- **DialogueUI**: High-quality pixel-art UI for dialogues and choices.
- **CursorManager**: Smart cursor that adapts to TPS/Isometric modes.

### 🌍 4.3 Atmospheric & Visual
- **WeatherSystem**: Dynamic time-of-day, sky colors, and weather states.
- **PortalMesh**: Animated environment portals (Dungeon, Hub, World presets).
- **BannerPlane**: Animated sky-based messaging/banner system.
- **ParticleManager**: Easy-to-use GPU-accelerated particle effects.

### 💾 4.4 Progression & Persistence
- **ProgressionSystem**: Handles persistent player stats, unlocks, and meta-data.
- **SaveManager**: Serialization wrapper for LocalStorage/SessionStorage.

---

## 📡 5. Advanced Features

### 📼 5.1 Snapshots & Replays
ZortEngine supports deterministic state snapshotting.
- **Capture**: `engine.snapshot()` returns a serializable state of the active scene.
- **Restore**: `engine.restoreSnapshot(data)` rolls back the entire game state.
- **ReplayRecorder**: Records input commands frame-by-frame for perfect deterministic replays.

### 🏠 5.2 Multi-Platform (Mobile Ready)
- **React Native Adapter**: Specific renderer and input bridge for mobile.
- **GameBridge**: Bi-directional communication between JS Engine and Native UI.

### 🕵️ 5.3 Tooling
- **InspectorRegistry**: Central hook for dev-tools for inspecting systems, objects, and performance.
