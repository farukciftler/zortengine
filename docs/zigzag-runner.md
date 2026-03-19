# Zigzag Runner — Architecture and Documentation

Endless zigzag runner example. Shows engine usage with path-based curved roads, lane switching, jumping, and procedural spawning.

## Game Summary

- **Genre**: Endless zigzag runner
- **View**: 2.5D / isometric, single-lane forward movement
- **Mechanics**: Left/right lane switching, jumping, avoiding obstacles, collecting collectibles
- **Progression**: Distance, score, checkpoints, speed increase

## Folder Structure

```
examples/zigzag-runner/
├── app/
│   ├── index.html          # Entry page, importmap
│   ├── main.js             # Bootstrap, URL params
│   └── ZigzagGame.js       # Engine derivative, scene flow
│
├── scenes/
│   ├── MenuScene.js        # Main menu (play, score)
│   └── RunScene.js         # Main game scene
│
├── runtime/
│   ├── ZigzagBootstrap.js       # System registrations (physics, input, camera)
│   ├── ZigzagState.js           # Run state (score, distance, lane, speed)
│   ├── ZigzagFlowController.js  # Starting, game over, restart
│   ├── ZigzagCheckpointController.js  # Checkpoint save/restore
│   ├── ZigzagHudPresenter.js    # HUD updates
│   └── PathGenerator.js         # Curved path generation
│
├── actors/
│   ├── PlayerActor.js      # Player (lane, jumping, collision)
│   ├── ObstacleActor.js    # Obstacle (static, collision)
│   └── CollectibleActor.js # Collectible
│
├── systems/
│   ├── LaneSystem.js       # Lane switching logic (A/D)
│   ├── SpawnSystem.js      # Obstacle/collectible spawn (procedural)
│   └── CollisionSystem.js  # Player–obstacle/collectible collision
│
├── data/
│   ├── LaneDefinitions.js      # Lane count, positions
│   ├── ObstacleDefinitions.js  # Obstacle types, spawn weights
│   ├── CollectibleDefinitions.js
│   └── TrackConfig.js          # Speed, spawn interval, difficulty
│
├── ui/
│   └── ZigzagHud.js        # Score, distance, health, pause overlay
│
├── README.md
└── PLAN.md                 # Detailed plan
```

## Engine Usage

### ZigzagGame (Engine derivative)

```js
export class ZigzagGame extends Engine {
    constructor(options = {}) {
        super(document.body, { seed: options.seed });
        this.menuScene = new MenuScene();
        this.menuScene.on('requestStartRun', overrides => this.startRun(overrides));
        this.addScene('menu', this.menuScene);
        this.useScene('menu');
        this.start();
    }

    startRun(overrides = {}) {
        const runScene = new RunScene(runOptions);
        runScene.on('requestRestartRun', next => this.startRun(next));
        runScene.on('requestOpenMenu', () => this.useScene('menu'));
        this.addScene('run', runScene);
        this.useScene('run');
    }
}
```

### ZigzagBootstrap — System Registrations

Bootstrap is used within `RunScene.setup()`:

- **PhysicsManager** — Cannon-es, gravity, collision
- **CameraManager** — TPS preset, path follow
- **InputManager** — A/D, Space (jump)
- **UIManager** — HUD container

### RunScene — Main Scene

- `setup()`: Bootstrap, path generator, track ribbon, speed lines, player, systems
- `onUpdate()`: Distance, spawn, collision, track/speed lines update, camera follow
- Systems: LaneSystem, SpawnSystem, CollisionSystem (ordered by priority)

### Path and Track

- **PathGenerator**: Segment-based curved path, `getInfoAtDistance(d)` → `{ position, rotation, tangent, curvature }`
- **Track**: Ribbon mesh, left/right edges along the path
- **Speed lines**: Speed lines parallel to the path
- Pre-rendering: ~220m of road and obstacles are pre-created, deleted after passing

### Spawn System

- **SPAWN_DISTANCE_AHEAD**: 100m — spawn distance ahead of the player
- **Prefill**: The 0–100m range is filled with obstacles at the start of the game
- **Deletion**: Objects behind are removed with `pathDistance < playerDistance - 15`

## Engine Dependencies

| Usage | Source |
|----------|--------|
| Engine, GameScene | zortengine |
| PhysicsManager | zortengine/physics |
| InputManager, UIManager, CameraManager | zortengine/browser |
| SaveManager | zortengine/persistence |

## Flow Summary

1. **Start**: ZigzagGame → MenuScene
2. **Play**: requestStartRun → Create RunScene, useScene('run')
3. **RunScene.setup()**: Bootstrap, state, flow, checkpoint, path, track, spawn, collision
4. **Game loop**: Distance increase, speed ramp, spawn, lane input, collision check
5. **Game over**: FlowController → pause, HUD game over, restart/menu
6. **Checkpoint**: Automatic saves at certain distances

## Test

```bash
npm test
```

`tests/examples/zigzag-smoke.test.js` runs zigzag-runner headlessly and verifies the basic flow.

