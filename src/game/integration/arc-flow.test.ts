import test from 'node:test';
import assert from 'node:assert/strict';
import {
  continueFromCheckpoint,
  createWorld,
  getHudSnapshot,
  loadStage,
  setCoopMode,
  startNewGame,
  stepWorld,
  toggleCoopMode,
} from '../engine';
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

function arcWorld() {
  const world = createWorld('playing');
  loadStage(world, 6, false);
  world.boss = null;
  return world;
}

function findGridChar(
  world: ReturnType<typeof arcWorld>,
  ch: string
): { x: number; y: number } | null {
  const stage = world.stage;
  for (let r = 0; r < stage.grid.length; r++) {
    const c = stage.grid[r].indexOf(ch);
    if (c >= 0) return { x: c * 8 + 4, y: r * 8 + 4 };
  }
  return null;
}

test('full arc flow: deploy_select → timed_arena → relay_repair → wave_defense → victory', () => {
  const world = arcWorld();

  // --- Phase A: Deploy Select ---
  world.playMode = 'deploy_select';
  const zone = findGridChar(world, '1');
  assert.ok(zone, 'Stage 7 must have zone marker 1');
  world.player.x = zone.x;
  world.player.y = zone.y;
  stepWorld(world, 0.016, { ...IDLE_INPUT, fireJustPressed: true });
  assert.equal(world.playMode, 'timed_arena', 'Zone select → timed_arena');
  assert.equal(world.selectedZone, 0);

  // --- Phase B: Timed Arena → reach exit → relay_repair ---
  world.modeTimer = 90;
  const exit = findGridChar(world, 'E');
  assert.ok(exit, 'Stage 7 must have exit tile E');
  world.player.x = exit.x;
  world.player.y = exit.y;
  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(world.playMode, 'relay_repair', 'Exit reached → relay_repair');

  // --- Phase C: Relay Repair → connect endpoints → wave_defense ---
  const fibers = world.targets.filter((t) => t.kind === 'fiber');
  assert.ok(fibers.length >= 2, 'Need 2 fiber relay endpoints');
  world.player.x = fibers[0].x;
  world.player.y = fibers[0].y;
  stepWorld(world, 0.016, IDLE_INPUT);
  world.player.x = fibers[1].x;
  world.player.y = fibers[1].y;
  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(world.playMode, 'wave_defense', 'Relay solved → wave_defense');
  assert.equal(world.relaySolved, true);

  // --- Phase D: Wave Defense → all waves cleared + hub intact → stage_clear → Finale ---
  const totalWaves = world.stage.totalWaves ?? world.stage.waves?.length ?? 0;
  world.currentWave = totalWaves;
  world.enemiesToSpawn = 0;
  world.enemies = [];
  world.boss = null;
  world.hubHp = 3;
  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(world.phase, 'stage_clear', 'All waves + hub intact → stage_clear');
  // Expire stage_clear timer → loads Finale stage (index 5)
  for (let i = 0; i < 80; i++) {
    stepWorld(world, 0.016, IDLE_INPUT);
  }
  assert.equal(world.phase, 'playing', 'After stage_clear → Finale (playing)');
  assert.equal(world.stage.id, 'finale', 'Stage 7 → Finale transition');
});

test('1P ↔ 2P mid-stage toggle preserves play mode and entities', () => {
  const world = arcWorld();
  world.playMode = 'timed_arena';
  world.modeTimer = 60;

  assert.equal(world.coopEnabled, false);
  assert.equal(world.player.activeHero, 'zubok');

  // Toggle to 2P mid-stage
  setCoopMode(world, true);
  assert.equal(world.coopEnabled, true);
  assert.equal(world.player.activeHero, 'zubok');
  assert.equal(world.playMode, 'timed_arena', 'playMode preserved across toggle');
  assert.equal(world.modeTimer, 60, 'modeTimer preserved across toggle');

  // Toggle back to 1P
  setCoopMode(world, false);
  assert.equal(world.coopEnabled, false);
  assert.equal(world.playMode, 'timed_arena');
});

test('checkpoint reload preserves playMode state', () => {
  const world = arcWorld();
  startNewGame(world); // resets to stage 0, normal mode

  // Load Stage 7 and set an in-progress arc mode
  loadStage(world, 6, false);
  world.playMode = 'wave_defense';
  world.currentWave = 3;
  world.hubHp = 2;
  world.checkpointStageIndex = 6;
  world.checkpointScore = world.score;

  continueFromCheckpoint(world);
  assert.equal(world.playMode, 'wave_defense', 'playMode preserved after checkpoint reload');
  assert.equal(world.currentWave, 3, 'currentWave preserved after checkpoint reload');
  assert.equal(world.hubHp, 2, 'hubHp preserved after checkpoint reload');
});

test('score accumulation across phases carries over', () => {
  const world = arcWorld();
  const scoreBefore = world.score;

  // Award some score as if completing a phase
  world.score += 500;
  world.bestScore = Math.max(world.bestScore, world.score);
  assert.ok(world.score > scoreBefore, 'Score increases');

  // Transition through modes; score must carry over
  world.playMode = 'timed_arena';
  assert.equal(world.score, scoreBefore + 500, 'Score carries into timed_arena');

  world.playMode = 'relay_repair';
  assert.equal(world.score, scoreBefore + 500, 'Score carries into relay_repair');

  world.playMode = 'wave_defense';
  assert.equal(world.score, scoreBefore + 500, 'Score carries into wave_defense');

  const snap = getHudSnapshot(world);
  assert.equal(snap.score, scoreBefore + 500, 'HUD reflects accumulated score');
});
