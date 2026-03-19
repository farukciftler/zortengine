# Plugin Guide

The `ZortEngine` plugin model is divided into two host levels:

- `engine` plugins: global capability, tooling, networking, analytics, adapter coordination
- `scene` plugins: scene-local behaviors, HUD, encounter orchestration, feature packs

## Manifest

Each plugin carries a `manifest` in the following structure:

```js
{
  id: 'plugin-id',
  scope: 'engine',
  version: '1.0.0',
  capabilities: ['render:postprocess'],
  dependencies: ['core-render']
}
```

## Installation

```js
engine.use({
  manifest: {
    id: 'telemetry',
    scope: 'engine',
    capabilities: ['telemetry']
  },
  install(context, options) {
    return {
      send(eventName, payload) {
        options.transport?.send?.({ eventName, payload });
      },
      enabled: context.hasCapability('telemetry')
    };
  }
});
```

## Rules

- `manifest.id` is mandatory.
- `manifest.scope` determines which host the plugin can be installed on.
- `dependencies` request previously installed plugin APIs.
- Capabilities are collected on the host; scene plugins can see engine capabilities.
- If the same plugin is installed on the same host for a second time, the existing API is returned.

## Design Notes

- Core plugins should not know about the renderer implementation.
- Renderer plugins should declare themselves with capabilities: `render:*`, `asset:*`, `audio:*`.
- Gameplay kits should be installed with `scene.use(plugin)` and be usable independently of the `examples/` layer.
Refactoring: scene plugins no longer need to know engine internals, only capabilities.

