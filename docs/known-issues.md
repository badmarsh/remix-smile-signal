# Known Issues — Service Incident Arc (Stage 7)

## Documented Edge Cases

### 1. Timed arena timer=0 exactly at exit tile (FIXED)
**Symptom**: If the player reaches the exit tile 'E' in the same frame the countdown reaches 0, both the defeat beat (gameover) and exit transition could fire.

**Fix**: Exit detection now clears `defeatBeatTimer` before transitioning to `relay_repair`, so reaching the exit always takes priority over timer expiry.

**Location**: `src/game/engine.ts` — timed arena exit detection block.

---

### 2. Relay sync indicator flickering (not a bug)
**Behavior**: `relaySyncCoverage()` returns 0 (none covered), 0.5 (one covered), or 1 (both covered / solved). Once `relaySolved` is true, coverage is permanently 1. No flickering occurs during rapid endpoint bouncing because the value is state-driven, not frame-driven.

---

### 3. Hub destroyed mid-wave animation
**Behavior**: When `hubHp` reaches 0, `defeatBeatTimer` is armed (0.55s) leading to gameover. Enemies touching the hub are immediately set to 'ko' state, so multiple enemies on the hub in the same frame each reduce `hubHp` by 1. This is intentional — hub damage is not invulnerability-gated.

---

### 4. Wave defense entering with all waves already cleared
**Behavior**: If `currentWave >= totalWaves` when entering `wave_defense` (e.g., via relay auto-advance), the top-level victory check fires immediately if `hubHp > 0`. This is intentional — completing relay with all waves pre-cleared is a valid victory path.

---

### 5. Particle pool wrap-around during boss fragment AoE
**Behavior**: The particle pool (128) uses circular buffer wrap-around via `particleCursor % PARTICLE_POOL_SIZE`. During wave_defense boss fragment spawn + AoE bursts, old particles may be reused before fading out. This is by design and matches the existing engine pattern.

---

### 6. Pre-existing: Math.random() in audio.ts (browser-only)
**Location**: `src/game/audio.ts:236` — `Math.random()` used for sound effect jitter.

**Note**: This is browser-only audio jitter, NOT in the deterministic game simulation (`engine.ts`, `music.ts`, `levels.ts`). The engine remains deterministic with zero `Math.random()`.

---

## Out of Scope for Current Merge

- Manual playthrough video recordings (1P / 2P co-op) — pending screen capture capability.
- Performance profiling of stepWorld across modes — confirmed deterministic via 3x identical replay test.
