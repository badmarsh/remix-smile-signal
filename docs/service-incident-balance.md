# Service Incident Arc — Balance Tuning Reference

**Zúbok a signálik — Didaktik M Christmas Edition**
Stage 7: Servisný úraz (Rimavská Sobota)

All values are deterministic — no `Math.random()` anywhere. Spawns are seeded from stage grid and config.

---

## Global Mode Defaults

| Parameter | Default | Scope | Notes |
|-----------|---------|-------|-------|
| `playMode` | `'normal'` | GameWorld | Existing stages 0–5 default to `'normal'` |
| `modeTimer` | 0 | GameWorld | Countdown (timed_arena) / spawn accumulator (wave_defense) |
| `currentWave` | 0 | GameWorld | 1-based active wave (wave_defense) |
| `enemiesToSpawn` | 0 | GameWorld | Enemies left to spawn in current wave |
| `spawnAccumulator` | 0 | GameWorld | Time since last enemy spawn (sec) |
| `partnerChargeProgress` | 0 | GameWorld | 0..1 charge ratio (timed_arena / relay_repair) |
| `selectedZone` | 0 | GameWorld | 0..3 cursor zone index (deploy_select) |
| `relaySolved` | false | GameWorld | Both fiber endpoints connected (relay_repair) |
| `hubHp` | 3 / 0 | GameWorld | 3 for wave_defense, 0 otherwise |

---

## Phase A — Deploy Select

| Parameter | Value | Notes |
|-----------|-------|-------|
| `startPlayMode` | `'deploy_select'` | Stage 7 boots into zone picker |
| Zone markers | `'1'`–`'4'` | Grid chars; `zoneAt()` maps char to 0-based index |
| Exit tile | `'E'` | Reachable from any direction; advances to timed_arena |

---

## Phase B — Timed Arena

| Parameter | Default | Source | Notes |
|-----------|---------|--------|-------|
| `timeLimitSec` | 90 | `StageDefinition.timeLimitSec` | Countdown in seconds |
| `partnerChargeConfig.chargeDuration` | 1.5s | `StageDefinition.partnerChargeConfig` | Seconds to fill 0→1 charge |
| `partnerChargeConfig.radius` | 48px | `StageDefinition.partnerChargeConfig` | AoE blast radius |
| `partnerChargeConfig.damageMultiplier` | 2 | `StageDefinition.partnerChargeConfig` | Reserved for future damage scaling |
| Charge threshold (release blast) | 0.5 (50%) | hardcoded | Release at ≥50% triggers AoE bubble blast |
| Charge clamp max | 1.0 (100%) | hardcoded | No overcharge |
| Charge reset | on release / at exit | hardcoded | Resets to 0 when fire released or exit reached |

---

## Phase C — Relay Repair

| Parameter | Value | Notes |
|-----------|-------|-------|
| Fiber endpoints | 2 per stage | `targets` with `kind: 'fiber'` |
| Solo solvability | Yes | One player touches both endpoints sequentially |
| 2P co-op sync | Each player covers one endpoint | `relaySyncCoverage()` returns 0 / 0.5 / 1 |
| Auto-advance | relay_solved → wave_defense | Both endpoints restored triggers transition |
| Hub integrity | 3 hits | Set on mode switch to wave_defense |

---

## Phase D — Wave Defense

| Wave | Composition | `spawnTimer` (sec) | Description |
|------|-------------|--------------------|-------------|
| 1 | 3× patroller | 2.0 | First outages |
| 2 | 2× patroller + 1× charger | 1.8 | Communication failure |
| 3 | 2× kiter + 2× patroller | 1.5 | Network disruption |
| 4 | 3× charger + 1× kiter | 1.2 | Massive attack |
| 5 | Boss fragment (1 weak spot) | 1.0 | Final anomaly strike |

| Parameter | Default | Source | Notes |
|-----------|---------|--------|-------|
| `totalWaves` | 5 | `StageDefinition.totalWaves ?? waves.length` | Total wave count |
| `hubHp` | 3 | hardcoded in `loadStage()` | Central hub takes 3 hits before falling |
| Boss fragment `maxHp` | 1 | `spawnBossFragment()` | vs Stage 6 boss maxHp 3 |
| Boss fragment weak spots | 1 | `spawnBossFragment()` | vs Stage 6 weak spots 4 |
| Enemy HP (patroller/kiter) | 1 | `spawnWaveEnemy()` | |
| Enemy HP (charger) | 2 | `spawnWaveEnemy()` | |
| Edge spawn tiles | Deterministic | `edgeSpawnTiles()` | Border floor tiles, no walls |

---

## Future Tuning TODOs

- **Particle pool (128)**: May need tuning during wave_defense boss fragment AoE bursts — monitor `particleCursor` wrap-around under heavy particle load.
- **Afterimage pool (16)**: Sufficient for current dash usage; review if wave_defense adds more dash-heavy patterns.
- **Charge blast radius (48px)**: Tunable via `partnerChargeConfig.radius` per stage.
- **HubHp (3)**: Consider making configurable via `StageDefinition` if future stages need different hub durability.
