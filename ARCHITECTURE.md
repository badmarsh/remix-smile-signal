# ARCHITECTURE.md — Zúbok a signálik / Didaktik M

Single source of truth for system architecture. Follows the
[open-realm](https://github.com/corepunch/open-realm/blob/main/AGENTS.md)
principle: one representation per concept, docs/ as index.

## Layering (strict, enforced in CI)

```
Presentation Layer  (React, DOM, Web Audio, renderer.ts)
        ↓ reads only
HudSnapshot Layer   (getHudSnapshot — read-only projection, no mutation)
        ↓ proposes
Input Layer         (InputState — pure data, no side effects)
        ↓ sole authority
Simulation Layer    (engine.ts: stepWorld — mutates GameWorld, zero DOM)
        ↓ reads config
Config Layer        (levels.ts: STAGES, music.ts: MELODIK_TRACKS, types.ts)
```

### Rule: The Simulation is the sole state authority

- `stepWorld(world, dtSec, input)` is the **only** function that mutates `GameWorld`.
- Agents (or any external actor) may only propose an `InputState`; they never mutate world fields directly.
- `HudSnapshot` is a read-only projection: `getHudSnapshot(world)` returns a fresh object, never a reference to internal state.
- No DOM, `window`, `document`, `localStorage`, `performance.now`, `Date`, or `Math.random()` in `engine.ts`, `music.ts`, or `levels.ts`.
- All RNG (if ever needed) is seeded from stage grid or config.

### Rule: Sim / Input / Presentation separation

| Concern | Files | Allowed to |
|---------|-------|------------|
| Simulation | `src/game/engine.ts` | Mutate `GameWorld`, read `InputState` |
| Input | `src/game/types.ts` (`InputState`) | Pure data only |
| Presentation | `src/game/renderer.ts`, `src/components/*`, `src/game/audio.ts` | Read `HudSnapshot` / `GameWorld` (read-only), touch DOM |

Crossing layers is one-way: Presentation → Input → Simulation → HudSnapshot → Presentation.

## Modules

| Module | Responsibility |
|--------|---------------|
| `src/game/engine.ts` | Pure simulation: `stepWorld`, `loadStage`, `createWorld`, `getHudSnapshot`, helpers (`isExitTile`, `zoneAt`, `relaySyncCoverage`, `triggerPartnerBlast`) |
| `src/game/hash.ts` | Deterministic state fingerprinting: `simStateHash`, `simStateString`, `cloneWorld` (counterfactual forking) |
| `src/game/levels.ts` | Stage definitions: `STAGES`, `MAP_STAGE_7`, tile constants, `edgeSpawnTiles` |
| `src/game/types.ts` | `GameWorld`, `HudSnapshot`, `PlayMode`, `InputState`, `StageDefinition`, etc. |
| `src/game/music.ts` | Melodik track data: `MELODIK_TRACKS`, `selectTrackForStage`, `selectTrackForMode`, `selectTitleTrack` |
| `src/game/audio.ts` | Browser audio bridge: consumes `audioQueue`, plays beeper/melodik |
| `src/game/renderer.ts` | Canvas/React rendering from `HudSnapshot` |
| `src/game/citizens.ts` | Citizen speech state |
| `src/game/progress.ts` | Checkpoint, Rado POKE mode, stage loss tracking |
| `src/App.tsx` | React root: game loop, input handling, HUD wiring |
| `src/didaktik/` | ZX Spectrum TAP/WAV/SCR/UDG generators |

## Play Modes (`PlayMode`)

| Mode | Purpose | Music |
|------|---------|-------|
| `normal` | Classic stage progression | `selectTrackForStage` |
| `deploy_select` | Stage 7: pick zone 1-4 | `microdent` |
| `timed_arena` | Stage 7: reach exit before timer | `microdent` |
| `relay_repair` | Stage 7: restore both fiber endpoints | `rimava` |
| `wave_defense` | Stage 7: defend hub from waves | `rimava` |

## Data Flow (one frame)

1. React collects keyboard input → `InputState`
2. `stepWorld(world, dtSec, input)` mutates `GameWorld` (simulation)
3. `getHudSnapshot(world)` projects `GameWorld` → `HudSnapshot` (read-only)
4. React renders `HudSnapshot` to DOM; `audio.ts` drains `audioQueue`

## Determinism Guarantees

- `stepWorld` is deterministic: same `(world, dtSec, input)` → same `world`.
- `simStateHash(world)` produces identical output for identical sim state.
- `cloneWorld(world)` enables counterfactual forking: fork at step k, mutate, resume.
- Tests run under `node:test` in Node.js — no browser, no DOM.

## Hard Limits (Didaktik M target)

- Resolution: 256 × 192 px (+12 px border)
- Palette: 15 ZX ULA colours (8 normal + 7 bright)
- Attribute clash: max 2 colours per 8×8 tile
- Sound: 1-bit Beeper + AY-3-8912 Melodik (3 channels)
- TAP block: max 65535 B, XOR checksum, standard pilot
- WAV: 44100 Hz, 16-bit PCM mono, zx35 profile (3.5 MHz)
