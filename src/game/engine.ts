/**
 * Pure decoupled 2D arcade-adventure simulation engine for Zúbok a signálik (Didaktik M).
 * Zero DOM dependencies — runs deterministically in both browser and node:test.
 *
 * Gameplay homages:
 *  - Saboteur! / Saboteur II: tactical ninja dash with i-frames & afterimage trail
 *  - Bubble Bobble & Target: Renegade: Zúbok + Signálik duo tag-team + signal-bubble enemy trap
 *  - Dizzy / Towdie / Pedro: collectible Rimavská Sobota stage relics & Belegost chronicle log
 *  - Exolon / R-Type / F.I.R.E.: CEREC dental laser vs. twin Wi-Fi plasma waves
 */

import { HANDOVER_DEDICATION_LINES } from '../data/dedication';
import { ZX_PALETTE } from '../didaktik/specs';
import { createCitizenSpeechState, updateCitizenSpeech } from './citizens';
import {
  GRID_COLS,
  GRID_ROWS,
  isWallTile,
  isWaterTile,
  SCREEN_H,
  SCREEN_W,
  STAGES,
  TILE_SIZE,
} from './levels';
import {
  applyCheckpointPenalty,
  RADO_POKE_ENEMY_SHOT_SCALE,
  RADO_POKE_EXTRA_HP,
  recordStageLoss,
} from './progress';
import {
  ActiveHero,
  Afterimage,
  BossAttackKind,
  BossState,
  CbctBeamHazard,
  Enemy,
  GamePhase,
  GameWorld,
  HandoverConfetti,
  HudSnapshot,
  InputState,
  Particle,
  Snowflake,
  StageDefinition,
  UvBeamHazard,
} from './types';

const PARTICLE_POOL_SIZE = 128;
const AFTERIMAGE_POOL_SIZE = 16;
const PLAYER_SPEED = 76; // px/sec on 256x192 screen
const DASH_SPEED = 195;
const DASH_DURATION = 0.16;
const DASH_COOLDOWN = 1.1;
const PLAYER_RADIUS = 3.2;
const ENEMY_RADIUS = 3.5;
const LASER_SPEED = 174;
const SIGNAL_WAVE_SPEED = 152;
const ENEMY_SHOT_SPEED = 86;

export function evaluateUvBeamState(
  beam: UvBeamHazard,
  elapsedSec: number
): 'off' | 'telegraph' | 'on' {
  const period = beam.onDuration + beam.offDuration;
  if (period <= 0) return 'off';
  const t = (((elapsedSec + beam.phaseOffset) % period) + period) % period;
  if (t < beam.offDuration - beam.telegraphDuration) {
    return 'off';
  }
  if (t < beam.offDuration) {
    return 'telegraph';
  }
  return 'on';
}

export function evaluateCbctBeamSegment(
  beam: CbctBeamHazard,
  elapsedSec: number
): { x1: number; y1: number; x2: number; y2: number } {
  const angle = beam.initialAngle + elapsedSec * beam.angularSpeed;
  return {
    x1: beam.cx,
    y1: beam.cy,
    x2: beam.cx + Math.cos(angle) * beam.length,
    y2: beam.cy + Math.sin(angle) * beam.length,
  };
}

export function distPointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.0001) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function createParticlePool(): Particle[] {
  const pool: Particle[] = new Array(PARTICLE_POOL_SIZE);
  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    pool[i] = {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: ZX_PALETTE.brightWhite,
      size: 1,
      life: 0,
      maxLife: 0.3,
    };
  }
  return pool;
}

function createAfterimagePool(): Afterimage[] {
  const pool: Afterimage[] = new Array(AFTERIMAGE_POOL_SIZE);
  for (let i = 0; i < AFTERIMAGE_POOL_SIZE; i++) {
    pool[i] = {
      active: false,
      x: 0,
      y: 0,
      hero: 'zubok',
      flipX: false,
      life: 0,
      maxLife: 0.22,
    };
  }
  return pool;
}

function createSnowflakes(): Snowflake[] {
  const flakes: Snowflake[] = [];
  for (let i = 0; i < 28; i++) {
    flakes.push({
      x: (i * 37) % SCREEN_W,
      y: (i * 23) % SCREEN_H,
      speedY: 10 + (i % 4) * 5,
      driftPhase: i * 0.7,
      phase: i * 0.7,
      size: i % 5 === 0 ? 2 : 1,
    });
  }
  return flakes;
}

export function spawnParticles(
  world: GameWorld,
  x: number,
  y: number,
  count: number,
  color: string,
  speed = 46,
  life = 0.32
): void {
  for (let i = 0; i < count; i++) {
    const p = world.particles[world.particleCursor];
    world.particleCursor = (world.particleCursor + 1) % PARTICLE_POOL_SIZE;
    const angle = (Math.PI * 2 * i) / count + (world.particleCursor % 7) * 0.13;
    const spd = speed * (0.55 + ((i * 19) % 10) / 14);
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * spd;
    p.vy = Math.sin(angle) * spd;
    p.color = color;
    p.size = i % 3 === 0 ? 2 : 1;
    p.life = life;
    p.maxLife = life;
  }
}

function spawnAfterimage(world: GameWorld, x: number, y: number, hero: ActiveHero, flipX: boolean): void {
  const img = world.afterimages[world.afterimageCursor];
  world.afterimageCursor = (world.afterimageCursor + 1) % AFTERIMAGE_POOL_SIZE;
  img.active = true;
  img.x = x;
  img.y = y;
  img.hero = hero;
  img.flipX = flipX;
  img.life = 0.22;
  img.maxLife = 0.22;
}

export function createWorld(initialPhase: GamePhase = 'title', bestScore = 0): GameWorld {
  const stage = STAGES[0];
  const world: GameWorld = {
    phase: initialPhase,
    stageIndex: 0,
    stage,
    player: {
      x: stage.playerStart.x,
      y: stage.playerStart.y,
      vx: 0,
      vy: 0,
      facing: 'right',
      activeHero: 'zubok',
      hp: 3,
      maxHp: 3,
      invulnTimer: 1.5,
      fireCooldown: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashDirX: 1,
      dashDirY: 0,
      partnerX: stage.playerStart.x - 14,
      partnerY: stage.playerStart.y,
      partnerFacing: 'right',
      partnerAssistCooldown: 0,
      partnerFireCooldown: 0,
      partnerStepDist: 0,
      partnerAnimFrame: 0,
      stepDist: 0,
      animFrame: 0,
      squashX: 1,
      squashY: 1,
      hitFlash: 0,
    },
    stageRelic: {
      id: 0,
      x: stage.relic.x,
      y: stage.relic.y,
      kind: stage.relic.kind,
      name: stage.relic.name,
      chronicleNote: stage.relic.chronicleNote,
      collected: false,
      bobPhase: 0,
    },
    relicsCollected: [],
    chronicleText: stage.openingChronicle,
    chronicleTimer: 4.5,
    afterimages: createAfterimagePool(),
    afterimageCursor: 0,
    targets: [],
    pickups: [],
    enemies: [],
    projectiles: [],
    particles: createParticlePool(),
    particleCursor: 0,
    snowflakes: createSnowflakes(),
    score: 0,
    bestScore,
    combo: 0,
    comboTimer: 0,
    elapsedSec: 0,
    damageTaken: 0,
    enemiesDefeated: 0,
    hitstopTimer: 0,
    trauma: 0,
    borderFlashColor: null,
    borderFlashTimer: 0,
    defeatBeatTimer: 0,
    stageClearTimer: 0,
    attractTime: 0,
    activeAttackTokens: 0,
    maxAttackTokens: 2,
    nextEntityId: 1,
    boss: null,
    plaqueCarried: false,
    podiumPos: null,
    handover: null,
    doorsOpen: true,
    citizenSpeech: createCitizenSpeechState(),
    checkpointStageIndex: 0,
    checkpointScore: 0,
    stageLosses: {},
    radoPokeMode: false,
    pokePromptVisible: false,
    coopEnabled: false,
    audioQueue: [],
    playMode: 'normal',
    modeTimer: 0,
    currentWave: 0,
    enemiesToSpawn: 0,
    spawnAccumulator: 0,
    partnerChargeProgress: 0,
    selectedZone: 0,
    relaySolved: false,
    hubHp: 0,
  };

  loadStage(world, 0, true);
  return world;
}

