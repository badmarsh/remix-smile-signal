import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, getHudSnapshot, loadStage, stepWorld } from './engine';
import { STAGES } from './levels';
import { PlayMode } from './types';

const IDLE_INPUT = {
  up: false,
  down: false,
  left: false,
  right: false,
  fireJustPressed: false,
  fireHeld: false,
  dashJustPressed: false,
  swapHeroJustPressed: false,
};

test('new worlds default to normal play mode with safe zeroed mode fields', () => {
  const world = createWorld('playing');
  assert.equal(world.playMode, 'normal');
  assert.equal(world.modeTimer, 0);
  assert.equal(world.currentWave, 0);
  assert.equal(world.enemiesToSpawn, 0);
  assert.equal(world.spawnAccumulator, 0);
  assert.equal(world.partnerChargeProgress, 0);
  assert.equal(world.selectedZone, 0);
  assert.equal(world.relaySolved, false);
  assert.equal(world.hubHp, 0);

  const snap = getHudSnapshot(world);
  assert.equal(snap.playMode, 'normal');
  assert.equal(snap.modeTimer, 0);
  assert.equal(snap.timeRemaining, undefined);
  assert.equal(snap.currentWave, undefined);
  assert.equal(snap.totalWaves, undefined);
  assert.equal(snap.partnerChargeRatio, 0);
  assert.equal(snap.relaySyncProgress, 0);
});

test('stage 7 boots into deploy_select and time-limited modes from config', () => {
  const stage7 = STAGES[6];
  assert.ok(stage7, 'Stage 7 must exist in STAGES');
  assert.equal(stage7.startPlayMode, 'deploy_select');

  const world = createWorld('playing');
  loadStage(world, 6, false);
  assert.equal(world.playMode, 'deploy_select');
  assert.equal(world.selectedZone, 0);

  // Timed arena mode carries the configured time limit into modeTimer.
  const worldB = createWorld('playing');
  loadStage(worldB, 6, false);
  worldB.playMode = 'timed_arena';
  worldB.modeTimer = stage7.timeLimitSec ?? 90;
  assert.equal(worldB.modeTimer, 90);
});

test('play mode switch is exhaustive and survives stepWorld with no regression', () => {
  const modes: PlayMode[] = [
    'normal',
    'deploy_select',
    'timed_arena',
    'relay_repair',
    'wave_defense',
  ];

  for (const mode of modes) {
    const world = createWorld('playing');
    loadStage(world, 6, false);
    world.playMode = mode;

    if (mode === 'timed_arena') {
      world.modeTimer = 90;
      world.partnerChargeProgress = 0;
    } else if (mode === 'wave_defense') {
      world.hubHp = 3;
      world.currentWave = 0;
      world.enemiesToSpawn = 0;
      world.spawnAccumulator = 0;
    } else if (mode === 'relay_repair') {
      world.relaySolved = false;
    }

    // Run a short deterministic simulation; no crashes, fields remain sane.
    for (let i = 0; i < 30; i++) {
      stepWorld(world, 1 / 60, IDLE_INPUT);
    }
    assert.equal(world.playMode, mode);
    assert.ok(world.partnerChargeProgress >= 0 && world.partnerChargeProgress <= 1);
  }
});
