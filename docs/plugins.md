# Plugin Rehberi

`ZortEngine` plugin modeli iki host seviyesine ayrilir:

- `engine` plugin'leri: global capability, tooling, networking, analytics, adapter koordinasyonu
- `scene` plugin'leri: scene-local davranislar, HUD, encounter orchestration, feature pack'ler

## Manifest

Her plugin su yapida bir `manifest` tasir:

```js
{
  id: 'plugin-id',
  scope: 'engine',
  version: '1.0.0',
  capabilities: ['render:postprocess'],
  dependencies: ['core-render']
}
```

## Kurulum

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

## Kurallar

- `manifest.id` zorunludur.
- `manifest.scope`, plugin'in hangi host'a kurulabilecegini belirler.
- `dependencies`, daha once kurulmus plugin API'lerini talep eder.
- Capability'ler host uzerinde toplanir; scene plugin'i engine capability'lerini gorebilir.
- Ayni plugin ayni host'a ikinci kez kurulursa mevcut API geri doner.

## Tasarim Notlari

- Core plugin'ler renderer implementasyonu bilmemelidir.
- Renderer plugin'leri capability ile kendini ilan etmelidir: `render:*`, `asset:*`, `audio:*`.
- Gameplay kit'leri `scene.use(plugin)` ile install edilip `examples/` katmanindan bagimsiz kullanilabilmelidir.
