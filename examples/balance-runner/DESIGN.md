# ⚖️ Balance Runner Design Document

## Concept
A physics-based runner where you balance a platform on a single pivot point.

## Core Loop
1. **Balance**: Keep the platform horizontal.
2. **Move**: Forward momentum adds speed.
3. **Correct**: Push/pull falling blocks to redistribute mass.
4. **Survive**: Don't let the tilt slide everything off (Critical Angle > 20°).

## Technical Architecture (ZortEngine)
- **Scene**: `BalanceScene`
- **Logic**: 
  - `BalanceSystem`: Physics & Torque calculation.
  - `SpawnerSystem`: Block generation & Difficulty.
  - `InteractionSystem`: Player/Block collision & grabbing.
- **Visuals**: Neon-grid aesthetic, dynamic emissive materials based on tilt/mass.

## Next Steps
1. Initialize the example folder structure.
2. Implement the `BalanceSystem` for torque-based rotation.
3. Integrate standard character controls.
