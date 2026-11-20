import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorld, loadStage, setCoopMode, stepWorld } from './engine';
import { InputState } from './types';

const IDLE: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  fireJustPressed: false,
  fireHeld: false,
};

test('2P Co-op allows Player 2 (Signálik) to move independently and fire twin signal_wave bolts while Player 1 controls Zúbok', () => {
  const world = createWorld('playing');
  setCoopMode(world, true);

  assert.equal(world.coopEnabled, true);
  assert.equal(world.player.activeHero, 'zubok', 'P1 should be Zúbok in 2P co-op');

  const startP1X = world.player.x;
  const startP2X = world.player.partnerX;

  // Move ONLY Player 2 to the right and fire P2's Signálik twin wave
  stepWorld(world, 0.05, {
    ...IDLE,
    p2: { up: false, down: false, left: false, right: true, fireJustPressed: true },
  });

  assert.equal(world.player.x, startP1X, 'P1 must stay still when only P2 moves');
  assert.ok(world.player.partnerX > startP2X + 1, 'P2 must move independently to the right');

  const waves = world.projectiles.filter((pr) => pr.fromPlayer && pr.kind === 'signal_wave');
  assert.equal(waves.length, 2, 'P2 Signálik should fire twin signal_wave projectiles');
});

test('2P Co-op lets Player 1 and Player 2 defeat Stage 6 Boss Veľký Rušič together without swapping', () => {
  const world = createWorld('playing');
  setCoopMode(world, true);
  loadStage(world, 5, false); // Stage 6 Finale

  assert.ok(world.boss);
  // Skip F1 by restoring all targets
  for (const t of world.targets) t.restored = true;
  stepWorld(world, 0.02, IDLE);
  assert.equal(world.boss.phase, 2);

  // Move Boss straight to F3 (as if P1 destroyed weak spots)
  world.boss.phase = 3;
  world.boss.hp = 1;
  world.boss.state = 'move';
  world.boss.x = 128;
  world.boss.y = 96;

  // Position P2 (Signálik) right next to Boss and fire twin wave to bubble Boss
  world.player.partnerX = 110;
  world.player.partnerY = 96;
  world.player.partnerFacing = 'right';
  stepWorld(world, 0.02, {
    ...IDLE,
    p2: { up: false, down: false, left: false, right: false, fireJustPressed: true },
  });
  for (let i = 0; i < 6; i++) {
    stepWorld(world, 0.02, IDLE);
  }
  assert.equal(world.boss.state, 'bubbled', 'P2 Signálik twin wave should bubble Boss in Phase 3');

  // Wait past 0.15s self-pop grace, then P1 Zúbok laser pops the bubbled boss!
  for (let i = 0; i < 12; i++) {
    stepWorld(world, 0.02, IDLE);
  }
  world.player.x = 112;
  world.player.y = 96;
  world.player.facing = 'right';
  world.player.fireCooldown = 0;
  stepWorld(world, 0.02, { ...IDLE, fireJustPressed: true });
  for (let i = 0; i < 8; i++) {
    stepWorld(world, 0.02, IDLE);
  }
  assert.equal(world.boss.phase, 4, 'Teamwork between P2 Signálik and P1 Zúbok defeats Veľký Rušič!');
});