export function loadStage(world: GameWorld, stageIndex: number, fullReset = false): void {
  const clampedIdx = Math.max(0, Math.min(STAGES.length - 1, stageIndex));
  const stage = STAGES[clampedIdx];
  world.stageIndex = clampedIdx;
  world.stage = stage;
  world.projectiles = [];
  world.activeAttackTokens = 0;
  world.hitstopTimer = 0;
  world.trauma = 0;
  world.stageClearTimer = 0;

  // Clear particle & afterimage pools cleanly
  for (const p of world.particles) {
    p.active = false;
  }
  for (const a of world.afterimages) {
    a.active = false;
  }

  world.player.x = stage.playerStart.x;
  world.player.y = stage.playerStart.y;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.facing = 'right';
  // In 2P co-op, Player 1 is always Zúbok (laser) and Player 2 is always Signálik (bubble wave)
  world.player.activeHero = world.coopEnabled
    ? 'zubok'
    : stage.act === 'teatro'
      ? 'signalik'
      : 'zubok';
  world.player.partnerX = stage.playerStart.x - 14;
  world.player.partnerY = stage.playerStart.y;
  world.player.partnerFacing = 'right';
  world.player.partnerAssistCooldown = 0;
  world.player.partnerFireCooldown = 0;
  world.player.partnerStepDist = 0;
  world.player.partnerAnimFrame = 0;
  world.player.invulnTimer = 1.6; // Opening grace period so game survives first seconds safely
  world.player.fireCooldown = 0;
  world.player.dashTimer = 0;
  world.player.dashCooldown = 0;
  world.player.squashX = 1;
  world.player.squashY = 1;
  world.player.hitFlash = 0;

  world.chronicleText = stage.openingChronicle;
  world.chronicleTimer = 4.2;

  const desiredMaxHp = 3 + (world.radoPokeMode ? RADO_POKE_EXTRA_HP : 0);
  world.player.maxHp = desiredMaxHp;

  if (fullReset) {
    world.player.hp = world.player.maxHp;
    world.score = 0;
    world.combo = 0;
    world.comboTimer = 0;
    world.elapsedSec = 0;
    world.damageTaken = 0;
    world.enemiesDefeated = 0;
    world.defeatBeatTimer = 0;
    world.relicsCollected = [];
    world.stageLosses = {};
    world.pokePromptVisible = false;
  }

  world.checkpointStageIndex = clampedIdx;
  world.checkpointScore = world.score;

  world.stageRelic = {
    id: world.nextEntityId++,
    x: stage.relic.x,
    y: stage.relic.y,
    kind: stage.relic.kind,
    name: stage.relic.name,
    chronicleNote: stage.relic.chronicleNote,
    collected: false,
    bobPhase: 0,
  };

  world.doorsOpen = !stage.doorsUnlockedByRelic;
  world.citizenSpeech = createCitizenSpeechState();

  // --- Service Incident Arc mode fields (Gate 0) ---
  // Boot into the stage's declared mode, falling back to 'normal' for existing stages.
  world.playMode = stage.startPlayMode ?? 'normal';
  world.modeTimer = stage.timeLimitSec ?? 0;
  world.currentWave = 0;
  world.enemiesToSpawn = 0;
  world.spawnAccumulator = 0;
  world.partnerChargeProgress = 0;
  world.selectedZone = 0;
  world.relaySolved = false;
  // Hub integrity for wave_defense: central hub tile takes 3 hits before falling.
  world.hubHp = world.playMode === 'wave_defense' ? 3 : 0;

  world.targets = stage.targets.map((t, idx) => ({
    id: world.nextEntityId++,
    x: t.x,
    y: t.y,
    kind: t.kind,
    restored: false,
    pulsePhase: idx * 0.85,
    restoreAnim: 0,
    orderIndex: stage.orderedTargets ? idx + 1 : undefined,
  }));

  world.pickups = stage.pickups.map((p, idx) => ({
    id: world.nextEntityId++,
    x: p.x,
    y: p.y,
    kind: p.kind,
    collected: false,
    points: p.points,
    bobPhase: idx * 1.1,
  }));

  world.enemies = stage.enemies.map((e, idx) => {
    const dir = idx % 2 === 0 ? 1 : -1;
    return {
      id: world.nextEntityId++,
      archetype: e.archetype,
      act: stage.act,
      x: e.x,
      y: e.y,
      vx: dir * (e.archetype === 'patroller' ? 30 : 22),
      vy: e.archetype === 'kiter' ? 16 : 0,
      hp: e.archetype === 'charger' ? 2 : 1,
      maxHp: e.archetype === 'charger' ? 2 : 1,
      state: 'move',
      stateTimer: 1.2 + idx * 0.45,
      bubbleTimer: 0,
      facing: dir > 0 ? 'right' : 'left',
      hitFlash: 0,
      koTimer: 0,
      orbitAngle: idx * 1.4,
      chargeDirX: 0,
      chargeDirY: 0,
      hasAttackToken: false,
    };
  });

  world.plaqueCarried = false;
  world.handover = null;
  world.podiumPos = stage.podiumPos ? { ...stage.podiumPos } : null;

  if (stage.bossSpawn) {
    world.boss = {
      active: true,
      name: 'VEĽKÝ RUŠIČ',
      x: stage.bossSpawn.x,
      y: stage.bossSpawn.y,
      vx: 20,
      vy: 0,
      phase: 1,
      hp: 3,
      maxHp: 3,
      weakSpots: [
        { id: 1, offsetX: -11, offsetY: -6, hp: 2, maxHp: 2, destroyed: false, hitFlash: 0 },
        { id: 2, offsetX: 11, offsetY: -6, hp: 2, maxHp: 2, destroyed: false, hitFlash: 0 },
        { id: 3, offsetX: 0, offsetY: 9, hp: 2, maxHp: 2, destroyed: false, hitFlash: 0 },
      ],
      state: 'move',
      stateTimer: 1.8,
      attackKind: 'none',
      attackAngle: 0,
      chargeDirX: 0,
      chargeDirY: 1,
      bubbleTimer: 0,
      hitFlash: 0,
      hasAttackToken: false,
      attackCycleIdx: 0,
    };
  } else {
    world.boss = null;
  }
}

export function startNewGame(world: GameWorld): void {
  world.phase = 'playing';
  loadStage(world, 0, true);
}

export function restartCurrentRun(world: GameWorld): void {
  world.phase = 'playing';
  loadStage(world, 0, true);
}

/**
 * Friendly checkpoint continue: resumes on the reached stage with full vitality
 * and applies the 20 % score penalty without wiping progress back to stage 1.
 */
export function continueFromCheckpoint(world: GameWorld): void {
  const targetStage = Math.max(0, Math.min(STAGES.length - 1, world.checkpointStageIndex));
  world.score = applyCheckpointPenalty(world.checkpointScore);
  world.combo = 0;
  world.comboTimer = 0;
  world.defeatBeatTimer = 0;
  world.pokePromptVisible = false;
  world.player.maxHp = 3 + (world.radoPokeMode ? RADO_POKE_EXTRA_HP : 0);
  world.player.hp = world.player.maxHp;
  world.phase = 'playing';
  loadStage(world, targetStage, false);
}

/**
 * Toggles Spectrum POKE 48621,5 ("Rado režim"): +2 max hearts and 30% slower enemy shots.
 */
export function setRadoPokeMode(world: GameWorld, enabled: boolean): void {
  world.radoPokeMode = enabled;
  world.pokePromptVisible = false;
  world.player.maxHp = 3 + (enabled ? RADO_POKE_EXTRA_HP : 0);
  if (enabled) {
    world.player.hp = Math.min(world.player.maxHp, Math.max(world.player.hp, world.player.maxHp));
  } else {
    world.player.hp = Math.min(world.player.hp, world.player.maxHp);
  }
}

export function setCoopMode(world: GameWorld, enabled: boolean): void {
  world.coopEnabled = enabled;
  if (enabled) {
    world.player.activeHero = 'zubok';
    world.chronicleText = '2P CO-OP: H1 ZÚBOK (WASD) · H2 SIGNÁLIK (ŠÍPKY+ENTER)';
    world.chronicleTimer = 4.0;
  } else {
    world.chronicleText = '1P REŽIM: ZÚBOK & SIGNÁLIK (PREPÍNANIE [C])';
    world.chronicleTimer = 2.6;
  }
}

export function toggleCoopMode(world: GameWorld): boolean {
  setCoopMode(world, !world.coopEnabled);
  return world.coopEnabled;
}

export function swapActiveHero(world: GameWorld): void {
  if (world.phase !== 'playing') return;
  if (world.coopEnabled) {
    // In 2P Co-op both heroes are active simultaneously (P1 = Zúbok, P2 = Signálik)
    world.chronicleText = '2P CO-OP AKTÍVNY: H1 = ZÚBOK · H2 = SIGNÁLIK';
    world.chronicleTimer = 2.2;
    return;
  }
  const p = world.player;
  p.activeHero = p.activeHero === 'zubok' ? 'signalik' : 'zubok';
  p.squashX = 1.24;
  p.squashY = 0.8;
  spawnParticles(
    world,
    p.x,
    p.y,
    10,
    p.activeHero === 'zubok' ? ZX_PALETTE.brightRed : ZX_PALETTE.brightCyan,
    46,
    0.28
  );
  world.chronicleText =
    p.activeHero === 'zubok'
      ? 'HRDINA: ZÚBOK (MICRODENT) · PRESNÝ CEREC LASER'
      : 'HRDINA: SIGNÁLIK (TEATRO) · WI-FI BUBLINOVÁ VLNA';
  world.chronicleTimer = 2.6;
  world.audioQueue.push({ type: 'swapHero' });
}

export function advanceHandoverToVictory(world: GameWorld): void {
  if (world.phase !== 'handover') return;
  world.phase = 'victory';
  world.bestScore = Math.max(world.bestScore, world.score);
}

