# `.agent-workflow/review` — Three-pass review

Purpose: Review a PR or change for integration/simplicity/correctness.
Adapted from PrjctUp/agent-workflow three-pass review.

## Pass 1: Integration

- Does the change fit `ARCHITECTURE.md` layering? (Presentation → Input → Simulation → HudSnapshot → Presentation)
- Is `stepWorld` still the sole state authority?
- Are new `GameWorld`/`HudSnapshot` fields additive with safe defaults?
- Does it preserve 1P/2P co-op contracts?
- Is `PlayMode` union exhaustive where needed?

## Pass 2: Simplicity

- Is the change the smallest possible to satisfy the requirement?
- Any duplicated concepts? (One representation per concept per `DESIGN_RULES.md`)
- Any unnecessary dependencies added?
- Are test assertions specific and deterministic?

## Pass 3: Correctness

- `npm test`: 0 failed.
- `npx tsc --noEmit`: only 3 pre-existing `App.tsx:576` errors.
- Determinism: `simStateHash` stable across identical runs; `cloneWorld` hash matches before divergence.
- Zero DOM in `engine.ts`/`music.ts`/`levels.ts`.
- No `Math.random()` in sim layer.

## Output

Return: PASS / PASS WITH COMMENTS / FAIL, with a list of required changes if any.
