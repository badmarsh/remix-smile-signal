# `.agent-workflow/do` — Implement a single task

Purpose: Implement one well-scoped task, test-first, with all gates green.

## Steps

1. **Read the spec.** Check `docs/service-incident-arc-design.md`, `ARCHITECTURE.md`, `DESIGN_RULES.md`, and `AGENTS.md` for relevant constraints.

2. **Write the test first.** Add a `.test.ts` under `src/game/` (or appropriate subdir). It must fail before the implementation exists.

3. **Implement.** Make the smallest change to pass the test. Preserve `stepWorld(world, dtSec, input)` contract. Zero DOM in `engine.ts`/`music.ts`. No `Math.random()`.

4. **Run tests.** `npm test` must report 0 failed. Run `npx tsc --noEmit` — only the 3 pre-existing `App.tsx:576` errors may remain.

5. **Commit.** One logical commit per task. Follow the commit convention: `feat:`, `fix:`, `docs:`, `test:`.

## Constraints

- Determinism: same inputs → same `simStateHash`.
- `npm test` must pass 0 failed after every change.
- Do not address the 3 pre-existing `App.tsx:576` TS errors.
- Windows-safe: avoid `&` in npm scripts.
