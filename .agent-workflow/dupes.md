# `.agent-workflow/dupes` — Find duplicated concepts

Purpose: Enforce "one representation per concept" (open-realm principle).

## Steps

1. **Scan for duplication.** Look for the same concept defined in multiple places:
   - Play mode lists (should use `PlayMode` union from `types.ts`)
   - Stage data (should be in `levels.ts` `STAGES`)
   - Music track IDs (should be `MelodikTrackId` from `music.ts`)
   - Hash/serialization logic (should use `hash.ts`)

2. **Check test duplication.** Same scenario tested in multiple files? Consolidate.

3. **Check constant duplication.** Magic numbers repeated? Extract to named constants.

4. **Report.** List each duplication with file:line and recommended consolidation target.

## Output

A list of duplications and the single source of truth each should point to.
