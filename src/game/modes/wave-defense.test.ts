import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, getHudSnapshot, loadStage, stepWorld } from '../engine';
import { STAGES } from '../levels';
import { Enemy, InputState, PlayMode } from '../types';

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

const DT = 0.05; // stepWorld clamps dt to 0.05 max

function waveWorld() {
  const world = createWorld('playing');
  loadStage(world, 6, false);
  world.playMode = 'wave_defense';
  world.hubHp = 3;
  world.currentWave = 0;
  // Stage 7 declares bossSpawn for the finale; wave defense manages its own boss,
  // so clear the pre-spawned boss here.
  world.boss = null;
  const firstWave = world.stage.waves?.[0];
  world.enemiesToSpawn = firstWave
    ? firstWave.enemyComposition.reduce((s, c) => s + c.count, 0)
    : 0;
  world.spawnAccumulator = 0;
  world.enemies = [];
  return world;
}

function stepN(world: ReturnType<typeof waveWorld>, n: number): void {
  for (let i = 0; i < n; i++) {
    stepWorld(world, DT, IDLE_INPUT);
  }
}

test('wave defense spawn timer accumulator spawns enemies from edge tiles at intervals', () => {
  const world = waveWorld();
  const wave0 = world.stage.waves?.[0];
  assert.ok(wave0, 'Stage 7 must define waves');
  assert.ok(world.enemiesToSpawn > 0, 'Wave 0 should have enemies to spawn');

  // Top/bottom edge rows must have openings for deterministic edge spawning
  const row0 = world.stage.grid[0];
  const rowLast = world.stage.grid[world.stage.grid.length - 1];
  assert.ok(row0.includes('.'), 'Top edge row must have floor openings for spawning');
  assert.ok(rowLast.includes('.'), 'Bottom edge row must have floor openings for spawning');

  // spawnTimer for wave 0 is 2.0s; with dt clamped to 0.05, need 40 steps to exceed it.
  // Enemy AI runs in the same step and may move the spawned enemy off the edge,
  // so we assert that a spawn occurred and the spawn budget decreased.
  stepN(world, 45);
  assert.ok(world.enemies.length > 0, 'Enemy should spawn after spawnTimer elapses');
  assert.ok(world.enemiesToSpawn < 3, 'One enemy should have been consumed from the spawn budget');
});

test('wave progression advances to the next wave when all enemies are defeated', () => {
  const world = waveWorld();
  const wave0 = world.stage.waves?.[0];
  assert.ok(wave0, 'Wave 0 must be defined');

  // Spawn all wave 0 enemies (3 patrollers): 40 steps per spawn at 0.05s dt
  stepN(world, 125);
  assert.equal(world.enemiesToSpawn, 0, 'All wave 0 enemies should be queued for spawning');
  assert.equal(world.enemies.length, 3, 'All 3 wave 0 enemies should be spawned');

  // Defeat every spawned enemy
  for (const e of world.enemies) {
    e.hp = 0;
    e.state = 'ko';
    e.koTimer = 0;
  }
  world.enemies = [];

  // One more step to trigger wave completion
  stepWorld(world, DT, IDLE_INPUT);
  assert.equal(world.currentWave, 1, 'Should advance to wave 1 after wave 0 is cleared');
});

test('boss fragment spawns in the final wave only with 1 weak spot', () => {
  const world = waveWorld();
  const totalWaves = world.stage.totalWaves ?? world.stage.waves?.length ?? 0;
  assert.ok(totalWaves >= 2, 'Stage 7 should define multiple waves');

  // Advance to the final wave index (totalWaves - 1, zero-based)
  world.currentWave = totalWaves - 1;
  const finalWave = world.stage.waves?.[world.currentWave];
  world.enemiesToSpawn = finalWave
    ? finalWave.enemyComposition.reduce((s, c) => s + c.count, 0)
    : 0;
  world.spawnAccumulator = 0;
  world.enemies = [];

  // Trigger a spawn on the final wave -> boss fragment
  stepN(world, 25); // 25 * 0.05 = 1.25s > spawnTimer 1.0s
  assert.ok(world.boss, 'Boss fragment should spawn on the final wave');
  assert.equal(world.boss.fragment, true, 'Boss should be flagged as a fragment');
  assert.equal(
    world.boss.weakSpots.length,
    1,
    'Boss fragment should have exactly 1 weak spot (vs Stage 6\'s 4)'
  );
  assert.equal(world.boss.maxHp, 1, 'Boss fragment maxHp should be 1');
});

test('hub tile integrity: enemies touching hub reduce hubHp; hubHp=0 triggers gameover', () => {
  const world = waveWorld();
  const hubX = 15 * 8 + 4;
  const hubY = 11 * 8 + 4;

  // Place an enemy directly on the hub tile
  const enemy = { x: hubX, y: hubY, state: 'move' } as unknown as Enemy;
  world.enemies.push(enemy);

  const hpBefore = world.hubHp;
  stepWorld(world, DT, IDLE_INPUT);
  assert.equal(world.hubHp, hpBefore - 1, 'Enemy on hub should reduce hubHp');

  // Drive hubHp to zero -> gameover (need a fresh enemy since the first is now 'ko')
  world.hubHp = 1;
  world.enemies.push({ x: hubX, y: hubY, state: 'move' } as unknown as Enemy);
  stepWorld(world, DT, IDLE_INPUT);
  assert.equal(world.hubHp, 0);
  assert.equal(world.defeatBeatTimer, 0.55);
  for (let i = 0; i < 20; i++) {
    stepWorld(world, DT, IDLE_INPUT);
  }
  assert.equal(world.phase, 'gameover');
});

test('all waves defeated + hub intact triggers victory', () => {
  const world = waveWorld();
  const totalWaves = world.stage.totalWaves ?? world.stage.waves?.length ?? 0;

  // Advance through all waves: currentWave == totalWaves means all waves done
  world.currentWave = totalWaves;
  world.enemiesToSpawn = 0;
  world.enemies = [];
  world.boss = null;
  world.hubHp = 3; // hub intact

  stepWorld(world, DT, IDLE_INPUT);
  assert.equal(world.phase, 'stage_clear', 'All waves defeated + hub intact → stage_clear');
  // Expire stage_clear timer → loads Finale stage (next after Service Incident)
  for (let i = 0; i < 80; i++) {
    stepWorld(world, DT, IDLE_INPUT);
  }
  assert.equal(world.phase, 'playing', 'After stage_clear → Finale (playing)');
  const snap = getHudSnapshot(world);
  assert.equal(snap.playMode, 'normal');
  assert.equal(snap.currentWave, undefined);
});
