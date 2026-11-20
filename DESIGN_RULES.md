# DESIGN_RULES.md — Zúbok a signálik

Hard rules for all code changes. These are CI-enforced where possible.
Derived from AI-agent game-dev research (khovax, bastion-heroes, red-frontier,
frontfall, achivx, WebGameTemplateForAgents).

## 1. Zero DOM in the simulation layer

`engine.ts`, `music.ts`, `levels.ts`, `hash.ts` must contain no references to
`window`, `document`, `localStorage`, `performance`, `navigator`, `HTMLElement`,
`Event`, `addEventListener`, `requestAnimationFrame`, or `setTimeout`/`setInterval`.

They must run deterministically under `node:test` in Node.js.

## 2. No unseeded randomness

No `Math.random()`, `Date.now()`, `performance.now()`, or `crypto.getRandomValues()`
in `engine.ts`, `music.ts`, or `levels.ts`. Any randomness must be seeded from
the stage grid or config and passed in explicitly.

## 3. stepWorld is the sole state authority

Only `stepWorld(world, dtSec, input)` may mutate `GameWorld`. Agents and
external actors propose `InputState` only. `HudSnapshot` is read-only.

## 4. Integers only where possible

Grid coordinates, tile indices, entity ids, wave counts, target counts, and
score/health values are integers. Sub-pixel movement (`x`, `y`, `vx`, `vy`,
timers) uses fixed `dtSec` steps clamped to 0.05 max.

## 5. Deterministic serialization

`simStateString(world)` serializes gameplay-relevant state in a fixed key
order with arrays sorted by `id`. Presentation-only fields (particles,
snowflakes, afterimages, chronicle, border flash, trauma, hitstop, audio
queue, citizen speech) are excluded.

## 6. Golden replay testing

Every new `PlayMode` must have tests that:
- Run the same inputs twice and assert identical `simStateHash`.
- Run different inputs and assert different hashes.
- Exercise at least three scenarios: idle / mid-play / completion.

## 7. Counterfactual forking support

`cloneWorld(world)` must produce a byte-identical sim-state hash to the
original before divergence. Forking at step k, mutating one variable, and
resuming from k+1 must produce a divergent hash from the golden run.

## 8. Tests first, all green

`npm test` must report 0 failed after every change. New behaviour is
accompanied by new tests before or alongside the implementation.

## 9. One representation per concept

A concept (e.g. "play mode", "stage definition", "melodik track") is defined
in exactly one place. `PlayMode` union lives in `types.ts`; stage data in
`levels.ts`; track data in `music.ts`. No duplication.

## 10. Additive GameWorld/HudSnapshot fields

New fields are additive with safe defaults initialized in `loadStage()` or
`createWorld()`. Existing 1P/2P co-op contracts remain unchanged.

## 11. TypeScript strict

`npx tsc --noEmit` must report no new errors beyond the 3 pre-existing
`App.tsx:576` errors (unrelated, do not address).

## 12. Windows-safe npm quoting

Avoid `&` in npm scripts (Windows quoting fails). Use `npx tsc --noEmit` for
type checks instead of `&&`-chained npm scripts.
