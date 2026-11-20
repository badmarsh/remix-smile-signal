/**
 * Deterministic state hashing for Zúbok a signálik.
 *
 * Provides a fingerprint of the gameplay-relevant simulation state so that
 * golden replay tests can assert bit-exact determinism: same inputs, same
 * hash, every run, in Node.js and in the browser.
 *
 * Zero DOM dependencies. No Math.random. Pure functions over GameWorld.
 *
 * Design notes (from AI-agent game-dev research):
 *  - The sim is the sole state authority (stepWorld). The hash observes it
 *    read-only — it never mutates.
 *  - Ephemeral presentation state (particles, snowflakes, afterimages,
 *    chronicle text/timer, border flash, trauma, hitstop, attract time,
 *    audio queue, citizen speech) is EXCLUDED from the hash. It does not
 *    affect gameplay outcomes and would add noise to golden replays.
 *  - cloneWorld() enables counterfactual forking: fork at step k, mutate one
 *    variable, resume from k+1, and diff hashes against the golden run.
 */

import type { GameWorld } from './types';

/** FNV-1a 32-bit hash of a string, returned as 8-char lowercase hex. */
export function fnv1a32(input: string): string {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 0x01000193) & 0xffffffff; // FNV prime, keep 32 bits
  }
  return h >>> 0 ? (h >>> 0).toString(16).padStart(8, '0') : '00000000';
}

/** Join a list of already-stringified components deterministically. */
function cat(parts: string[]): string {
  return parts.join('|');
}

/** Stringify a single number with fixed precision for stable hashing. */
function num(n: number): string {
  return Number.isFinite(n) ? n.toFixed(6) : 'null';
}

/** Stringify a direction or boolean stably. */
function strOrBool(v: string | boolean | null | undefined): string {
  if (v === null || v === undefined) return 'null';
  return String(v);
}

/** Canonical serialization of a Player — gameplay fields only, fixed key order. */
function serializePlayer(p: NonNullable<GameWorld['player']>): string {
  return cat([
    'P',
    num(p.x), num(p.y), num(p.vx), num(p.vy),
    strOrBool(p.facing),
    String(p.activeHero),
    String(p.hp), String(p.maxHp),
    num(p.invulnTimer), num(p.fireCooldown),
    num(p.dashTimer), num(p.dashCooldown),
    num(p.dashDirX), num(p.dashDirY),
    num(p.partnerX), num(p.partnerY),
    strOrBool(p.partnerFacing),
    num(p.partnerAssistCooldown), num(p.partnerFireCooldown),
    num(p.partnerStepDist), String(p.partnerAnimFrame),
    num(p.stepDist), String(p.animFrame),
    num(p.squashX), num(p.squashY), num(p.hitFlash),
  ]);
}

/** Canonical serialization of an ObjectiveTarget. */
function serializeTarget(t: GameWorld['targets'][number]): string {
  return cat([
    'T', String(t.id), num(t.x), num(t.y), strOrBool(t.kind),
    String(t.restored), num(t.pulsePhase), num(t.restoreAnim),
    String(t.orderIndex ?? ''),
  ]);
}

/** Canonical serialization of an Enemy. */
function serializeEnemy(e: GameWorld['enemies'][number]): string {
  return cat([
    'E', String(e.id), strOrBool(e.archetype), strOrBool(e.act),
    num(e.x), num(e.y), num(e.vx), num(e.vy),
    String(e.hp), String(e.maxHp),
    strOrBool(e.state), num(e.stateTimer),
    num(e.bubbleTimer), strOrBool(e.facing), num(e.hitFlash),
    num(e.koTimer), num(e.orbitAngle),
    num(e.chargeDirX), num(e.chargeDirY), String(e.hasAttackToken),
  ]);
}

/** Canonical serialization of a Projectile. */
function serializeProjectile(pr: GameWorld['projectiles'][number]): string {
  return cat([
    'PR', String(pr.id), String(pr.fromPlayer), strOrBool(pr.kind),
    num(pr.x), num(pr.y), num(pr.vx), num(pr.vy), strOrBool(pr.color),
    num(pr.life), String(pr.active),
  ]);
}

/** Canonical serialization of the Stage Relic. */
function serializeRelic(r: GameWorld['stageRelic']): string {
  return cat([
    'R', String(r.id), num(r.x), num(r.y), strOrBool(r.kind), strOrBool(r.name),
    strOrBool(r.chronicleNote), String(r.collected), num(r.bobPhase),
  ]);
}

/** Canonical serialization of a Bonus Pickup. */
function serializePickup(pk: GameWorld['pickups'][number]): string {
  return cat([
    'PK', String(pk.id), num(pk.x), num(pk.y), strOrBool(pk.kind),
    String(pk.collected), num(pk.bobPhase), String(pk.points),
  ]);
}

/** Canonical serialization of the Stage 6 Boss. */
function serializeBoss(b: GameWorld['boss'] | null): string {
  if (!b) return 'B|null';
  const spots = b.weakSpots
    .map((w) =>
      cat([String(w.id), num(w.offsetX), num(w.offsetY), String(w.hp), String(w.maxHp), String(w.destroyed), num(w.hitFlash)])
    )
    .join(';');
  return cat([
    'B',
    String(b.active), num(b.x), num(b.y), num(b.vx), num(b.vy), String(b.phase),
    String(b.hp), String(b.maxHp), strOrBool(b.state), num(b.stateTimer),
    strOrBool(b.attackKind), num(b.attackAngle),
    num(b.chargeDirX), num(b.chargeDirY), num(b.bubbleTimer), num(b.hitFlash),
    String(b.hasAttackToken), String(b.attackCycleIdx), String(b.fragment ?? ''),
    spots,
  ]);
}

