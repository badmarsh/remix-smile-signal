# Service Incident Arc — Stage 7 Design Spec

**Zúbok a signálik — Didaktik M Christmas Edition**
256x192px, ZX ULA 15-colour palette, deterministic Node.js engine.

> New PlayMode union added to `src/game/types.ts`:
> ```ts
> export type PlayMode =
>   | 'normal'
>   | 'deploy_select'
>   | 'timed_arena'
>   | 'relay_repair'
>   | 'wave_defense';
> ```

---

## Phase Overview

### Phase A: Deploy Select (`deploy_select`)
Homage: **Elite** system-map + **Lords of Midnight** troop deployment.

- UI: 4 zones on an overview grid map (zone name, threat level, danger-tier icon).
- Input: Arrow keys move the cursor across zone markers; fire button selects a zone.
- Behaviour: camera zooms into the selected zone's actual tile grid; deterministic selection — no `Math.random()` anywhere.
- HUD: standard HUD visible + zone-info tooltip bottom-centre.

### Phase B: Timed Arena (`timed_arena`)
Homage: **Saboteur!** escape sequences + **R-Type** timed evacuations.

- Goal: traverse a hazard corridor from entry point to exit door within a time limit (default **90s**).
- Hazards: reuse existing UV beams (Stage 1 style) and CBCT rotating beams (Stage 2).
- **Partner charge mechanic:**
  - Hold fire button during traversal → charge meter fills 0 → 1.
  - Release at sufficient charge → AoE blast clears nearby hazards + briefly slows enemies.
  - Charge resets at the exit door; clamped at 100% (no overcharge).
- HUD additions: `[TIME: ##s]` top-centre; charge meter `|===----|` bottom-left.
- Failure: timer = 0 → game-over → checkpoint respawn.
- Success: reach the exit tile before timeout → advance to Phase C.

### Phase C: Relay Repair (`relay_repair`)
Homage: **Bubble Bobble** co-op puzzles + **Dizzy** item-carrying mechanics.

- Goal: join two disconnected fibre-optic cable endpoints.
- **1P mode:** carry the "connector" item between endpoints sequentially.
- **2P co-op:** each player controls one endpoint, coordinating simultaneously.
- Interference: patroller enemies patrol the cable path; bubble-trap required, adding time pressure.
- **Partner assist:** Signálik can hold one endpoint while Zúbok moves the other → solo-solvable.
- HUD: co-op sync indicator `[RELAY: ==--->]` bottom-centre when both positions are correct.
- Completion: both endpoints connected → flash effect, auto-advance to Phase D.

### Phase D: Wave Defense (`wave_defense`)
Homage: **R-Type** survival waves + **Golden Axe** boss-rush pacing.

- Goal: defend the central hub tile against N escalating waves.
- Spawning: enemies spawn from edge tiles at defined intervals (configurable via `waves` array).
- Difficulty: increases per wave — more enemies, faster spawns, mixed archetypes.
- Player inventory: retains relic, attack tokens, charge capability from previous phases.
- HUD: `[WAVE: X/Y]` top-right + attack-token display below it.
- Wave composition (5-wave setup):
  1. 3× patroller → First outages
  2. 2× patroller + 1× charger → Communication failure
  3. 2× kiter + 2× patroller → Network disruption
  4. 3× charger + 1× kiter → Massive attack
  5. Boss fragment (1 weak spot, shorter cycles) → Final anomaly strike
- Boss fragment: scaled-down Stage 6 boss with 1 weak spot (vs 4 in Stage 6), same visual style, simpler AI.
- Completion: all waves defeated + hub intact → victory cutscene + handover dedication lines.

---

## Type Changes

### `types.ts`

**PlayMode union** (new top-level type):
```ts
export type PlayMode =
  | 'normal'
  | 'deploy_select'
  | 'timed_arena'
  | 'relay_repair'
  | 'wave_defense';
```

**StageDefinition** — all optional additive fields:
```ts
interface StageDefinition {
  // ... existing fields ...
  /** Timed arena duration in seconds (Phase B) */
  timeLimitSec?: number;
  /** Wave defence spawn definition per wave (Phase D) */
  waves?: Array<{
    spawnTimer: number;
    enemyComposition: { archetype: EnemyArchetype; count: number }[];
    description: string;
  }>;
  /** Total wave count for wave_defense (defaults to waves.length) */
  totalWaves?: number;
  /** Partner charge tuning for timed_arena (Phase B) */
  partnerChargeConfig?: {
    chargeDuration: number;
    radius: number;
    damageMultiplier: number;
    label: string;
  };
  /** Play mode this stage boots into (Stage 7 defaults to deploy_select) */
  startPlayMode?: PlayMode;
}
```