function startHandoverCutscene(world: GameWorld): void {
  const confettiPalette = [
    ZX_PALETTE.brightRed,
    ZX_PALETTE.brightYellow,
    ZX_PALETTE.brightGreen,
    ZX_PALETTE.brightCyan,
    ZX_PALETTE.brightMagenta,
    ZX_PALETTE.brightWhite,
  ];
  const confetti: HandoverConfetti[] = [];
  for (let i = 0; i < 36; i++) {
    confetti.push({
      x: (i * 29 + 11) % SCREEN_W,
      y: (i * 17) % SCREEN_H,
      vx: ((i % 5) - 2) * 8,
      vy: 18 + (i % 4) * 9,
      color: confettiPalette[i % confettiPalette.length],
      size: i % 3 === 0 ? 2 : 1,
    });
  }

  world.plaqueCarried = false;
  world.enemies = [];
  world.projectiles = [];
  world.score += 1000;
  world.bestScore = Math.max(world.bestScore, world.score);
  world.borderFlashColor = ZX_PALETTE.brightYellow;
  world.borderFlashTimer = 0.45;
  world.phase = 'handover';
  world.handover = {
    timer: 0,
    portraitScale: 0.15,
    revealedChars: 0,
    fullText: HANDOVER_DEDICATION_LINES.join('\n'),
    creditsOffsetY: 0,
    confetti,
  };
  world.audioQueue.push({ type: 'victory' });
}

function collidesWithWall(world: GameWorld, x: number, y: number, radius: number): boolean {
  const minCol = Math.floor((x - radius) / TILE_SIZE);
  const maxCol = Math.floor((x + radius) / TILE_SIZE);
  const minRow = Math.floor((y - radius) / TILE_SIZE);
  const maxRow = Math.floor((y + radius) / TILE_SIZE);

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (isWallTile(world.stage, c, r, world.doorsOpen)) {
        return true;
      }
    }
  }
  return false;
}

function moveWithSlide(
  world: GameWorld,
  entity: { x: number; y: number },
  dx: number,
  dy: number,
  radius: number
): { hitX: boolean; hitY: boolean } {
  let hitX = false;
  let hitY = false;

  const nextX = Math.max(TILE_SIZE + radius, Math.min(SCREEN_W - TILE_SIZE - radius, entity.x + dx));
  if (!collidesWithWall(world, nextX, entity.y, radius)) {
    entity.x = nextX;
  } else {
    hitX = true;
  }

  const nextY = Math.max(TILE_SIZE + radius, Math.min(SCREEN_H - TILE_SIZE - radius, entity.y + dy));
  if (!collidesWithWall(world, entity.x, nextY, radius)) {
    entity.y = nextY;
  } else {
    hitY = true;
  }

  return { hitX, hitY };
}

function releaseEnemyToken(world: GameWorld, enemy: Enemy): void {
  if (enemy.hasAttackToken) {
    enemy.hasAttackToken = false;
    world.activeAttackTokens = Math.max(0, world.activeAttackTokens - 1);
  }
}

function triggerSaboteurDash(world: GameWorld, moveX: number, moveY: number): void {
  const p = world.player;
  if (p.dashCooldown > 0 || p.dashTimer > 0) return;

  let dx = moveX;
  let dy = moveY;
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
    if (p.facing === 'right') dx = 1;
    else if (p.facing === 'left') dx = -1;
    else if (p.facing === 'up') dy = -1;
    else dy = 1;
  } else {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
  }

  p.dashDirX = dx;
  p.dashDirY = dy;
  p.dashTimer = DASH_DURATION;
  p.dashCooldown = DASH_COOLDOWN;
  p.invulnTimer = Math.max(p.invulnTimer, 0.26);
  p.squashX = Math.abs(dx) >= Math.abs(dy) ? 1.28 : 0.8;
  p.squashY = Math.abs(dy) > Math.abs(dx) ? 1.28 : 0.8;
  spawnAfterimage(world, p.x, p.y, p.activeHero, p.facing === 'left');
  spawnParticles(
    world,
    p.x,
    p.y,
    8,
    p.activeHero === 'zubok' ? ZX_PALETTE.brightRed : ZX_PALETTE.brightCyan,
    52,
    0.24
  );
  world.audioQueue.push({ type: 'dash' });
}

function firePlayerWeapon(world: GameWorld): void {
  const p = world.player;
  if (p.fireCooldown > 0) return;

  let dirX = 0;
  let dirY = 0;
  if (p.facing === 'right') dirX = 1;
  else if (p.facing === 'left') dirX = -1;
  else if (p.facing === 'up') dirY = -1;
  else dirY = 1;

  if (p.activeHero === 'zubok') {
    // Zúbok (microDENT): High-velocity precision CEREC dental laser beam
    const vx = dirX * LASER_SPEED;
    const vy = dirY * LASER_SPEED;
    const laserColor =
      world.stage.act === 'gala' ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightCyan;

    world.projectiles.push({
      id: world.nextEntityId++,
      fromPlayer: true,
      kind: 'dental_laser',
      x: p.x + dirX * 5,
      y: p.y + dirY * 5,
      vx,
      vy,
      color: laserColor,
      life: 1.15,
      active: true,
    });

    p.fireCooldown = 0.2;
    p.squashX = vx !== 0 ? 1.2 : 0.86;
    p.squashY = vy !== 0 ? 1.2 : 0.86;
    spawnParticles(world, p.x, p.y, 4, laserColor, 34, 0.16);
    world.audioQueue.push({ type: 'shoot' });
  } else {
    // Signálik (TeatrO.eu): Exolon/R-Type twin Wi-Fi signal wave that traps enemies in Bubble Bobble bubbles!
    const vx = dirX * SIGNAL_WAVE_SPEED;
    const vy = dirY * SIGNAL_WAVE_SPEED;
    const perpX = -dirY;
    const perpY = dirX;
    for (const offset of [-2.4, 2.4]) {
      world.projectiles.push({
        id: world.nextEntityId++,
        fromPlayer: true,
        kind: 'signal_wave',
        x: p.x + dirX * 5 + perpX * offset,
        y: p.y + dirY * 5 + perpY * offset,
        vx,
        vy,
        color: ZX_PALETTE.brightCyan,
        life: 0.95,
        active: true,
      });
    }

    p.fireCooldown = 0.26;
    p.squashX = vx !== 0 ? 1.18 : 0.88;
    p.squashY = vy !== 0 ? 1.18 : 0.88;
    spawnParticles(world, p.x, p.y, 6, ZX_PALETTE.brightCyan, 38, 0.18);
    world.audioQueue.push({ type: 'signalWave' });
  }
}

/**
 * Player 2 (Signálik in 2P Co-op mode) fires twin Wi-Fi bubble waves independently!
 */
function firePartnerWeapon(world: GameWorld): void {
  const p = world.player;
  if (p.partnerFireCooldown > 0) return;

  let dirX = 0;
  let dirY = 0;
  if (p.partnerFacing === 'right') dirX = 1;
  else if (p.partnerFacing === 'left') dirX = -1;
  else if (p.partnerFacing === 'up') dirY = -1;
  else dirY = 1;

  const vx = dirX * SIGNAL_WAVE_SPEED;
  const vy = dirY * SIGNAL_WAVE_SPEED;
  const perpX = -dirY;
  const perpY = dirX;
  for (const offset of [-2.4, 2.4]) {
    world.projectiles.push({
      id: world.nextEntityId++,
      fromPlayer: true,
      kind: 'signal_wave',
      x: p.partnerX + dirX * 5 + perpX * offset,
      y: p.partnerY + dirY * 5 + perpY * offset,
      vx,
      vy,
      color: ZX_PALETTE.brightCyan,
      life: 0.95,
      active: true,
    });
  }

  p.partnerFireCooldown = 0.26;
  spawnParticles(world, p.partnerX, p.partnerY, 6, ZX_PALETTE.brightCyan, 38, 0.18);
  world.audioQueue.push({ type: 'signalWave' });
}

function hurtPlayer(world: GameWorld): void {
  const p = world.player;
  if (p.invulnTimer > 0 || p.dashTimer > 0 || world.defeatBeatTimer > 0) return;

  p.hp = Math.max(0, p.hp - 1);
  world.damageTaken += 1;
  world.combo = 0;
  world.comboTimer = 0;
  p.invulnTimer = 1.45;
  p.hitFlash = 0.14;
  world.hitstopTimer = 0.06;
  world.trauma = Math.min(1, world.trauma + 0.75);
  world.borderFlashColor = ZX_PALETTE.brightRed;
  world.borderFlashTimer = 0.18;

  spawnParticles(world, p.x, p.y, 18, ZX_PALETTE.brightRed, 64, 0.42);
  world.audioQueue.push({ type: 'playerHurt' });

  if (p.hp <= 0) {
    world.defeatBeatTimer = 0.55;
    world.audioQueue.push({ type: 'gameOver' });
  }
}

