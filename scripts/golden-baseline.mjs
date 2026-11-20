import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createWorld,
  loadStage,
  stepWorld,
} from '../src/game/engine.ts';
import {
  simStateHash,
  cloneWorld,
} from '../src/game/hash.ts';
import { STAGES } from '../src/game/levels.ts';

const rootDir = resolve(process.cwd());
const OUT = resolve(rootDir, 'src/game/__fixtures__/golden-baseline.json');

const IDLE_INPUT = {
  up: false, down: false, left: false, right: false,
  fireJustPressed: false, fireHeld: false, dashJustPressed: false,
  swapHeroJustPressed: false,
};

const STEPS = 300; // ~5 seconds at 60 fps
const DT = 1 / 60;

/** Run a world for N steps and return the final simStateHash. */
function hashAfterSteps(world, input, steps = STEPS) {
  for (let i = 0; i < steps; i++) {
    stepWorld(world, DT, input);
  }
  return simStateHash(world);
}

/** Set coopEnabled on a world (2P). */
function setCoop(world, enabled) {
  world.coopEnabled = enabled;
  if (enabled) {
    world.player.partnerX = world.player.x - 14;
    world.player.partnerY = world.player.y;
  }
  return world;
}

/** Build baseline entries for one stage + mode + coop combination. */
function baselineFor(stageIndex, mode, coop) {
  const world = createWorld('playing');
  loadStage(world, stageIndex, false);
  world.playMode = mode;
  if (mode === 'timed_arena') {
    world.modeTimer = world.stage.timeLimitSec ?? 90;
  }
  if (mode === 'wave_defense') {
    world.hubHp = 3;
    world.currentWave = 0;
    const firstWave = world.stage.waves?.[0];
    world.enemiesToSpawn = firstWave
      ? firstWave.enemyComposition.reduce((s, c) => s + c.count, 0)
      : 0;
    world.spawnAccumulator = 0;
  }
  if (mode === 'relay_repair') {
    world.relaySolved = false;
  }
  setCoop(world, coop);

  const hash = hashAfterSteps(world, IDLE_INPUT);

  // Also capture mid-run hash (at step 150) for change detection
  const worldMid = cloneWorld(world);
  // Re-run from scratch to get mid-point
  const world2 = createWorld('playing');
  loadStage(world2, stageIndex, false);
  world2.playMode = mode;
  if (mode === 'timed_arena') world2.modeTimer = world2.stage.timeLimitSec ?? 90;
  if (mode === 'wave_defense') {
    world2.hubHp = 3;
    world2.currentWave = 0;
    const firstWave = world2.stage.waves?.[0];
    world2.enemiesToSpawn = firstWave
      ? firstWave.enemyComposition.reduce((s, c) => s + c.count, 0)
      : 0;
    world2.spawnAccumulator = 0;
  }
  if (mode === 'relay_repair') world2.relaySolved = false;
  setCoop(world2, coop);
  const midHash = hashAfterSteps(world2, IDLE_INPUT, 150);

  return {
    stageIndex,
    stageTitle: world.stage.title,
    mode,
    coop,
    hashMid: midHash,
    hashFinal: hash,
    steps: STEPS,
  };
}

const entries = [];

for (let stageIndex = 0; stageIndex < STAGES.length; stageIndex++) {
  // All stages in normal mode (1P and 2P)
  for (const coop of [false, true]) {
    entries.push(baselineFor(stageIndex, 'normal', coop));
  }

  // Stage 7 (index 6) also has special Service Incident Arc modes
  if (stageIndex === 6) {
    for (const mode of [
      'deploy_select',
      'timed_arena',
      'relay_repair',
      'wave_defense',
    ]) {
      for (const coop of [false, true]) {
        entries.push(baselineFor(stageIndex, mode, coop));
      }
    }
  }
}

const baseline = {
  generated: new Date().toISOString(),
  steps: STEPS,
  dt: DT,
  entries,
};

mkdirSync(resolve(rootDir, 'src/game/__fixtures'), { recursive: true });
writeFileSync(OUT, JSON.stringify(baseline, null, 2) + '\n');

console.log(`✅ Golden baseline written to ${OUT}`);
console.log(`   ${entries.length} entries`);
console.log(`   Stages: ${STAGES.length}, modes per stage 7: 5`);
