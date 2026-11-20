import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, getHudSnapshot, loadStage, setCoopMode, stepWorld } from '../engine';
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

function deployWorld() {
  const world = createWorld('playing');
  loadStage(world, 6, false);
  world.playMode = 'deploy_select';
  return world;
}

function relayWorld() {
  const world = createWorld('playing');
  loadStage(world, 6, false);
  world.playMode = 'relay_repair';
  world.boss = null;
  return world;
}

test('deploy select: standing on a zone marker and firing selects the zone and advances to timed_arena', () => {
  const world = deployWorld();
  const stage = world.stage;

  // Find zone marker '1' on the grid
  let zx = -1,
    zy = -1;
  for (let r = 0; r < stage.grid.length; r++) {
    const c = stage.grid[r].indexOf('1');
    if (c >= 0) {
      zx = c * 8 + 4;
      zy = r * 8 + 4;
      break;
    }
  }
  assert.ok(zx >= 0, 'Stage 7 must have zone marker 1');

  world.player.x = zx;
  world.player.y = zy;
  stepWorld(world, 0.016, { ...IDLE_INPUT, fireJustPressed: true });

  assert.equal(world.playMode, 'timed_arena', 'Selecting a zone should start timed_arena');
  assert.equal(world.selectedZone, 0, 'Zone 1 should map to selectedZone 0');
  assert.equal(world.modeTimer, stage.timeLimitSec, 'Timer should carry the stage time limit');
});

test('relay repair: touching both fiber endpoints sequentially sets relaySolved', () => {
  const world = relayWorld();
  const fibers = world.targets.filter((t) => t.kind === 'fiber');
  assert.ok(fibers.length >= 2, 'Stage 7 must have at least 2 fiber relay endpoints');

  // Touch endpoint A
  world.player.x = fibers[0].x;
  world.player.y = fibers[0].y;
  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(fibers[0].restored, true, 'Endpoint A should be restored on touch');
  assert.equal(world.relaySolved, false, 'Not solved until both endpoints are connected');

  // Touch endpoint B
  world.player.x = fibers[1].x;
  world.player.y = fibers[1].y;
  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(fibers[1].restored, true, 'Endpoint B should be restored on touch');
  assert.equal(world.relaySolved, true, 'Both endpoints restored → relay solved');
  const snap = getHudSnapshot(world);
  assert.equal(snap.relaySyncProgress, 1, 'Relay sync should be full when solved');
});

test('relay repair 2P sync: both players at endpoints gives full sync progress', () => {
  const world = relayWorld();
  setCoopMode(world, true);
  const fibers = world.targets.filter((t) => t.kind === 'fiber');
  assert.ok(fibers.length >= 2);

  // P1 (Zúbok) at endpoint A, P2 (Signálik) at endpoint B
  world.player.x = fibers[0].x;
  world.player.y = fibers[0].y;
  world.player.partnerX = fibers[1].x;
  world.player.partnerY = fibers[1].y;

  const snap = getHudSnapshot(world);
  assert.equal(snap.playMode, 'relay_repair');
  assert.equal(snap.relaySyncProgress, 1, 'Both endpoints covered → full sync');
});

test('relay repair partner assist: solo player can connect both endpoints alone', () => {
  const world = relayWorld();
  assert.equal(world.coopEnabled, false, 'Solo mode by default');

  const fibers = world.targets.filter((t) => t.kind === 'fiber');

  // Solo player visits endpoint A then endpoint B
  world.player.x = fibers[0].x;
  world.player.y = fibers[0].y;
  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(world.relaySolved, false);

  world.player.x = fibers[1].x;
  world.player.y = fibers[1].y;
  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(world.relaySolved, true, 'Solo player can connect both endpoints');

  const snap = getHudSnapshot(world);
  assert.equal(snap.playMode, 'relay_repair');
  assert.equal(snap.selectedZone, 0, 'selectedZone is exposed on the HUD snapshot');
});