/**
 * Serialize the gameplay-relevant simulation state of a world to a
 * deterministic string, with keys in a fixed order and arrays sorted by id.
 * Excludes ephemeral presentation state (particles, snowflakes, afterimages,
 * chronicle, border flash, trauma, hitstop, attract time, audio queue,
 * citizen speech).
 */
export function simStateString(world: GameWorld): string {
  return cat([
    'WORLD',
    strOrBool(world.phase), String(world.stageIndex),
    num(world.elapsedSec),
    String(world.score), String(world.bestScore), String(world.combo), num(world.comboTimer),
    String(world.damageTaken), String(world.enemiesDefeated),
    strOrBool(world.playMode), num(world.modeTimer),
    String(world.currentWave), String(world.enemiesToSpawn), num(world.spawnAccumulator),
    num(world.partnerChargeProgress), String(world.selectedZone), String(world.relaySolved),
    String(world.hubHp), String(world.plaqueCarried), String(world.doorsOpen),
    serializePlayer(world.player),
    serializeRelic(world.stageRelic),
    world.targets.slice().sort((a, b) => a.id - b.id).map(serializeTarget).join(';'),
    world.pickups.slice().sort((a, b) => a.id - b.id).map(serializePickup).join(';'),
    world.enemies.slice().sort((a, b) => a.id - b.id).map(serializeEnemy).join(';'),
    world.projectiles.slice().sort((a, b) => a.id - b.id).map(serializeProjectile).join(';'),
    serializeBoss(world.boss),
  ]);
}

/**
 * Hash of the gameplay-relevant simulation state. Two worlds that have
 * identical sim state strings produce identical hashes.
 */
export function simStateHash(world: GameWorld): string {
  return fnv1a32(simStateString(world));
}

/**
 * Deep clone of a GameWorld for counterfactual forking.
 * Ephemeral pools are cloned by structure so the fork starts from an
 * identical visual frame, but only the sim state matters for hash comparison.
 */
export function cloneWorld(world: GameWorld): GameWorld {
  const clone: GameWorld = {
    phase: world.phase,
    stageIndex: world.stageIndex,
    stage: world.stage,
    player: { ...world.player },
    stageRelic: { ...world.stageRelic },
    relicsCollected: [...world.relicsCollected],
    chronicleText: world.chronicleText,
    chronicleTimer: world.chronicleTimer,
    afterimages: world.afterimages.map((img) => ({ ...img })),
    afterimageCursor: world.afterimageCursor,
    targets: world.targets.map((t) => ({ ...t })),
    pickups: world.pickups.map((pk) => ({ ...pk })),
    enemies: world.enemies.map((e) => ({ ...e })),
    projectiles: world.projectiles.map((pr) => ({ ...pr })),
    particles: world.particles.map((pt) => ({ ...pt })),
    particleCursor: world.particleCursor,
    snowflakes: world.snowflakes.map((fl) => ({ ...fl })),
    score: world.score,
    bestScore: world.bestScore,
    combo: world.combo,
    comboTimer: world.comboTimer,
    elapsedSec: world.elapsedSec,
    damageTaken: world.damageTaken,
    enemiesDefeated: world.enemiesDefeated,
    hitstopTimer: world.hitstopTimer,
    trauma: world.trauma,
    borderFlashColor: world.borderFlashColor,
    borderFlashTimer: world.borderFlashTimer,
    defeatBeatTimer: world.defeatBeatTimer,
    stageClearTimer: world.stageClearTimer,
    attractTime: world.attractTime,
    activeAttackTokens: world.activeAttackTokens,
    maxAttackTokens: world.maxAttackTokens,
    nextEntityId: world.nextEntityId,
    boss: world.boss ? { ...world.boss, weakSpots: world.boss.weakSpots.map((w) => ({ ...w })) } : null,
    plaqueCarried: world.plaqueCarried,
    podiumPos: world.podiumPos ? { ...world.podiumPos } : null,
    handover: world.handover
      ? {
          timer: world.handover.timer,
          portraitScale: world.handover.portraitScale,
          revealedChars: world.handover.revealedChars,
          fullText: world.handover.fullText,
          creditsOffsetY: world.handover.creditsOffsetY,
          confetti: world.handover.confetti.map((c) => ({ ...c })),
        }
      : null,
    doorsOpen: world.doorsOpen,
    citizenSpeech: { ...world.citizenSpeech },
    checkpointStageIndex: world.checkpointStageIndex,
    checkpointScore: world.checkpointScore,
    stageLosses: { ...world.stageLosses },
    radoPokeMode: world.radoPokeMode,
    pokePromptVisible: world.pokePromptVisible,
    coopEnabled: world.coopEnabled,
    audioQueue: [...world.audioQueue],
    playMode: world.playMode,
    modeTimer: world.modeTimer,
    currentWave: world.currentWave,
    enemiesToSpawn: world.enemiesToSpawn,
    spawnAccumulator: world.spawnAccumulator,
    partnerChargeProgress: world.partnerChargeProgress,
    selectedZone: world.selectedZone,
    relaySolved: world.relaySolved,
    hubHp: world.hubHp,
  };
  return clone;
}
