import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, getHudSnapshot, loadStage, stepWorld } from '../engine';
import { STAGES } from '../levels';
import { InputState, PlayMode } from '../types';

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

function timedWorld() {
  const world = createWorld('playing');
  loadStage(world, 6, false);
  world.playMode = 'timed_arena';
  world.modeTimer = world.stage.timeLimitSec ?? 90;
  return world;
}

test('timed arena countdown decrements at fixed dtSec rate and reaches zero', () => {
  const world = timedWorld();
  world.modeTimer = 0.1;
  // dt is clamped to 0.05 max, so two steps are needed to consume 0.1s
  stepWorld(world, 0.1, IDLE_INPUT);
  assert.equal(world.modeTimer, 0.05);
  stepWorld(world, 0.1, IDLE_INPUT);
  assert.equal(world.modeTimer, 0);
  // Timer expiry arms the defeat beat (gameover follows after the beat)
  assert.ok(world.defeatBeatTimer > 0);
  const snap = getHudSnapshot(world);
  assert.equal(snap.playMode, 'timed_arena');
  assert.equal(snap.timeRemaining, 0);
});

test('exit tile E detection advances from timed_arena to relay_repair', () => {
  const world = timedWorld();
  const stage = world.stage;
  let ex = -1;
  let ey = -1;
  for (let r = 0; r < stage.grid.length; r++) {
    const c = stage.grid[r].indexOf('E');
    if (c >= 0) {
      ex = c * 8 + 4;
      ey = r * 8 + 4;
      break;
    }
  }
  assert.ok(ex >= 0, 'Stage 7 must contain an exit tile E');
  world.player.x = ex;
  world.player.y = ey;
  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(world.playMode, 'relay_repair', 'Reaching exit E should advance to relay_repair');
  assert.equal(world.partnerChargeProgress, 0, 'Charge resets at the exit door');
});

test('partner charge fills while fire held and releases AoE blast on release at sufficient charge', () => {
  const world = timedWorld();
  const enemy = world.enemies[0];
  // Park an enemy right next to the player so the blast catches it
  enemy.x = world.player.x + 10;
  enemy.y = world.player.y;
  enemy.state = 'move';

  // Charge for ~0.9s (chargeDuration is 1.5s -> progress ~0.6, sufficient)
  for (let i = 0; i < 54; i++) {
    stepWorld(world, 1 / 60, { ...IDLE_INPUT, fireHeld: true });
  }
  assert.ok(
    world.partnerChargeProgress >= 0.5,
    `Charge should reach sufficient level, got ${world.partnerChargeProgress.toFixed(2)}`
  );
  assert.ok(world.partnerChargeProgress <= 1, 'Charge must be clamped at 100%');

  // Release fire -> AoE blast should bubble the nearby enemy
  stepWorld(world, 1 / 60, { ...IDLE_INPUT, fireHeld: false });
  assert.equal(world.partnerChargeProgress, 0, 'Charge resets on release');
  assert.equal(enemy.state, 'bubbled', 'AoE blast should bubble nearby enemy');
});

test('timer zero triggers defeat beat then gameover', () => {
  const world = timedWorld();
  world.modeTimer = 0.01;
  stepWorld(world, 0.02, IDLE_INPUT);
  assert.equal(world.modeTimer, 0);
  assert.equal(world.defeatBeatTimer, 0.55);
  // Walk the defeat beat to gameover
  for (let i = 0; i < 20; i++) {
    stepWorld(world, 0.04, IDLE_INPUT);
  }
  assert.equal(world.phase, 'gameover');
  const snap = getHudSnapshot(world);
  assert.equal(snap.playMode, 'timed_arena');
});