**GameWorld** — all additive fields, initialized in `loadStage()`:
```ts
interface GameWorld {
  // ... existing fields ...
  playMode: PlayMode;                  // 'normal' default
  modeTimer: number;                   // countdown for timed_arena / spawn accumulator for wave_defense
  currentWave: number;                 // wave_defense: 1-based active wave
  enemiesToSpawn: number;              // wave_defense: enemies left in current wave
  spawnAccumulator: number;            // wave_defense: time since last spawn
  partnerChargeProgress: number;       // timed_arena / relay_repair: 0..1
  selectedZone: number;                // deploy_select: 0..3 cursor zone index
  relaySolved: boolean;                // relay_repair: both endpoints connected
  hubHp: number;                       // wave_defense: hub integrity (death at 0)
}
```

**HudSnapshot** — additive fields:
```ts
interface HudSnapshot {
  // ... existing fields ...
  playMode: PlayMode;
  modeTimer: number;
  timeRemaining?: number;      // timed_arena
  currentWave?: number;        // wave_defense
  totalWaves?: number;         // wave_defense
  partnerChargeRatio?: number; // timed_arena / relay_repair
  relaySyncProgress?: number;  // relay_repair
}
```

**BossState** — additive flag (engine-internal, not exposed in HudSnapshot):
```ts
interface BossState {
  // ... existing fields ...
  fragment?: boolean;          // true for the final-wave boss fragment (1 weak spot)
}
```

---

## Stage 7 Grid Legend (new tile char `'E'`)

| Char | Meaning |
|------|---------|
| `#`  | Solid wall |
| `.`  | Open floor |
| `~`  | Rimava river water (slows player 50%) |
| `D`  | Locked vault door |
| `E`  | **Timed-arena exit door** — reachable from any direction |
| `1`–`4` | Deploy-select zone markers (overview map) |

---

## Implementation Gates

**Gate 0 — Type Foundation** (this document + types + engine init + play-mode tests)
- Add `PlayMode` union, optional `StageDefinition` extensions, additive `GameWorld`/`HudSnapshot` fields.
- `loadStage()` initializes new fields with safe defaults.
- `src/game/play-mode.test.ts` — 3 tests. Target: 52/52.

**Gate 1 — Timed Arena** (`src/game/modes/timed-arena.test.ts`, 4 tests). Target: 56/56.
- Fixed-`dtSec` countdown; exit tile `'E'` detection from any direction.
- Partner charge fill on `fireHeld`, AoE blast release on charged `fireJustPressed`, clamp at 1, reset at exit.
- Timer = 0 → defeat beat → gameover; HUD `[TIME: ##s]` + charge meter.

**Gate 2 — Wave Defense** (`src/game/modes/wave-defense.test.ts`, 5 tests). Target: 61/61.
- Spawn accumulator + deterministic edge-tile spawning (no RNG).
- Per-wave compositions, wave progression, final-wave boss fragment (1 weak spot).
- Hub tile integrity check; HUD `[WAVE: X/Y]` + attack tokens.

**Gate 3 — Relay Repair + Deploy Select** (`src/game/modes/relay-repair.test.ts`, 4 tests). Target: 65/65.
- Connector carry/drop sequence (order-gated endpoint restores).
- Zone picker grid loader for `deploy_select`; cursor over `'1'`–`'4'` markers.
- Co-op sync indicator; partner-assist solo solvability.

**Gate 4 — Integration** (`src/game/integration/arc-flow.test.ts`, 4 tests). Target: 69/69.
- Full flow deploy → timed → relay → wave → victory (deterministic replay).
- 1P ↔ 2P mid-stage toggle.
- Checkpoint reload preserves `playMode`.
- Score accumulation across phases.

**Gate 5 — Audio Wiring** (`src/game/music.ts` + `src/App.tsx`).
- `selectTrackForMode()`: deploy/timed → `microdent`; wave → `rimava`; victory/handover → `vianoce`.
- No audio conflicts between modes; manual verification only.

---

## Critical Constraints

- **ZERO DOM dependencies** in `engine.ts` / `music.ts` — run deterministically in Node.js.
- `stepWorld(world, dtSec, input)` contract preserved exactly.
- After every change: `npm test` 0 failed.
- **No `Math.random()`** anywhere — all randomness seeded from stage grid or config.
- Existing 1P / 2P co-op contracts unchanged.
- Existing sprite system: 8x8 px tiles, 15-colour ULA palette, attribute-clash rules.
- The 3 pre-existing unrelated TS errors in `App.tsx:576` are left untouched.