function updateEnemyAI(world: GameWorld, enemy: Enemy, simDt: number): void {
  if (enemy.state === 'ko') {
    enemy.koTimer -= simDt;
    return;
  }

  // Bubble Bobble trapped state: enemy floats helplessly inside Signálik's cyan Wi-Fi bubble!
  if (enemy.state === 'bubbled') {
    enemy.bubbleTimer -= simDt;
    enemy.y += Math.sin(world.elapsedSec * 6 + enemy.id) * 6 * simDt;
    if (enemy.bubbleTimer <= 0) {
      enemy.state = 'move';
      enemy.stateTimer = 0.9;
      spawnParticles(world, enemy.x, enemy.y, 6, ZX_PALETTE.brightCyan, 32, 0.22);
    }
    return;
  }

  const p = world.player;
  const dxToP = p.x - enemy.x;
  const dyToP = p.y - enemy.y;
  const distToP = Math.hypot(dxToP, dyToP) || 1;
  const speedScale = 1 + world.stageIndex * 0.07;

  if (enemy.archetype === 'patroller') {
    enemy.stateTimer -= simDt;
    const patrolSpeed = 29 * speedScale;
    if (enemy.stateTimer <= 0) {
      enemy.stateTimer = 1.1;
      if (distToP < 92) {
        if (Math.abs(dxToP) > Math.abs(dyToP)) {
          enemy.vx = Math.sign(dxToP) * patrolSpeed;
          enemy.vy = 0;
        } else {
          enemy.vx = 0;
          enemy.vy = Math.sign(dyToP) * patrolSpeed;
        }
      } else {
        const dirs = [
          [patrolSpeed, 0],
          [-patrolSpeed, 0],
          [0, patrolSpeed],
          [0, -patrolSpeed],
        ];
        const pick = dirs[(enemy.id + Math.floor(world.elapsedSec * 3)) % dirs.length];
        enemy.vx = pick[0];
        enemy.vy = pick[1];
      }
    }

    const res = moveWithSlide(world, enemy, enemy.vx * simDt, enemy.vy * simDt, ENEMY_RADIUS);
    if (res.hitX) enemy.vx = -enemy.vx;
    if (res.hitY) enemy.vy = -enemy.vy;
    if (Math.abs(enemy.vx) > 0.1) enemy.facing = enemy.vx > 0 ? 'right' : 'left';
    return;
  }

  if (enemy.archetype === 'kiter') {
    enemy.orbitAngle += simDt * 1.9;
    enemy.stateTimer -= simDt;

    if (enemy.state === 'move') {
      const desiredDist = 66;
      const radialPush = distToP < desiredDist ? -1 : 0.45;
      const tx = (dxToP / distToP) * radialPush * 24 + Math.cos(enemy.orbitAngle) * 24;
      const ty = (dyToP / distToP) * radialPush * 24 + Math.sin(enemy.orbitAngle) * 24;
      moveWithSlide(world, enemy, tx * simDt * speedScale, ty * simDt * speedScale, ENEMY_RADIUS);
      enemy.facing = dxToP >= 0 ? 'right' : 'left';

      if (enemy.stateTimer <= 0 && distToP < 140 && world.activeAttackTokens < world.maxAttackTokens) {
        enemy.state = 'telegraph';
        enemy.stateTimer = 0.55;
        enemy.hasAttackToken = true;
        world.activeAttackTokens += 1;
        world.audioQueue.push({ type: 'telegraph' });
      }
    } else if (enemy.state === 'telegraph') {
      if (enemy.stateTimer <= 0) {
        enemy.state = 'recover';
        enemy.stateTimer = 1.9;
        releaseEnemyToken(world, enemy);

        const nx = dxToP / distToP;
        const ny = dyToP / distToP;
        const shotSpeed =
          ENEMY_SHOT_SPEED * speedScale * (world.radoPokeMode ? RADO_POKE_ENEMY_SHOT_SCALE : 1);
        world.projectiles.push({
          id: world.nextEntityId++,
          fromPlayer: false,
          kind: 'enemy_bolt',
          x: enemy.x + nx * 5,
          y: enemy.y + ny * 5,
          vx: nx * shotSpeed,
          vy: ny * shotSpeed,
          color: ZX_PALETTE.brightMagenta,
          life: 2.0,
          active: true,
        });
        spawnParticles(world, enemy.x, enemy.y, 5, ZX_PALETTE.brightMagenta, 30, 0.2);
      }
    } else if (enemy.state === 'recover') {
      if (enemy.stateTimer <= 0) {
        enemy.state = 'move';
        enemy.stateTimer = 1.6;
      }
    }
    return;
  }

  if (enemy.archetype === 'charger') {
    enemy.stateTimer -= simDt;

    if (enemy.state === 'move') {
      const creep = 20 * speedScale;
      const res = moveWithSlide(world, enemy, enemy.vx * simDt, enemy.vy * simDt, ENEMY_RADIUS);
      if (res.hitX || res.hitY || (enemy.vx === 0 && enemy.vy === 0)) {
        if (Math.abs(dxToP) > Math.abs(dyToP)) {
          enemy.vx = Math.sign(dxToP) * creep;
          enemy.vy = 0;
        } else {
          enemy.vx = 0;
          enemy.vy = Math.sign(dyToP) * creep;
        }
      }
      enemy.facing = dxToP >= 0 ? 'right' : 'left';

      const alignedX = Math.abs(dyToP) < 12;
      const alignedY = Math.abs(dxToP) < 12;
      if (
        enemy.stateTimer <= 0 &&
        (alignedX || alignedY) &&
        world.activeAttackTokens < world.maxAttackTokens
      ) {
        enemy.state = 'telegraph';
        enemy.stateTimer = 0.6;
        enemy.hasAttackToken = true;
        world.activeAttackTokens += 1;
        if (alignedX) {
          enemy.chargeDirX = Math.sign(dxToP) || 1;
          enemy.chargeDirY = 0;
        } else {
          enemy.chargeDirX = 0;
          enemy.chargeDirY = Math.sign(dyToP) || 1;
        }
        world.audioQueue.push({ type: 'telegraph' });
      }
    } else if (enemy.state === 'telegraph') {
      if (enemy.stateTimer <= 0) {
        enemy.state = 'attack';
        enemy.stateTimer = 0.72;
      }
    } else if (enemy.state === 'attack') {
      const dashSpeed = 104 * speedScale;
      const res = moveWithSlide(
        world,
        enemy,
        enemy.chargeDirX * dashSpeed * simDt,
        enemy.chargeDirY * dashSpeed * simDt,
        ENEMY_RADIUS
      );
      if (res.hitX || res.hitY || enemy.stateTimer <= 0) {
        enemy.state = 'recover';
        enemy.stateTimer = 0.9;
        releaseEnemyToken(world, enemy);
        if (res.hitX || res.hitY) {
          world.trauma = Math.min(1, world.trauma + 0.25);
          spawnParticles(world, enemy.x, enemy.y, 8, ZX_PALETTE.brightYellow, 45, 0.25);
        }
      }
    } else if (enemy.state === 'recover') {
      if (enemy.stateTimer <= 0) {
        enemy.state = 'move';
        enemy.stateTimer = 1.4;
      }
    }
  }
}

function releaseBossToken(world: GameWorld, boss: BossState): void {
  if (boss.hasAttackToken) {
    boss.hasAttackToken = false;
    world.activeAttackTokens = Math.max(0, world.activeAttackTokens - 1);
  }
}

function popBubbledBoss(world: GameWorld, boss: BossState): void {
  boss.hp = Math.max(0, boss.hp - 1);
  boss.hitFlash = 0.16;
  boss.bubbleTimer = 0;
  world.hitstopTimer = 0.06;
  world.trauma = Math.min(1, world.trauma + 0.55);
  world.score += 350;
  world.bestScore = Math.max(world.bestScore, world.score);
  spawnParticles(world, boss.x, boss.y, 24, ZX_PALETTE.brightCyan, 70, 0.48);
  world.audioQueue.push({ type: 'bubblePop' });

  if (boss.hp <= 0) {
    releaseBossToken(world, boss);
    boss.phase = 4;
    boss.state = 'defeated';
    boss.active = false;
    // Clear all remaining enemies and enemy bolts so plaque carry is celebratory
    world.enemies = [];
    world.projectiles = world.projectiles.filter((pr) => pr.fromPlayer);
    // Drop the MVP plaque cleanly at arena center (15, 11)
    world.stageRelic.x = 15 * TILE_SIZE + TILE_SIZE / 2;
    world.stageRelic.y = 11 * TILE_SIZE + TILE_SIZE / 2;
    world.stageRelic.collected = false;
    world.borderFlashColor = ZX_PALETTE.brightYellow;
    world.borderFlashTimer = 0.4;
    world.chronicleText = 'VEĽKÝ RUŠIČ PORAZENÝ! ZOBER PLAKETU V STREDE!';
    world.chronicleTimer = 5.0;
    spawnParticles(world, boss.x, boss.y, 36, ZX_PALETTE.brightYellow, 82, 0.65);
    world.audioQueue.push({ type: 'stageClear' });
  } else {
    boss.state = 'recover';
    boss.stateTimer = 0.95;
    world.chronicleText = `BUBLINA PRASKLA! VEĽKÝ RUŠIČ ZOSTÁVA ${boss.hp}/${boss.maxHp}`;
    world.chronicleTimer = 2.6;
  }
}

