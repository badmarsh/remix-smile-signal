# `.agent-workflow/integrate` — Merge a feature branch

Purpose: Integrate completed work into main with full verification.

## Steps

1. **Fetch latest main.** `git fetch origin main`

2. **Rebase or merge** the feature branch onto main. Resolve conflicts locally.

3. **Run the full test suite.** `npm test` must report 0 failed (79+ tests).

4. **Type check.** `npx tsc --noEmit` — only the 3 pre-existing `App.tsx:576` errors.

5. **Run determinism spot-check.** Execute `src/game/hash.test.ts` twice and confirm identical hashes across runs.

6. **Open a PR.** Use `gh pr create`. Describe the gate(s) covered. Request review.

7. **Merge.** `gh pr merge <number> --merge` (or `--squash`/`--rebase` as appropriate). Do not use `--auto`.

## Constraints

- No merge while tests are red.
- One commit per gate (per service-incident-arc process).
- Tag releases after merge: `v1.1.0-service-arc`, `v1.1.1-service-arc`, etc.
