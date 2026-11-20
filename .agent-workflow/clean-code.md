# `.agent-workflow/clean-code` — Refactor for clarity

Purpose: Improve code structure without changing behaviour.

## Steps

1. **Identify target.** Pick a function, module, or file with duplication, unclear naming, or layer violations.

2. **Characterization tests first.** Ensure existing tests cover the current behaviour. If not, add tests before refactoring.

3. **Refactor in small steps.** Rename, extract, move — one change at a time. Run `npm test` after each step.

4. **Verify no behaviour change.** All existing tests must still pass. `simStateHash` output must be unchanged for identical inputs.

5. **Check design rules.** Confirm `DESIGN_RULES.md` compliance: zero DOM in sim, no unseeded randomness, stepWorld sole authority.

## Constraints

- No behaviour change — refactoring only.
- `npm test` must pass 0 failed.
- `npx tsc --noEmit` no new errors.
