import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, loadStage, stepWorld, getHudSnapshot } from '../engine';
import { simStateHash } from '../hash';
import { InputState } from '../types';

const IDLE_INPUT: InputState = {
  up: false, down: false, left: false, right: false,
  fireJustPressed: false, fireHeld: false, dashJustPressed: false,
  swapHeroJustPressed: false,
};

const DT = 1 / 60;

test('bot can move player through stage 1 without crash (basic playability)', () => {
  const world = createWorld('playing');
  loadStage(world, 0, true);
  const startHash = simStateHash(world);

  // Move right for 100 steps
  for (let i = 0; i < 100; i++) {
    stepWorld(world, DT, { ...IDLE_INPUT, right: true });
  }
  assert.notEqual(simStateHash(world), startHash, 'Player movement should change state hash');
  assert.equal(world.phase, 'playing', 'Game should still be playing');
});

test('bot can move through all four cardinal directions without crash', () => {
  const world = createWorld('playing');
  loadStage(world, 0, true);

  const directions: Array<keyof InputState> = ['up', 'down', 'left', 'right'];
  for (const dir of directions) {
    for (let i = 0; i < 50; i++) {
      const input: InputState = { ...IDLE_INPUT, [dir]: true };
      stepWorld(world, DT, input);
    }
  }
  assert.equal(world.phase, 'playing', 'Game should survive multi-direction movement');
});

test('HUD snapshot is consistent after bot movement', () => {
  const world = createWorld('playing');
  loadStage(world, 0, true);

  for (let i = 0; i < 100; i++) {
    stepWorld(world, DT, { ...IDLE_INPUT, right: true });
  }

  const snap = getHudSnapshot(world);
  assert.equal(snap.phase, 'playing');
  assert.equal(snap.stageIndex, 0);
  assert.ok(snap.hp > 0, 'Player should have health');
  assert.ok(snap.score >= 0, 'Score should be non-negative');
});
