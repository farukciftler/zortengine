// Core
export { BrowserPlatform } from './core/BrowserPlatform.js';
export { Engine } from './core/Engine.js';
export { GameScene } from './core/GameScene.js';
export { SceneManager } from './core/SceneManager.js';
export { SystemManager } from './core/SystemManager.js';

// Objects
export { CollectibleActor } from './objects/CollectibleActor.js';
export { Component } from './objects/Component.js';
export { ObjectiveZoneActor } from './objects/ObjectiveZoneActor.js';
export { GameObject } from './objects/GameObject.js';
export { HealthComponent } from './objects/HealthComponent.js';
export { ModularCharacter } from './objects/ModularCharacter.js';
export { Enemy } from './objects/Enemy.js';

// Systems
export { AudioManager } from './systems/AudioManager.js';
export { AbilitySystem } from './systems/AbilitySystem.js';
export { CameraManager } from './systems/CameraManager.js';
export { CollectibleSystem } from './systems/CollectibleSystem.js';
export { DamageSystem } from './systems/DamageSystem.js';
export { EncounterDirector } from './systems/EncounterDirector.js';
export { InputManager } from './systems/InputManager.js';
export { ObjectiveZoneSystem } from './systems/ObjectiveZoneSystem.js';
export { ParticleManager } from './systems/ParticleManager.js';
export { PhysicsManager } from './systems/PhysicsManager.js';
export { PostProcessManager } from './systems/PostProcessManager.js';
export { ProjectileSystem } from './systems/ProjectileSystem.js';
export { SpawnSystem } from './systems/SpawnSystem.js';
export { UIManager } from './systems/UIManager.js';

// Utils
export { AnimationManager } from './utils/AnimationManager.js';
export { AssetLoader } from './utils/AssetLoader.js';
export { EventEmitter } from './utils/EventEmitter.js';
export { LevelParser } from './utils/LevelParser.js';
export { MemoryCleaner } from './utils/MemoryCleaner.js';
export { ObjectPool } from './utils/ObjectPool.js';
export { StateMachine } from './utils/StateMachine.js';