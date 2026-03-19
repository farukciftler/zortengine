# Package Stability

| Entrypoint | Status | Note |
| --- | --- | --- |
| `zortengine` | Stable | Core runtime primitives |
| `zortengine/assets` | Stable | Generic asset/store/pipeline surface |
| `zortengine/browser` | Stable | Browser-only API |
| `zortengine/audio` | Stable | First-party audio adapter |
| `zortengine/render` | Stable | First-party Three renderer and render asset adapters |
| `zortengine/physics` | Stable | Physics adapter facade |
| `zortengine/devtools` | Stable | Tooling and inspector utilities |
| `zortengine/networking` | Stable | Networking transport/system surface |
| `zortengine/gameplay` | Provisional | Naming is new; actor facade is a candidate for stability |
| `zortengine/objects` | Deprecated | Alias for `gameplay`, do not use in new code |

## SemVer Policy Summary

- Breaking changes in stable entrypoints are only made with major releases.
- Provisional surfaces may receive name or package boundary changes in minor releases.
- Deprecated surfaces may be removed with a warning before the next major release.