function updateBossAI(world: GameWorld, boss: BossState, simDt: number): void {
  if (!boss.active || boss.phase >= 4) return;
  boss.hitFlash = Math.max(0, boss.hitFlash - simDt);
  for (const ws of boss.weakSpots) {
    ws.hitFlash = Math.max(0, ws.hitFlash - simDt);
  }

  if (boss.state === 'bubbled') {
    boss.bubbleTimer -= simDt;
    boss.y += Math.sin(world.elapsedSec * 5) * 5 * simDt;
    if (boss.bubbleTimer <= 0) {
      boss.state = 'move';
      boss.stateTimer = 1.0;
      spawnParticles(world, boss.x, boss.y, 8, ZX_PALETTE.brightCyan, 36, 0.25);
    }
    return;
  }

  const p = world.player;
  const dx = p.x - boss.x;
  const dy = p.y - boss.y;
  const dist = Math.hypot(dx, dy) || 1;
  boss.stateTimer -= simDt;

  if (boss.state === 'move') {
    // Gentle patrol across central arena
    const res = moveWithSlide(world, boss, boss.vx * simDt, boss.vy * simDt, 9);
    if (res.hitX || boss.x < 48 || boss.x > SCREEN_W - 48) {
      boss.vx = -boss.vx;
      boss.x = Math.max(48, Math.min(SCREEN_W - 48, boss.x));
    }
    if (res.hitY || boss.y < 42 || boss.y > SCREEN_H - 54) {
      boss.vy = -boss.vy;
      boss.y = Math.max(42, Math.min(SCREEN_H - 54, boss.y));
    }

    if (boss.stateTimer <= 0 && world.activeAttackTokens < world.maxAttackTokens) {
      const cycle: BossAttackKind[] = ['radial_spread', 'line_charge', 'summon_patrollers'];
      boss.attackKind = cycle[boss.attackCycleIdx % cycle.length];
      boss.attackCycleIdx += 1;
      boss.state = 'telegraph';
      boss.stateTimer = boss.attackKind === 'line_charge' ? 0.72 : 0.65;
      boss.hasAttackToken = true;
      world.activeAttackTokens += 1;
      boss.chargeDirX = dx / dist;
      boss.chargeDirY = dy / dist;
      world.audioQueue.push({ type: 'telegraph' });
    }
  } else if (boss.state === 'telegraph') {
    if (boss.stateTimer <= 0) {
      if (boss.attackKind === 'radial_spread') {
        const boltCount = 8;
        const speed =
          ENEMY_SHOT_SPEED * 0.92 * (world.radoPokeMode ? RADO_POKE_ENEMY_SHOT_SCALE : 1);
        for (let i = 0; i < boltCount; i++) {
          const ang = boss.attackAngle + (Math.PI * 2 * i) / boltCount;
          world.projectiles.push({
            id: world.nextEntityId++,
            fromPlayer: false,
            kind: 'enemy_bolt',
            x: boss.x + Math.cos(ang) * 9,
            y: boss.y + Math.sin(ang) * 9,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            color: ZX_PALETTE.brightMagenta,
            life: 2.2,
            active: true,
          });
        }
        boss.attackAngle += 0.35;
        spawnParticles(world, boss.x, boss.y, 10, ZX_PALETTE.brightMagenta, 42, 0.25);
        releaseBossToken(world, boss);
        boss.state = 'recover';
        boss.stateTimer = 1.25;
      } else if (boss.attackKind === 'line_charge') {
        boss.state = 'attack';
        boss.stateTimer = 0.62;
      } else if (boss.attackKind === 'summon_patrollers') {
        const livingEnemies = world.enemies.filter((e) => e.state !== 'ko').length;
        const toSpawn = Math.min(2, Math.max(0, 4 - livingEnemies));
        const candidateOffsets = [
          [-32, 0],
          [32, 0],
          [0, -28],
          [0, 28],
        ];
        let spawned = 0;
        for (const [ox, oy] of candidateOffsets) {
          if (spawned >= toSpawn) break;
          const sx = Math.max(20, Math.min(SCREEN_W - 20, boss.x + ox));
          const sy = Math.max(20, Math.min(SCREEN_H - 20, boss.y + oy));
          if (
            !collidesWithWall(world, sx, sy, ENEMY_RADIUS) &&
            Math.hypot(sx - p.x, sy - p.y) >= 34
          ) {
            world.enemies.push({
              id: world.nextEntityId++,
              archetype: 'patroller',
              act: world.stage.act,
              x: sx,
              y: sy,
              vx: (spawned % 2 === 0 ? 1 : -1) * 32,
              vy: 0,
              hp: 1,
              maxHp: 1,
              state: 'move',
              stateTimer: 1.0,
              bubbleTimer: 0,
              facing: spawned % 2 === 0 ? 'right' : 'left',
              hitFlash: 0,
              koTimer: 0,
              orbitAngle: 0,
              chargeDirX: 0,
              chargeDirY: 0,
              hasAttackToken: false,
            });
            spawnParticles(world, sx, sy, 8, ZX_PALETTE.brightGreen, 34, 0.24);
            spawned += 1;
          }
        }
        releaseBossToken(world, boss);
        boss.state = 'recover';
        boss.stateTimer = 1.45;
      }
    }
  } else if (boss.state === 'attack') {
    const chargeSpeed = 96;
    const res = moveWithSlide(
      world,
      boss,
      boss.chargeDirX * chargeSpeed * simDt,
      boss.chargeDirY * chargeSpeed * simDt,
      9
    );
    if (res.hitX || res.hitY || boss.stateTimer <= 0) {
      releaseBossToken(world, boss);
      boss.state = 'recover';
      boss.stateTimer = 1.1;
      if (res.hitX || res.hitY) {
        world.trauma = Math.min(1, world.trauma + 0.3);
        spawnParticles(world, boss.x, boss.y, 10, ZX_PALETTE.brightYellow, 46, 0.25);
      }
    }
  } else if (boss.state === 'recover') {
    if (boss.stateTimer <= 0) {
      boss.state = 'move';
      boss.stateTimer = 1.4;
      boss.attackKind = 'none';
    }
  }
}

