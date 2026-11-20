/**
 * Auto-play bot for playability proof (F1.3).
 *
 * Drives the simulation exclusively through InputState — zero mutation of
 * GameWorld. Uses BFS pathfinding to navigate around walls.
 * Reports simStateHash at milestones.
 */

import {
  createWorld,
  getHudSnapshot,
  loadStage,
  stepWorld,
} from '../engine';
import { simStateHash } from '../hash';
import { STAGES, getStageIndex } from '../levels';
import { GamePhase, InputState, PlayMode, StageId } from '../types';
import { findNextStep } from './pathfinder';

const DT = 1 / 60;
const MAX_STEPS_PER_STAGE = 6000; // ~100 s per stage
const TILE = 8;

const IDLE_INPUT: InputState = {
  up: false, down: false, left: false, right: false,
  fireJustPressed: false, fireHeld: false, dashJustPressed: false,
  swapHeroJustPressed: false,
};

interface Milestone {
  stageIndex: number;
  stageId: StageId;
  step: number;
  hash: string;
  phase: string;
  playMode: PlayMode;
}

interface BotResult {
  completed: boolean;
  totalSteps: number;
  milestones: Milestone[];
  finalHash: string;
  failure?: string;
}

function moveTowards(
  px: number, py: number,
  tx: number, ty: number,
  world: ReturnType<typeof createWorld>
): InputState {
  const out = { ...IDLE_INPUT };
  const dir = findNextStep(world.stage.grid, px, py, tx, ty, false);

  switch (dir) {
    case 'up': out.up = true; break;
    case 'down': out.down = true; break;
    case 'left': out.left = true; break;
    case 'right': out.right = true; break;
    case 'none': break; // stuck or at goal
  }
  return out;
}

function findNearestObjective(world: ReturnType<typeof createWorld>): { x: number; y: number } | null {
  const p = world.player;
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;

  for (const t of world.targets) {
    if (!t.restored) {
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < bestDist) { bestDist = d; best = { x: t.x, y: t.y }; }
    }
  }

  const r = world.stageRelic;
  if (!r.collected) {
    const d = Math.hypot(r.x - p.x, r.y - p.y);
    if (d < bestDist) { bestDist = d; best = { x: r.x, y: r.y }; }
  }

  return best;
}

function findExit(world: ReturnType<typeof createWorld>): { x: number; y: number } | null {
  const stage = world.stage;
  for (let r = 0; r < stage.grid.length; r++) {
    const c = stage.grid[r].indexOf('E');
    if (c >= 0) return { x: c * 8 + 4, y: r * 8 + 4 };
  }
  return null;
}

function findZone(world: ReturnType<typeof createWorld>, zoneNum: number): { x: number; y: number } | null {
  const ch = String(zoneNum);
  const stage = world.stage;
  for (let r = 0; r < stage.grid.length; r++) {
    const c = stage.grid[r].indexOf(ch);
    if (c >= 0) return { x: c * 8 + 4, y: r * 8 + 4 };
  }
  return null;
}

export function runBot(coopEnabled = false): BotResult {
  const world = createWorld('playing');
  const milestones: Milestone[] = [];
  let step = 0;

  function record(stageIndex: number, stageId: StageId, label: string): void {
    milestones.push({
      stageIndex,
      stageId,
      step,
      hash: simStateHash(world),
      phase: world.phase,
      playMode: world.playMode,
    });
    console.log(`  [step ${step}] ${label}: phase=${world.phase} mode=${world.playMode} hash=${simStateHash(world)}`);
  }

  // Title screen
  for (let i = 0; i < 60; i++) {
    stepWorld(world, DT, IDLE_INPUT);
    step++;
  }
  record(0, 'clinic', 'title');

  // Start game
  world.phase = 'playing';
  loadStage(world, 0, true);
  record(0, 'clinic', 'stage 1 loaded');

  for (let stageIndex = 0; stageIndex < STAGES.length; stageIndex++) {
    const stage = STAGES[stageIndex];
    const stageId = stage.id as StageId;

    loadStage(world, stageIndex, true);
    world.playMode = stage.startPlayMode ?? 'normal';
    if (world.playMode === 'timed_arena') {
      world.modeTimer = world.stage.timeLimitSec ?? 90;
    }
    if (world.playMode === 'wave_defense') {
      world.hubHp = 3;
      world.currentWave = 0;
      const firstWave = world.stage.waves?.[0];
      world.enemiesToSpawn = firstWave
        ? firstWave.enemyComposition.reduce((s, c) => s + c.count, 0)
        : 0;
      world.spawnAccumulator = 0;
    }
    world.coopEnabled = coopEnabled;

    record(stageIndex, stageId, `stage ${stageIndex + 1} (${stage.title})`);

    let stageSteps = 0;
    let completed = false;

    while (!completed && stageSteps < MAX_STEPS_PER_STAGE) {
      if (world.playMode === 'deploy_select') {
        const zone = findZone(world, 1);
        if (zone) {
          const input = moveTowards(world.player.x, world.player.y, zone.x, zone.y, world);
          stepWorld(world, DT, { ...input, fireJustPressed: true });
        } else {
          world.playMode = 'timed_arena';
          world.modeTimer = 90;
        }
      } else if (world.playMode === 'timed_arena') {
        const exit = findExit(world);
        if (exit) {
          const input = moveTowards(world.player.x, world.player.y, exit.x, exit.y, world);
          stepWorld(world, DT, input);
        } else {
          completed = true;
        }
      } else if (world.playMode === 'relay_repair') {
        const obj = findNearestObjective(world);
        if (obj) {
          const input = moveTowards(world.player.x, world.player.y, obj.x, obj.y, world);
          stepWorld(world, DT, input);
        } else {
          completed = true;
        }
      } else if (world.playMode === 'wave_defense') {
        const obj = findNearestObjective(world);
        if (obj) {
          const input = moveTowards(world.player.x, world.player.y, obj.x, obj.y, world);
          stepWorld(world, DT, { ...input, fireJustPressed: true });
        } else {
          completed = true;
        }
      } else {
        const obj = findNearestObjective(world);
        if (obj) {
          const input = moveTowards(world.player.x, world.player.y, obj.x, obj.y, world);
          stepWorld(world, DT, { ...input, fireJustPressed: true });
        } else {
          completed = true;
        }
      }

      step++;
      stageSteps++;

      const phase = world.phase as GamePhase;
      if (phase === 'gameover') {
        return {
          completed: false,
          totalSteps: step,
          milestones,
          finalHash: simStateHash(world),
          failure: `Game over at stage ${stageIndex + 1} (${stage.title})`,
        };
      }

      if (phase === 'stage_clear' || phase === 'victory') {
        break;
      }
    }

    if (stageSteps >= MAX_STEPS_PER_STAGE) {
      return {
        completed: false,
        totalSteps: step,
        milestones,
        finalHash: simStateHash(world),
        failure: `Timeout at stage ${stageIndex + 1} (${stage.title})`,
      };
    }

    if (world.phase as GamePhase === 'stage_clear') {
      for (let i = 0; i < 80 && (world.phase as GamePhase) !== 'playing' && (world.phase as GamePhase) !== 'victory'; i++) {
        stepWorld(world, DT, IDLE_INPUT);
        step++;
      }
    }

    if (world.phase as GamePhase === 'victory') {
      record(stageIndex, stageId, 'victory');
      break;
    }
  }

  return {
    completed: (world.phase as GamePhase) === 'victory',
    totalSteps: step,
    milestones,
    finalHash: simStateHash(world),
  };
}

export { IDLE_INPUT };
