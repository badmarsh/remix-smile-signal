/**
 * Core types for Zúbok a signálik (Didaktik M 256x192 retro arcade-adventure engine).
 * Inspired by Saboteur!, Dizzy/Towdie, Knight Lore, Elite, Target: Renegade,
 * Exolon/R-Type/F.I.R.E. (Melodik AY), Bubble Bobble, Atomix, Belegost & Boovie.
 */

import type { CitizenSpeechState } from './citizens';

export type GamePhase =
  | 'title'
  | 'playing'
  | 'paused'
  | 'stage_clear'
  | 'handover'
  | 'victory'
  | 'gameover';

export type PlayMode =
  | 'normal'
  | 'deploy_select'
  | 'timed_arena'
  | 'relay_repair'
  | 'wave_defense';

export type CompanyAct = 'microdent' | 'teatro' | 'gala';

export type ActiveHero = 'zubok' | 'signalik';

export type AudioChipMode = 'beeper' | 'melodik';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type EnemyArchetype = 'patroller' | 'kiter' | 'charger';

export type EnemyState = 'move' | 'telegraph' | 'attack' | 'recover' | 'bubbled' | 'ko';

export type RelicKind = 'cerec' | 'laser' | 'patchcord' | 'wifi' | 'chronicle' | 'plaque';

export type BossPhase = 1 | 2 | 3 | 4;

export type BossAttackKind = 'none' | 'radial_spread' | 'line_charge' | 'summon_patrollers';

export interface BossWeakSpot {
  id: number;
  offsetX: number;
  offsetY: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  hitFlash: number;
}

export interface BossState {
  active: boolean;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: BossPhase;
  hp: number;
  maxHp: number;
  weakSpots: BossWeakSpot[];
  state: 'move' | 'telegraph' | 'attack' | 'recover' | 'bubbled' | 'defeated';
  stateTimer: number;
  attackKind: BossAttackKind;
  attackAngle: number;
  chargeDirX: number;
  chargeDirY: number;
  bubbleTimer: number;
  hitFlash: number;
  hasAttackToken: boolean;
  attackCycleIdx: number;
  /** True for the final-wave boss fragment (1 weak spot, shorter cycles) */
  fragment?: boolean;
}

export interface HandoverConfetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export interface HandoverState {
  timer: number;
  portraitScale: number;
  revealedChars: number;
  fullText: string;
  creditsOffsetY: number;
  confetti: HandoverConfetti[];
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Direction;
  activeHero: ActiveHero;
  hp: number;
  maxHp: number;
  invulnTimer: number;
  fireCooldown: number;
  /** Saboteur! tactical ninja dash timers */
  dashTimer: number;
  dashCooldown: number;
  dashDirX: number;
  dashDirY: number;
  /** Bubble Bobble / R-Type companion partner position */
  partnerX: number;
  partnerY: number;
  partnerFacing: Direction;
  partnerAssistCooldown: number;
  partnerFireCooldown: number;
  partnerStepDist: number;
  partnerAnimFrame: number;
  stepDist: number;
  animFrame: number;
  squashX: number;
  squashY: number;
  hitFlash: number;
}

export interface Afterimage {
  active: boolean;
  x: number;
  y: number;
  hero: ActiveHero;
  flipX: boolean;
  life: number;
  maxLife: number;
}

export interface ObjectiveTarget {
  id: number;
  x: number;
  y: number;
  kind: 'caries' | 'fiber' | 'ornament';
  restored: boolean;
  pulsePhase: number;
  restoreAnim: number;
  /** 1-based sequence index for Stage 3 Atomix ordered fiber puzzle */
  orderIndex?: number;
}

export interface UvBeamHazard {
  kind: 'uv_beam';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  onDuration: number;
  offDuration: number;
  telegraphDuration: number;
  phaseOffset: number;
}

export interface CbctBeamHazard {
  kind: 'cbct_beam';
  cx: number;
  cy: number;
  length: number;
  angularSpeed: number;
  initialAngle: number;
}

export type StageHazardDef = UvBeamHazard | CbctBeamHazard;

export interface StageRelic {
  id: number;
  x: number;
  y: number;
  kind: RelicKind;
  name: string;
  chronicleNote: string;
  collected: boolean;
  bobPhase: number;
}