export function stepWorld(world: GameWorld, rawDt: number, input: InputState): void {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);

  // Ambient snow always animates gently in title, playing, and end states
  for (const flake of world.snowflakes) {
    flake.y += flake.speedY * dt;
    flake.driftPhase += dt * 1.4;
    flake.phase += dt * 1.4;
    flake.x += Math.sin(flake.driftPhase) * 6 * dt;
    if (flake.y > SCREEN_H) {
      flake.y = -2;
      flake.x = (flake.x + 41) % SCREEN_W;
    }
    if (flake.x < 0) flake.x += SCREEN_W;
    if (flake.x >= SCREEN_W) flake.x -= SCREEN_W;
  }

  if (world.phase === 'title') {
    world.attractTime += dt;
    return;
  }

  if (world.phase === 'handover' && world.handover) {
    const h = world.handover;
    h.timer += dt;
    h.portraitScale = Math.min(1, 0.15 + h.timer * 0.65);
    h.revealedChars = Math.min(h.fullText.length, Math.floor(h.timer * 30));
    if (h.revealedChars >= h.fullText.length) {
      h.creditsOffsetY += dt * 14;
    }
    for (const c of h.confetti) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.y > SCREEN_H) {
        c.y = -2;
        c.x = (c.x + 37) % SCREEN_W;
      }
      if (c.x < 0) c.x += SCREEN_W;
      if (c.x >= SCREEN_W) c.x -= SCREEN_W;
    }
    if (world.borderFlashTimer > 0) {
      world.borderFlashTimer = Math.max(0, world.borderFlashTimer - dt);
      if (world.borderFlashTimer <= 0) world.borderFlashColor = null;
    }
    return;
  }

  if (world.phase === 'paused' || world.phase === 'gameover' || world.phase === 'victory') {
    return;
  }

  // Real-time visual timers tick even during hitstop
  world.trauma = Math.max(0, world.trauma - dt * 2.4);
  if (world.chronicleTimer > 0) {
    world.chronicleTimer = Math.max(0, world.chronicleTimer - dt);
  }
  if (world.borderFlashTimer > 0) {
    world.borderFlashTimer = Math.max(0, world.borderFlashTimer - dt);
    if (world.borderFlashTimer <= 0) {
      world.borderFlashColor = null;
    }
  }
  for (const img of world.afterimages) {
    if (!img.active) continue;
    img.life -= dt;
    if (img.life <= 0) img.active = false;
  }

  if (world.phase === 'stage_clear') {
    world.stageClearTimer -= dt;
    updateParticles(world, dt);
    if (world.stageClearTimer <= 0) {
      if (world.stageIndex + 1 < STAGES.length) {
        loadStage(world, world.stageIndex + 1, false);
        world.phase = 'playing';
      } else {
        world.phase = 'victory';
        world.bestScore = Math.max(world.bestScore, world.score);
        world.audioQueue.push({ type: 'victory' });
      }
    }
    return;
  }

  // Brief 0.55s defeat beat before Game Over modal locks in
  if (world.defeatBeatTimer > 0) {
    world.defeatBeatTimer -= dt;
    updateParticles(world, dt);
    if (world.defeatBeatTimer <= 0) {
      const lossOutcome = recordStageLoss(world.stageLosses, world.stageIndex);
      world.stageLosses = lossOutcome.nextLosses;
      world.pokePromptVisible = !world.radoPokeMode && lossOutcome.shouldOfferPoke;
      world.phase = 'gameover';
      world.bestScore = Math.max(world.bestScore, world.score);
    }
    return;
  }

  // Hitstop freeze pauses simulation physics while camera shake & flashes keep ticking
  if (world.hitstopTimer > 0) {
    world.hitstopTimer = Math.max(0, world.hitstopTimer - dt);
    updateParticles(world, dt * 0.35);
    return;
  }

  const simDt = dt;
  world.elapsedSec += simDt;

  // Decay combo timer
  if (world.comboTimer > 0) {
    world.comboTimer = Math.max(0, world.comboTimer - simDt);
    if (world.comboTimer <= 0) {
      world.combo = 0;
    }
  }

  // Update Player
  const p = world.player;
  p.invulnTimer = Math.max(0, p.invulnTimer - simDt);
  p.fireCooldown = Math.max(0, p.fireCooldown - simDt);
  p.dashCooldown = Math.max(0, p.dashCooldown - simDt);
  p.partnerAssistCooldown = Math.max(0, p.partnerAssistCooldown - simDt);
  p.partnerFireCooldown = Math.max(0, p.partnerFireCooldown - simDt);
  p.hitFlash = Math.max(0, p.hitFlash - simDt);
  p.squashX += (1 - p.squashX) * Math.min(1, simDt * 14);
  p.squashY += (1 - p.squashY) * Math.min(1, simDt * 14);

  if (input.swapHeroJustPressed) {
    swapActiveHero(world);
  }

  let moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let moveY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071;
    moveY *= 0.7071;
  }

  if (input.dashJustPressed) {
    triggerSaboteurDash(world, moveX, moveY);
  }

  if (p.dashTimer > 0) {
    const prevTimer = p.dashTimer;
    p.dashTimer = Math.max(0, p.dashTimer - simDt);
    moveWithSlide(world, p, p.dashDirX * DASH_SPEED * simDt, p.dashDirY * DASH_SPEED * simDt, PLAYER_RADIUS);
    if (Math.floor(prevTimer * 35) !== Math.floor(p.dashTimer * 35)) {
      spawnAfterimage(world, p.x, p.y, p.activeHero, p.facing === 'left');
    }
  } else if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
    if (Math.abs(moveX) >= Math.abs(moveY)) {
      p.facing = moveX > 0 ? 'right' : 'left';
    } else {
      p.facing = moveY > 0 ? 'down' : 'up';
    }
    const prevX = p.x;
    const prevY = p.y;
    const pCol = Math.floor(p.x / TILE_SIZE);
    const pRow = Math.floor(p.y / TILE_SIZE);
    const waterFactor = isWaterTile(world.stage, pCol, pRow) ? 0.5 : 1.0;
    const effectiveSpeed = PLAYER_SPEED * waterFactor;
    moveWithSlide(world, p, moveX * effectiveSpeed * simDt, moveY * effectiveSpeed * simDt, PLAYER_RADIUS);
    const moved = Math.hypot(p.x - prevX, p.y - prevY);
    p.stepDist += moved;
    p.animFrame = Math.floor(p.stepDist / 6) % 2;
  }

  // Stage environmental hazards (Stage 1 UV beams, Stage 2 rotating CBCT beam)
  if (world.stage.hazards && world.stage.hazards.length > 0) {
    for (const hz of world.stage.hazards) {
      if (hz.kind === 'uv_beam') {
        if (evaluateUvBeamState(hz, world.elapsedSec) === 'on') {
          const dist = distPointToSegment(p.x, p.y, hz.x1, hz.y1, hz.x2, hz.y2);
          if (dist < PLAYER_RADIUS + 2.5) {
            hurtPlayer(world);
          }
        }
      } else if (hz.kind === 'cbct_beam') {
        const seg = evaluateCbctBeamSegment(hz, world.elapsedSec);
        const dist = distPointToSegment(p.x, p.y, seg.x1, seg.y1, seg.x2, seg.y2);
        if (dist < PLAYER_RADIUS + 2.5) {
          hurtPlayer(world);
        }
      }
    }
  }

  // Update NPC Citizen proximity speech (Dizzy/Towdie style, 3.0s bubble, no extra button)
  updateCitizenSpeech(world.stageIndex, p.x, p.y, simDt, world.citizenSpeech);
  if (world.coopEnabled && world.citizenSpeech.timer <= 0) {
    updateCitizenSpeech(world.stageIndex, p.partnerX, p.partnerY, 0, world.citizenSpeech);
  }

  // Partner movement: Independent Player 2 (Signálik) in 2P Co-op OR smooth AI companion follow in 1P
  if (world.coopEnabled) {
    const p2In = input.p2;
    let p2MoveX = ((p2In?.right ? 1 : 0) - (p2In?.left ? 1 : 0));
    let p2MoveY = ((p2In?.down ? 1 : 0) - (p2In?.up ? 1 : 0));
    if (p2MoveX !== 0 && p2MoveY !== 0) {
      p2MoveX *= 0.7071;
      p2MoveY *= 0.7071;
    }
    if (Math.abs(p2MoveX) > 0.01 || Math.abs(p2MoveY) > 0.01) {
      if (Math.abs(p2MoveX) >= Math.abs(p2MoveY)) {
        p.partnerFacing = p2MoveX > 0 ? 'right' : 'left';
      } else {
        p.partnerFacing = p2MoveY > 0 ? 'down' : 'up';
      }
      const p2Pos = { x: p.partnerX, y: p.partnerY };
      const p2Col = Math.floor(p2Pos.x / TILE_SIZE);
      const p2Row = Math.floor(p2Pos.y / TILE_SIZE);
      const p2WaterFactor = isWaterTile(world.stage, p2Col, p2Row) ? 0.5 : 1.0;
      const p2Speed = PLAYER_SPEED * p2WaterFactor;
      moveWithSlide(world, p2Pos, p2MoveX * p2Speed * simDt, p2MoveY * p2Speed * simDt, PLAYER_RADIUS);
      const moved2 = Math.hypot(p2Pos.x - p.partnerX, p2Pos.y - p.partnerY);
      p.partnerX = p2Pos.x;
      p.partnerY = p2Pos.y;
      p.partnerStepDist += moved2;
      p.partnerAnimFrame = Math.floor(p.partnerStepDist / 6) % 2;
    }
    if (p2In?.fireJustPressed) {
      firePartnerWeapon(world);
    }
  } else {
    const followOffsetX = p.facing === 'left' ? 14 : p.facing === 'right' ? -14 : 10;
    const followOffsetY = p.facing === 'up' ? 12 : p.facing === 'down' ? -12 : 4;
    const desiredPX = Math.max(TILE_SIZE + 5, Math.min(SCREEN_W - TILE_SIZE - 5, p.x + followOffsetX));
    const desiredPY = Math.max(TILE_SIZE + 5, Math.min(SCREEN_H - TILE_SIZE - 5, p.y + followOffsetY));
    p.partnerX += (desiredPX - p.partnerX) * Math.min(1, simDt * 6.5);
    p.partnerY += (desiredPY - p.partnerY) * Math.min(1, simDt * 6.5);
    p.partnerFacing = p.facing;
  }

  if (input.fireJustPressed) {
    firePlayerWeapon(world);
  }

  // Update Dizzy/Towdie Stage Relic (or Stage 6 mandatory MVP Plaque once boss F4 drops it)
  const relic = world.stageRelic;
  relic.bobPhase += simDt * 3.6;
  const relicUnlocked = !world.boss || world.boss.phase === 4;
  const relicReachedByP1 = Math.hypot(p.x - relic.x, p.y - relic.y) < 11;
  const relicReachedByP2 = world.coopEnabled && Math.hypot(p.partnerX - relic.x, p.partnerY - relic.y) < 11;
  if (relicUnlocked && !relic.collected && (relicReachedByP1 || relicReachedByP2)) {
    relic.collected = true;
    if (!world.relicsCollected.includes(relic.name)) {
      world.relicsCollected.push(relic.name);
    }
    const relicBonus = relic.kind === 'plaque' ? 1000 : 400 + world.stageIndex * 100;
    world.score += relicBonus;
    world.bestScore = Math.max(world.bestScore, world.score);
    // Recover 1 heart if wounded (Dizzy/Towdie adventure reward!)
    if (p.hp < p.maxHp) {
      p.hp += 1;
    }
    // Stage 5: Kronika 1270 unlocks locked museum vault doors ('D')!
    if (world.stage.doorsUnlockedByRelic && relic.kind === world.stage.doorsUnlockedByRelic) {
      world.doorsOpen = true;
      for (let r = 0; r < GRID_ROWS; r++) {
        const rowStr = world.stage.grid[r];
        for (let c = 0; c < GRID_COLS; c++) {
          if (rowStr[c] === 'D') {
            spawnParticles(
              world,
              c * TILE_SIZE + 4,
              r * TILE_SIZE + 4,
              6,
              ZX_PALETTE.brightYellow,
              42,
              0.35
            );
          }
        }
      }
    }
    if (relic.kind === 'plaque' && world.boss) {
      world.plaqueCarried = true;
      world.enemies = [];
      world.projectiles = world.projectiles.filter((pr) => pr.fromPlayer);
    }
    world.chronicleText = relic.chronicleNote;
    world.chronicleTimer = 4.5;
    world.borderFlashColor = ZX_PALETTE.brightYellow;
    world.borderFlashTimer = 0.22;
    spawnParticles(world, relic.x, relic.y, 18, ZX_PALETTE.brightYellow, 64, 0.45);
    world.audioQueue.push({ type: 'relicFound' });
  }

  // Stage 6: deliver carried MVP Plaque to the podium tile to trigger 256x192 handover cutscene
  const podiumReachedByP1 =
    world.podiumPos && Math.hypot(p.x - world.podiumPos.x, p.y - world.podiumPos.y) < 12;
  const podiumReachedByP2 =
    world.coopEnabled &&
    world.podiumPos &&
    Math.hypot(p.partnerX - world.podiumPos.x, p.partnerY - world.podiumPos.y) < 12;
  if (world.plaqueCarried && (podiumReachedByP1 || podiumReachedByP2)) {
    startHandoverCutscene(world);
    return;
  }

  // Update Objectives (player touch, P2 touch, companion assist, or laser restores them!)
  for (const t of world.targets) {
    t.pulsePhase += simDt * 3.5;
    if (t.restoreAnim > 0) {
      t.restoreAnim = Math.max(0, t.restoreAnim - simDt);
    }
    if (!t.restored && Math.hypot(p.x - t.x, p.y - t.y) < 9.5) {
      restoreTarget(world, t.id);
    } else if (!t.restored && world.coopEnabled && Math.hypot(p.partnerX - t.x, p.partnerY - t.y) < 9.5) {
      restoreTarget(world, t.id);
    } else if (
      !t.restored &&
      !world.coopEnabled &&
      p.partnerAssistCooldown <= 0 &&
      Math.hypot(p.partnerX - t.x, p.partnerY - t.y) < 11
    ) {
      p.partnerAssistCooldown = 0.9;
      restoreTarget(world, t.id);
    }
  }

  // Update Bonus Pickups
  for (const pk of world.pickups) {
    pk.bobPhase += simDt * 3.2;
    const pkHitP1 = Math.hypot(p.x - pk.x, p.y - pk.y) < 9.5;
    const pkHitP2 = world.coopEnabled && Math.hypot(p.partnerX - pk.x, p.partnerY - pk.y) < 9.5;
    if (!pk.collected && (pkHitP1 || pkHitP2)) {
      pk.collected = true;
      world.score += pk.points;
      world.bestScore = Math.max(world.bestScore, world.score);
      spawnParticles(world, pk.x, pk.y, 10, ZX_PALETTE.brightYellow, 46, 0.35);
      world.audioQueue.push({ type: 'pickup' });
      if (world.stageIndex >= 4 && (pk.kind === 'gift' || pk.kind === 'crown')) {
        world.audioQueue.push({ type: 'jingle_bell' });
      }
    }
  }

  // Update Projectiles
  for (const proj of world.projectiles) {
    if (!proj.active) continue;
    proj.life -= simDt;
    if (proj.life <= 0) {
      proj.active = false;
      continue;
    }

    proj.x += proj.vx * simDt;
    proj.y += proj.vy * simDt;

    if (collidesWithWall(world, proj.x, proj.y, 1.5)) {
      proj.active = false;
      spawnParticles(world, proj.x, proj.y, 4, proj.color, 28, 0.18);
      continue;
    }

    if (proj.fromPlayer) {
      let hitSomething = false;
      for (const t of world.targets) {
        if (!t.restored && Math.hypot(proj.x - t.x, proj.y - t.y) < 7) {
          restoreTarget(world, t.id);
          proj.active = false;
          hitSomething = true;
          break;
        }
      }
      if (hitSomething) continue;

      for (const enemy of world.enemies) {
        if (enemy.state === 'ko') continue;
        if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < 8) {
          proj.active = false;
          if (proj.kind === 'signal_wave' && enemy.state !== 'bubbled') {
            trapEnemyInBubble(world, enemy);
          } else {
            damageEnemy(world, enemy, enemy.state === 'bubbled');
          }
          hitSomething = true;
          break;
        }
      }
      if (hitSomething) continue;

      // Player projectiles vs Stage 6 Boss "Veľký Rušič"
      if (world.boss && world.boss.active && world.boss.phase < 4) {
        const boss = world.boss;
        if (boss.phase === 1) {
          if (Math.hypot(proj.x - boss.x, proj.y - boss.y) < 14) {
            proj.active = false;
            spawnParticles(world, proj.x, proj.y, 5, ZX_PALETTE.brightCyan, 34, 0.18);
          }
        } else if (boss.phase === 2) {
          // Check 3 caries weak spots (vulnerable ONLY to Zúbok's dental_laser)
          let targetSpot = null;
          let bestDist = 11;
          for (const ws of boss.weakSpots) {
            if (ws.destroyed) continue;
            const d = Math.hypot(proj.x - (boss.x + ws.offsetX), proj.y - (boss.y + ws.offsetY));
            if (d < bestDist) {
              bestDist = d;
              targetSpot = ws;
            }
          }
          const hitBody = Math.hypot(proj.x - boss.x, proj.y - boss.y) < 13;
          if (targetSpot || hitBody) {
            proj.active = false;
            if (proj.kind === 'dental_laser') {
              const spot = targetSpot ?? boss.weakSpots.find((w) => !w.destroyed) ?? null;
              if (spot) {
                spot.hp -= 1;
                spot.hitFlash = 0.12;
                boss.hitFlash = 0.08;
                world.hitstopTimer = 0.04;
                world.trauma = Math.min(1, world.trauma + 0.25);
                spawnParticles(
                  world,
                  boss.x + spot.offsetX,
                  boss.y + spot.offsetY,
                  10,
                  ZX_PALETTE.brightCyan,
                  48,
                  0.28
                );
                if (spot.hp <= 0) {
                  spot.destroyed = true;
                  world.score += 250;
                  world.bestScore = Math.max(world.bestScore, world.score);
                  world.audioQueue.push({ type: 'enemyKo' });
                } else {
                  world.audioQueue.push({ type: 'enemyHit' });
                }
                if (boss.weakSpots.every((w) => w.destroyed)) {
                  releaseBossToken(world, boss);
                  boss.phase = 3;
                  boss.state = 'recover';
                  boss.stateTimer = 0.85;
                  world.borderFlashColor = ZX_PALETTE.brightCyan;
                  world.borderFlashTimer = 0.25;
                  world.chronicleText = 'KAZY ZNIČENÉ! SIGNÁLIK [C]: UVÄZNI RUŠIČA V BUBLINE!';
                  world.chronicleTimer = 4.5;
                  world.audioQueue.push({ type: 'stageClear' });
                }
              }
            } else {
              // Signálik's signal_wave cannot damage Phase 2 caries weak spots
              spawnParticles(world, proj.x, proj.y, 4, ZX_PALETTE.white, 28, 0.16);
              world.chronicleText = 'KAZY ZNIČÍ IBA LASER ZÚBOKA! STLAČ C!';
              world.chronicleTimer = 2.2;
            }
          }
        } else if (boss.phase === 3) {
          if (Math.hypot(proj.x - boss.x, proj.y - boss.y) < 14) {
            proj.active = false;
            if (boss.state === 'bubbled') {
              // Brief grace so the second wave of Signálik's twin volley does not self-pop the bubble on the same frame
              if (boss.bubbleTimer < 3.05) {
                popBubbledBoss(world, boss);
              }
            } else if (proj.kind === 'signal_wave') {
              releaseBossToken(world, boss);
              boss.state = 'bubbled';
              boss.bubbleTimer = 3.2;
              boss.hitFlash = 0.1;
              world.hitstopTimer = 0.04;
              spawnParticles(world, boss.x, boss.y, 12, ZX_PALETTE.brightCyan, 44, 0.3);
              world.audioQueue.push({ type: 'bubbleTrap' });
              world.chronicleText = 'RUŠIČ V BUBLINE! PRASKNI JU ZÁSAHOM ALEBO DOTYKOM!';
              world.chronicleTimer = 3.0;
            } else {
              // Zúbok's laser cannot trap boss in Phase 3
              spawnParticles(world, proj.x, proj.y, 4, ZX_PALETTE.white, 28, 0.16);
              world.chronicleText = 'UVÄZNI RUŠIČA BUBLINOU SIGNÁLIKA [C]!';
              world.chronicleTimer = 2.2;
            }
          }
        }
      }
    } else {
      if (Math.hypot(proj.x - p.x, proj.y - p.y) < 6.5) {
        proj.active = false;
        hurtPlayer(world);
      }
    }
  }
  world.projectiles = world.projectiles.filter((pr) => pr.active);

  // Update Enemies
  for (const enemy of world.enemies) {
    enemy.hitFlash = Math.max(0, enemy.hitFlash - simDt);
    updateEnemyAI(world, enemy, simDt);

    if (enemy.state === 'bubbled' && Math.hypot(enemy.x - p.x, enemy.y - p.y) < 9.5) {
      // Bubble Bobble signature move: bump or dash through a bubbled enemy to pop it for bonus points!
      enemy.hp = 1;
      damageEnemy(world, enemy, true);
    } else if (enemy.state !== 'ko' && enemy.state !== 'bubbled' && Math.hypot(enemy.x - p.x, enemy.y - p.y) < 7.2) {
      hurtPlayer(world);
    }
  }
  world.enemies = world.enemies.filter((e) => !(e.state === 'ko' && e.koTimer <= 0));

  // Update Stage 6 Boss
  if (world.boss && world.boss.active && world.boss.phase < 4) {
    const boss = world.boss;
    updateBossAI(world, boss, simDt);
    const distToBoss = Math.hypot(boss.x - p.x, boss.y - p.y);
    if (boss.phase === 3 && boss.state === 'bubbled' && distToBoss < 15) {
      popBubbledBoss(world, boss);
    } else if (boss.phase < 4 && boss.state !== 'bubbled' && distToBoss < 12) {
      hurtPlayer(world);
    }
  }

  updateParticles(world, simDt);

  // Check Stage Clear condition (all targets restored!)
  const allRestored = world.targets.every((t) => t.restored);
  if (allRestored) {
    if (world.boss) {
      // Stage 6 Finale: restoring all 8 targets drops the boss shield (F1 -> F2)
      if (world.boss.phase === 1) {
        world.boss.phase = 2;
        world.boss.hitFlash = 0.2;
        world.score += 400;
        world.bestScore = Math.max(world.bestScore, world.score);
        world.borderFlashColor = ZX_PALETTE.brightCyan;
        world.borderFlashTimer = 0.35;
        world.chronicleText = 'ŠTÍT PADOL! ZÚBOK: ZNIČ 3 KAZY LASEROM!';
        world.chronicleTimer = 4.5;
        world.audioQueue.push({ type: 'stageClear' });
        spawnParticles(world, world.boss.x, world.boss.y, 24, ZX_PALETTE.brightCyan, 72, 0.5);
      }
    } else {
      world.score += 300 + world.stageIndex * 100;
      world.bestScore = Math.max(world.bestScore, world.score);
      world.borderFlashColor = ZX_PALETTE.brightGreen;
      world.borderFlashTimer = 0.35;
      world.phase = 'stage_clear';
      world.stageClearTimer = 1.25;
      world.audioQueue.push({ type: 'stageClear' });
      spawnParticles(world, p.x, p.y, 24, ZX_PALETTE.brightYellow, 75, 0.55);
    }
  }
}

