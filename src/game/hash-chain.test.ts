import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorld,
  loadStage,
  stepWorld,
} from './engine';
import {
  simStateHash,
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

const RIGHT_INPUT: InputState = { ...IDLE_INPUT, right: true };
const FIRE_INPUT: InputState = { ...IDLE_INPUT, fireJustPressed: true };

/** Run n steps with a given input, recording the sim hash every `every` steps. */
function recordHashChain(
  world: ReturnType<typeof createWorld>,
  input: InputState,
  steps: number,
  every: number
): string[] {
  const hashes: string[] = [];
  for (let i = 0; i < steps; i++) {
    stepWorld(world, 1 / 60, input);
    if ((i + 1) % every === 0) {
      hashes.push(simStateHash(world));
    }
  }
  return hashes;
}

/** Build a fresh Stage 7 timed_arena world. */
function timedWorld(): ReturnType<typeof createWorld> {
  const world = createWorld('playing');
  loadStage(world, 6, false);
  world.playMode = 'timed_arena';
  world.modeTimer = 90;
  return world;
}

test('golden replay: identical input sequence produces identical hash chain every 25 ticks', () => {
  const chainA = recordHashChain(timedWorld(), RIGHT_INPUT, 150, 25);
  const chainB = recordHashChain(timedWorld(), RIGHT_INPUT, 150, 25);

  assert.deepEqual(chainA, chainB, 'Golden replay: identical inputs must yield identical hash chain');
  assert.equal(chainA.length, 6, 'Expected 6 checkpoints (150 steps / 25)');
  assert.match(chainA[0], /^[0-9a-f]{8}$/, 'Each hash must be 8-char hex');
});

test('golden replay: different input sequences produce divergent hash chains', () => {
  const chainA = recordHashChain(timedWorld(), RIGHT_INPUT, 100, 25);
  const chainB = recordHashChain(timedWorld(), { ...IDLE_INPUT, left: true }, 100, 25);

  let diverged = false;
  for (let i = 0; i < chainA.length; i++) {
    if (chainA[i] !== chainB[i]) {
      diverged = true;
      break;
    }
  }
  assert.ok(diverged, 'Different movement inputs must eventually diverge the hash chain');
});

test('hash chain covers all five play modes without cross-mode collision', () => {
  const modes: PlayMode[] = [
    'normal',
    'deploy_select',
    'timed_arena',
    'relay_repair',
    'wave_defense',
  ];
  const chains: string[][] = [];

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

    chains.push(recordHashChain(world, RIGHT_INPUT, 60, 20));
  }

  // Every mode's final hash must be unique
  const finals = chains.map((c) => c[c.length - 1]);
  const unique = new Set(finals);
  assert.equal(unique.size, modes.length, 'Each play mode must produce a unique final hash');
});

test('hash chain is stable across repeated full-mode simulations (frontfall-style every-50-ticks)', () => {
  const runChain = () => {
    const world = timedWorld();
    return recordHashChain(world, FIRE_INPUT, 200, 50);
  };

  const chain1 = runChain();
  const chain2 = runChain();
  const chain3 = runChain();

  assert.deepEqual(chain1, chain2, 'Run 1 and Run 2 must produce identical hash chains');
  assert.deepEqual(chain2, chain3, 'Run 2 and Run 3 must produce identical hash chains');
});

test('counterfactual fork: same prefix, different fire input, hashes diverge after fork point', () => {
  // Build the common prefix state
  const prefixWorld = timedWorld();
  for (let i = 0; i < 40; i++) {
    stepWorld(prefixWorld, 1 / 60, RIGHT_INPUT);
  }
  const prefixHash = simStateHash(prefixWorld);

  // Fork A: continue with right input
  const forkA = cloneWorld(prefixWorld);
  recordHashChain(forkA, RIGHT_INPUT, 60, 20);
  const hashA = simStateHash(forkA);

  // Fork B: counterfactual — continue with fire input
  const forkB = cloneWorld(prefixWorld);
  recordHashChain(forkB, FIRE_INPUT, 60, 20);
  const hashB = simStateHash(forkB);

  assert.equal(simStateHash(prefixWorld), prefixHash, 'Prefix hash is stable');
  assert.notEqual(hashA, hashB, 'Counterfactual forks with different inputs must diverge');
});
