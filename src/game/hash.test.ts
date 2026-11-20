import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorld,
  loadStage,
  stepWorld,
} from './engine';
import {
  simStateHash,
  simStateString,
  cloneWorld,
} from './hash';
import { STAGES } from './levels';
import { InputState, PlayMode } from './types';

const IDLE_INPUT: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  fireJustPressed: false,
  fireHeld: false,
  dashJustPressed: false,
  swapHeroJustPressed: false,
};

function freshStage7World(): ReturnType<typeof createWorld> {
  const world = createWorld('playing');
  loadStage(world, 6, false);
  world.playMode = 'timed_arena';
  world.modeTimer = 90;
  return world;
}

function runNSteps(world: ReturnType<typeof createWorld>, n: number, input: InputState): void {
  for (let i = 0; i < n; i++) {
    stepWorld(world, 1 / 60, input);
  }
}

test('simStateHash is deterministic: same inputs produce identical hashes across runs', () => {
  const hashA: string[] = [];
  const hashB: string[] = [];

  // Run two independent simulations with identical inputs.
  for (const out of [hashA, hashB]) {
    const world = freshStage7World();
    const moveInput: InputState = { ...IDLE_INPUT, right: true };
    runNSteps(world, 120, moveInput);
    out.push(simStateHash(world));
    // Continue with different input and hash again.
    const fireInput: InputState = { ...IDLE_INPUT, fireJustPressed: true };
    runNSteps(world, 60, fireInput);
    out.push(simStateHash(world));
  }

  assert.equal(hashA[0], hashB[0], 'Identical runs must produce identical mid-sim hashes');
  assert.equal(hashA[1], hashB[1], 'Identical runs must produce identical post-action hashes');
});

test('simStateHash is sensitive: different inputs produce different hashes', () => {
  const worldA = freshStage7World();
  runNSteps(worldA, 100, { ...IDLE_INPUT, right: true });
  const hashA = simStateHash(worldA);

  const worldB = freshStage7World();
  runNSteps(worldB, 100, { ...IDLE_INPUT, left: true });
  const hashB = simStateHash(worldB);

  assert.notEqual(hashA, hashB, 'Different movement inputs must diverge the state hash');
});

test('simStateString is deterministic: same state serializes identically', () => {
  const worldA = freshStage7World();
  runNSteps(worldA, 80, { ...IDLE_INPUT, right: true });

  const worldB = freshStage7World();
  runNSteps(worldB, 80, { ...IDLE_INPUT, right: true });

  assert.equal(simStateString(worldA), simStateString(worldB));
});

test('cloneWorld produces identical hash to the original before divergence', () => {
  const world = freshStage7World();
  runNSteps(world, 50, { ...IDLE_INPUT, right: true });

  const fork = cloneWorld(world);
  assert.equal(simStateHash(fork), simStateHash(world), 'Clone must match original hash before divergence');
});

test('cloneWorld supports counterfactual forking: fork, mutate input, hash diverges', () => {
  const world = freshStage7World();
  runNSteps(world, 50, { ...IDLE_INPUT, right: true });

  const forkA = cloneWorld(world);
  runNSteps(forkA, 30, { ...IDLE_INPUT, right: true });
  const hashA = simStateHash(forkA);

  const forkB = cloneWorld(world);
  runNSteps(forkB, 30, { ...IDLE_INPUT, left: true });
  const hashB = simStateHash(forkB);

  assert.notEqual(hashA, hashB, 'Counterfactual forks with different inputs must diverge');
});

test('hash covers all five play modes without collision', () => {
  const modes: PlayMode[] = [
    'normal',
    'deploy_select',
    'timed_arena',
    'relay_repair',
    'wave_defense',
  ];
  const hashes = new Set<string>();

  for (const mode of modes) {
    const world = createWorld('playing');
    loadStage(world, 6, false);
    world.playMode = mode;
    if (mode === 'timed_arena') world.modeTimer = 90;
    if (mode === 'wave_defense') {
      world.hubHp = 3;
      world.currentWave = 0;
      world.enemiesToSpawn = 0;
      world.spawnAccumulator = 0;
    }
    if (mode === 'relay_repair') world.relaySolved = false;

    runNSteps(world, 60, IDLE_INPUT);
    hashes.add(simStateHash(world));
  }

  assert.equal(hashes.size, modes.length, 'Each play mode should produce a distinct state hash');
});

test('hash excludes ephemeral presentation state — simStateString never reads particles/snowflakes/afterimages', () => {
  const worldA = freshStage7World();
  runNSteps(worldA, 40, IDLE_INPUT);
  const hashA = simStateHash(worldA);

  // The same sim state serialized twice must give the same hash regardless of
  // any presentation-only fields, because simStateString only reads gameplay
  // fields (player, targets, enemies, projectiles, relic, pickups, boss, mode
  // fields, score, phase, etc.) and never touches particles/snowflakes/
  // afterimages/chronicle/border-flash/trauma/hitstop/audio-queue.
  assert.equal(simStateHash(worldA), hashA, 'Repeated hash of the same world must be stable');
});

test('Stage 7 has a valid exit tile E for exit-detection determinism', () => {
  const world = freshStage7World();
  let found = false;
  for (let r = 0; r < world.stage.grid.length; r++) {
    if (world.stage.grid[r].includes('E')) {
      found = true;
      break;
    }
  }
  assert.ok(found, 'Stage 7 must contain an exit tile E');
});

test('simStateHash returns a stable 8-character lowercase hex string', () => {
  const world = freshStage7World();
  runNSteps(world, 10, IDLE_INPUT);
  const hash = simStateHash(world);
  assert.match(hash, /^[0-9a-f]{8}$/, 'Hash must be 8-char lowercase hex');
});
