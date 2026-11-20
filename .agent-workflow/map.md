# `.agent-workflow/map` — Project map

Purpose: Provide a current map of the codebase for context.

## Contents

- **Entry point:** `src/App.tsx`
- **Simulation:** `src/game/engine.ts` (`stepWorld`, `loadStage`, `createWorld`, `getHudSnapshot`)
- **Types:** `src/game/types.ts` (`GameWorld`, `HudSnapshot`, `PlayMode`, `InputState`, `StageDefinition`)
- **Levels:** `src/game/levels.ts` (`STAGES`, `MAP_STAGE_7`, tile helpers)
- **Music:** `src/game/music.ts` (`MELODIK_TRACKS`, `selectTrackForStage`, `selectTrackForMode`, `selectTitleTrack`)
- **Hashing:** `src/game/hash.ts` (`simStateHash`, `simStateString`, `cloneWorld`)
- **Rendering:** `src/game/renderer.ts`
- **Audio:** `src/game/audio.ts`
- **Citizens:** `src/game/citizens.ts`
- **Progress:** `src/game/progress.ts`
- **Components:** `src/components/` (GameHud, etc.)
- **Data:** `src/data/` (dedication, signatures)
- **Didaktik:** `src/didaktik/` (TAP/WAV/SCR/UDG generators)
- **Tests:** `src/game/**/*.test.ts`, `src/game/modes/*.test.ts`, `src/game/integration/*.test.ts`
- **Docs:** `docs/` (service-incident-arc-design, balance, known-issues, research ×3)
- **Rules:** `AGENTS.md`, `ARCHITECTURE.md`, `DESIGN_RULES.md`, `.agent-workflow/`

## Key Constraints

- `stepWorld(world, dtSec, input)` contract must be preserved.
- Zero DOM in `engine.ts`/`music.ts`.
- `npm test` must pass 0 failed.
- Only 3 pre-existing `App.tsx:576` TS errors may remain.