function trapEnemyInBubble(world: GameWorld, enemy: Enemy): void {
  releaseEnemyToken(world, enemy);
  enemy.state = 'bubbled';
  enemy.bubbleTimer = 2.4;
  enemy.hitFlash = 0.08;
  world.hitstopTimer = 0.03;
  spawnParticles(world, enemy.x, enemy.y, 8, ZX_PALETTE.brightCyan, 38, 0.28);
  world.audioQueue.push({ type: 'bubbleTrap' });
}

function restoreTarget(world: GameWorld, targetId: number): void {
  const t = world.targets.find((item) => item.id === targetId);
  if (!t || t.restored) return;

  // Stage 3 Atomix ordered targets puzzle: must restore 1 -> 2 -> ... -> 7 without hurting player on mistake
  if (world.stage.orderedTargets && t.orderIndex !== undefined) {
    const restoredCount = world.targets.reduce((acc, item) => acc + (item.restored ? 1 : 0), 0);
    const expectedOrder = restoredCount + 1;
    if (t.orderIndex !== expectedOrder) {
      for (const item of world.targets) {
        item.restored = false;
        item.restoreAnim = 0;
      }
      world.combo = 0;
      world.comboTimer = 0;
      world.borderFlashColor = ZX_PALETTE.brightYellow;
      world.borderFlashTimer = 0.16;
      world.chronicleText = 'ZLÉ PORADIE VLÁKIEN! ZAPÁJAJ OD 1 PO 7!';
      world.chronicleTimer = 3.0;
      spawnParticles(world, t.x, t.y, 10, ZX_PALETTE.brightRed, 44, 0.26);
      world.audioQueue.push({ type: 'telegraph' });
      return;
    }
  }

  t.restored = true;
  t.restoreAnim = 0.45;
  world.combo += 1;
  world.comboTimer = 4.0;
  const bonus = 100 + Math.min(world.combo - 1, 5) * 25;
  world.score += bonus;
  world.bestScore = Math.max(world.bestScore, world.score);
  world.borderFlashColor =
    t.kind === 'caries'
      ? ZX_PALETTE.brightCyan
      : t.kind === 'fiber'
        ? ZX_PALETTE.brightYellow
        : ZX_PALETTE.brightGreen;
  world.borderFlashTimer = 0.1;

  spawnParticles(
    world,
    t.x,
    t.y,
    12,
    t.kind === 'caries' ? ZX_PALETTE.brightCyan : ZX_PALETTE.brightYellow,
    52,
    0.36
  );
  world.audioQueue.push({ type: 'restore' });
}

