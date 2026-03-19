# Example Applications Guide

ZortEngine comes with two example games. Each showcases different engine features.

## Comparison

| Feature | run-showcase | zigzag-runner |
|---------|--------------|---------------|
| **Type** | Multiplayer lobby, combat | Endless zigzag runner |
| **Networking** | Yes (WebSocket lobby) | No |
| **Combat** | Yes | No |
| **Lane movement** | No | Yes |
| **Procedural spawn** | Partial | Full (path-based) |
| **Checkpoint / Save** | Yes | Yes |
| **Complexity** | High | Low |
| **Learning curve** | Medium–high | Low |

## run-showcase

Multiplayer lobby, rooms, combat and meta progression demo.

### Running

1. **Lobby server** (separate terminal):
   ```bash
   npm run network
   ```
   The server listens on `ws://localhost:2567`.

2. **Web server**:
   ```bash
   npm run serve
   # or: python3 -m http.server 3000
   ```

3. In browser: **http://localhost:3000/examples/run-showcase/app/**

### Important Files

- `app/MyGame.js` — Engine extend, scene flow
- `scenes/MainMenuScene.js` — Lobby UI, room list
- `scenes/RunScene.js` — Combat, replication
- `server/lobby/network-server.js` — WebSocket lobby server

### Related Documentation

- [adapters.md](adapters.md) — Renderer, input
- [plugins.md](plugins.md) — Plugin usage

---

## zigzag-runner

Endless zigzag runner: switch lanes, avoid obstacles, collect collectibles.

### Running

**Important:** Start the server from the project root (`zortengine/`).

```bash
# From project root
cd /path/to/zortengine

# Python (usually most seamless)
python3 -m http.server 3000

# or Node serve
npm run serve
```

In browser: **http://localhost:3000/examples/zigzag-runner/app/**

### Controls

- **Left/Right**: A / D or arrow keys
- **Jump**: Space
- **Play Again**: Button when the game is over

### Detailed Documentation

→ [zigzag-runner.md](zigzag-runner.md) — Architecture, folder structure, engine usage