export interface BonusPickup {
  id: number;
  x: number;
  y: number;
  kind: 'crown' | 'coil' | 'gift';
  collected: boolean;
  points: number;
  bobPhase: number;
}

export interface Enemy {
  id: number;
  archetype: EnemyArchetype;
  act: CompanyAct;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  state: EnemyState;
  stateTimer: number;
  /** Bubble Bobble cyan signal-bubble trap timer */
  bubbleTimer: number;
  facing: Direction;
  hitFlash: number;
  koTimer: number;
  orbitAngle: number;
  chargeDirX: number;
  chargeDirY: number;
  hasAttackToken: boolean;
}

export interface Projectile {
  id: number;
  fromPlayer: boolean;
  kind: 'dental_laser' | 'signal_wave' | 'enemy_bolt';
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  active: boolean;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Snowflake {
  x: number;
  y: number;
  speedY: number;
  driftPhase: number;
  phase: number;
  size: number;
}

export interface StageDefinition {
  index: number;
  act: CompanyAct;
  title: string;
  subtitle: string;
  companyTag: string;
  /** Real Rimavská Sobota landmark / street */
  locationTag: string;
  /** Retro Didaktik / ZX Spectrum classic homage */
  retroHomage: string;
  /** Belegost / Lords of Midnight style opening chronicle line */
  openingChronicle: string;
  borderColorIdx: number;
  wallColor: string;
  wallAccent: string;
  floorDotColor: string;
  /** 32 columns x 24 rows (8x8 px tiles = 256x192 exact Didaktik M screen) */
  grid: string[];
  playerStart: Vec2;
  /** Dizzy / Towdie / Pedro collectible stage relic */
  relic: {
    x: number;
    y: number;
    kind: RelicKind;
    name: string;
    chronicleNote: string;
  };
  targets: Array<{ x: number; y: number; kind: 'caries' | 'fiber' | 'ornament' }>;
  pickups: Array<{ x: number; y: number; kind: 'crown' | 'coil' | 'gift'; points: number }>;
  enemies: Array<{ x: number; y: number; archetype: EnemyArchetype }>;
  /** Optional boss spawn & podium delivery coordinates (Stage 6 finale) */
  bossSpawn?: Vec2;
  podiumPos?: Vec2;
  /** Distinct stage environmental hazards (UV beams in Stage 1, rotating CBCT beam in Stage 2) */
  hazards?: StageHazardDef[];
  /** Stage 3 Atomix ordered target puzzle (must restore 1..N in order) */
  orderedTargets?: boolean;
  /** Stage 5 locked vault doors ('D' tiles) unlocked upon collecting this relic */
  doorsUnlockedByRelic?: RelicKind;
  /** Timed arena duration in seconds (Phase B) */
  timeLimitSec?: number;
  /** Wave defence spawn definition per wave (Phase D) */
  waves?: Array<{
    spawnTimer: number;
    enemyComposition: { archetype: EnemyArchetype; count: number }[];
    description: string;
  }>;
  /** Total wave count for wave_defense (defaults to waves.length) */
  totalWaves?: number;
  /** Partner charge tuning for timed_arena (Phase B) */
  partnerChargeConfig?: {
    chargeDuration: number;
    radius: number;
    damageMultiplier: number;
    label: string;
  };
  /** Play mode this stage boots into (Stage 7 defaults to deploy_select) */
  startPlayMode?: PlayMode;
}

export interface Player2Input {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fireJustPressed: boolean;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fireJustPressed: boolean;
  fireHeld: boolean;
  dashJustPressed?: boolean;
  swapHeroJustPressed?: boolean;
  /** Optional Player 2 controls (2P Co-op on one keyboard: Arrows + Enter/Right Shift) */
  p2?: Player2Input;
}

export interface AudioEvent {
  type:
    | 'shoot'
    | 'signalWave'
    | 'dash'
    | 'swapHero'
    | 'bubbleTrap'
    | 'bubblePop'
    | 'relicFound'
    | 'enemyHit'
    | 'enemyKo'
    | 'restore'
    | 'pickup'
    | 'jingle_bell'
    | 'telegraph'
    | 'playerHurt'
    | 'stageClear'
    | 'victory'
    | 'gameOver';
}

export interface HudSnapshot {
  phase: GamePhase;
  stageIndex: number;
  totalStages: number;
  stageTitle: string;
  stageSubtitle: string;
  companyAct: CompanyAct;
  companyTag: string;
  locationTag: string;
  retroHomage: string;
  activeHero: ActiveHero;
  dashReady: boolean;
  dashCooldownRatio: number;
  stageRelicName: string;
  stageRelicCollected: boolean;
  relicsCollectedCount: number;
  chronicleText: string;
  hp: number;
  maxHp: number;
  score: number;
  bestScore: number;
  combo: number;
  targetsDone: number;
  targetsTotal: number;
  elapsedSec: number;
  damageTaken: number;
  enemiesDefeated: number;
  bossActive: boolean;
  bossPhase: BossPhase | 0;
  bossHp: number;
  bossMaxHp: number;
  plaqueCarried: boolean;
  checkpointStageIndex: number;
    radoPokeMode: boolean;
    pokePromptVisible: boolean;
    coopEnabled: boolean;
    playMode: PlayMode;
    modeTimer: number;
    timeRemaining?: number;
    currentWave?: number;
    totalWaves?: number;
    partnerChargeRatio?: number;
    relaySyncProgress?: number;
    selectedZone?: number;
}

export interface GameWorld {
  phase: GamePhase;
  stageIndex: number;
  stage: StageDefinition;
  player: Player;
  stageRelic: StageRelic;
  relicsCollected: string[];
  chronicleText: string;
  chronicleTimer: number;
  afterimages: Afterimage[];
  afterimageCursor: number;
  targets: ObjectiveTarget[];
  pickups: BonusPickup[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  particleCursor: number;
  snowflakes: Snowflake[];
  score: number;
  bestScore: number;
  combo: number;
  comboTimer: number;
  elapsedSec: number;
  damageTaken: number;
  enemiesDefeated: number;
  hitstopTimer: number;
  trauma: number;
  borderFlashColor: string | null;
  borderFlashTimer: number;
  defeatBeatTimer: number;
  stageClearTimer: number;
  attractTime: number;
  activeAttackTokens: number;
  maxAttackTokens: number;
  nextEntityId: number;
  /** Stage 6 Boss "Veľký Rušič" state */
  boss: BossState | null;
  /** True while player is carrying the MVP plaque to the podium on Stage 6 */
  plaqueCarried: boolean;
  /** Stage 6 podium destination tile */
  podiumPos: Vec2 | null;
  /** 256x192 ceremonial handover cutscene state */
  handover: HandoverState | null;
  /** True when Stage 5 museum vault doors ('D') have been unlocked via Kronika 1270 relic */
  doorsOpen: boolean;
  /** Active NPC citizen speech bubble state (3s proximity display) */
  citizenSpeech: CitizenSpeechState;
  /** Latest reached stage index for friendly checkpoint continue */
  checkpointStageIndex: number;
  /** Score snapshot when entering the checkpoint stage */
  checkpointScore: number;
  /** Per-stage defeat counter used to trigger Spectrum POKE Rado prompt on 2nd loss */
  stageLosses: Record<number, number>;
  /** Friendly Spectrum POKE 48621,5 mode (+2 hearts, 30% slower enemy bolts) */
  radoPokeMode: boolean;
  /** True on gameover after 2nd loss in the same stage when Rado POKE is not yet enabled */
  pokePromptVisible: boolean;
  /** True when 2-player local co-op is active (P1 = Zúbok WASD+F/Space, P2 = Signálik Arrows+Enter) */
  coopEnabled: boolean;
  /** Queued sound triggers consumed by the browser audio bridge */
  audioQueue: AudioEvent[];
  /** Active play mode ('normal' default) */
  playMode: PlayMode;
  /** Countdown timer (timed_arena) / spawn accumulator (wave_defense) */
  modeTimer: number;
  /** wave_defense: 1-based active wave */
  currentWave: number;
  /** wave_defense: enemies left to spawn in current wave */
  enemiesToSpawn: number;
  /** wave_defense: time since last enemy spawn */
  spawnAccumulator: number;
  /** timed_arena / relay_repair: partner charge progress 0..1 */
  partnerChargeProgress: number;
  /** deploy_select: 0..3 cursor zone index */
  selectedZone: number;
  /** relay_repair: both endpoints connected */
  relaySolved: boolean;
  /** wave_defense: hub integrity (death at 0) */
  hubHp: number;
}