function damageEnemy(world: GameWorld, enemy: Enemy, poppedBubble = false): void {
  enemy.hp -= poppedBubble ? enemy.hp : 1;
  enemy.hitFlash = 0.08;
  world.hitstopTimer = 0.045;
  world.trauma = Math.min(1, world.trauma + (poppedBubble ? 0.42 : 0.32));

  if (enemy.hp <= 0) {
    releaseEnemyToken(world, enemy);
    enemy.state = 'ko';
    enemy.koTimer = 0.32;
    world.enemiesDefeated += 1;
    world.combo += 1;
    world.comboTimer = 4.0;
    const basePts = poppedBubble ? 250 : 150;
    world.score += basePts + Math.min(world.combo - 1, 5) * 25;
    world.bestScore = Math.max(world.bestScore, world.score);
    spawnParticles(
      world,
      enemy.x,
      enemy.y,
      poppedBubble ? 20 : 16,
      poppedBubble ? ZX_PALETTE.brightCyan : ZX_PALETTE.brightYellow,
      64,
      0.4
    );
    world.audioQueue.push({ type: poppedBubble ? 'bubblePop' : 'enemyKo' });
  } else {
    spawnParticles(world, enemy.x, enemy.y, 7, ZX_PALETTE.brightWhite, 42, 0.24);
    world.audioQueue.push({ type: 'enemyHit' });
  }
}

function updateParticles(world: GameWorld, dt: number): void {
  for (const p of world.particles) {
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
  }
}

export function getHudSnapshot(world: GameWorld): HudSnapshot {
  const targetsDone = world.targets.filter((t) => t.restored).length;
  return {
    phase: world.phase,
    stageIndex: world.stageIndex,
    totalStages: STAGES.length,
    stageTitle: world.stage.title,
    stageSubtitle: world.stage.subtitle,
    companyAct: world.stage.act,
    companyTag: world.stage.companyTag,
    locationTag: world.stage.locationTag,
    retroHomage: world.stage.retroHomage,
    activeHero: world.player.activeHero,
    dashReady: world.player.dashCooldown <= 0.01,
    dashCooldownRatio: Math.max(0, Math.min(1, 1 - world.player.dashCooldown / DASH_COOLDOWN)),
    stageRelicName: world.stageRelic.name,
    stageRelicCollected: world.stageRelic.collected,
    relicsCollectedCount: world.relicsCollected.length,
    chronicleText: world.chronicleTimer > 0 ? world.chronicleText : '',
    hp: world.player.hp,
    maxHp: world.player.maxHp,
    score: world.score,
    bestScore: world.bestScore,
    combo: world.combo,
    targetsDone,
    targetsTotal: world.targets.length,
    elapsedSec: world.elapsedSec,
    damageTaken: world.damageTaken,
    enemiesDefeated: world.enemiesDefeated,
    bossActive: Boolean(world.boss && world.boss.active && world.boss.phase < 4),
    bossPhase: world.boss ? world.boss.phase : 0,
    bossHp: world.boss ? world.boss.hp : 0,
    bossMaxHp: world.boss ? world.boss.maxHp : 0,
    plaqueCarried: world.plaqueCarried,
    checkpointStageIndex: world.checkpointStageIndex,
    radoPokeMode: world.radoPokeMode,
    pokePromptVisible: world.pokePromptVisible,
    coopEnabled: world.coopEnabled,
    playMode: world.playMode,
    modeTimer: world.modeTimer,
    timeRemaining: world.playMode === 'timed_arena' ? Math.max(0, world.modeTimer) : undefined,
    currentWave: world.playMode === 'wave_defense' ? world.currentWave : undefined,
    totalWaves: world.playMode === 'wave_defense' ? Math.max(1, stageWavesTotal(world.stage)) : undefined,
    partnerChargeRatio: world.partnerChargeProgress,
    relaySyncProgress: world.relaySolved ? 1 : 0,
  };
}

/** Total wave count for the current stage's wave_defense setup. */
function stageWavesTotal(stage: StageDefinition): number {
  return stage.totalWaves ?? stage.waves?.length ?? 0;
}

export function drainAudioQueue(world: GameWorld) {
  if (world.audioQueue.length === 0) return [];
  const items = world.audioQueue.slice();
  world.audioQueue.length = 0;
  return items;
}

export { GRID_COLS, GRID_ROWS, SCREEN_W, SCREEN_H };
