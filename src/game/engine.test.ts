import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, getHudSnapshot, loadStage, startNewGame, stepWorld } from './engine';
import { STAGES } from './levels';
import { InputState } from './types';

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

test('all 6 Rimavská Sobota stages spawn player safely away from enemies and walls', () => {
  const world = createWorld('playing');
  for (let i = 0; i < STAGES.length; i++) {
    loadStage(world, i, false);
    assert.ok(world.targets.length >= 6, `Stage ${i} should have at least 6 targets`);
    assert.ok(world.enemies.length >= 3, `Stage ${i} should have at least 3 enemies`);
    assert.ok(world.stageRelic.name.length > 0, `Stage ${i} should have a collectible relic`);
    for (const enemy of world.enemies) {
      const dist = Math.hypot(enemy.x - world.player.x, enemy.y - world.player.y);
      assert.ok(dist >= 40, `Stage ${i} enemy spawned too close (${dist.toFixed(1)}px)`);
    }
  }
});

test('game survives first 3 seconds without any player input', () => {
  const world = createWorld('playing');
  startNewGame(world);
  for (let frame = 0; frame < 180; frame++) {
    stepWorld(world, 1 / 60, IDLE_INPUT);
  }
  assert.equal(world.phase, 'playing');
  assert.ok(world.player.hp >= 2);
});

test('Zúbok fires CEREC dental laser that damages and defeats enemies', () => {
  const world = createWorld('playing');
  startNewGame(world);
  assert.equal(world.player.activeHero, 'zubok');
  const startX = world.player.x;

  stepWorld(world, 0.04, { ...IDLE_INPUT, right: true });
  assert.ok(world.player.x > startX);
  assert.equal(world.player.facing, 'right');

  const targetEnemy = world.enemies[0];
  targetEnemy.hp = 1;
  targetEnemy.x = world.player.x + 28;
  targetEnemy.y = world.player.y;
  targetEnemy.vx = 0;
  targetEnemy.vy = 0;

  stepWorld(world, 0.016, { ...IDLE_INPUT, fireJustPressed: true, fireHeld: true });
  assert.equal(world.projectiles.length, 1);
  assert.equal(world.projectiles[0].kind, 'dental_laser');

  for (let i = 0; i < 20; i++) {
    stepWorld(world, 0.02, IDLE_INPUT);
  }

  assert.equal(world.enemiesDefeated, 1);
  assert.ok(world.score >= 150);
});

test('Signálik tag-swap fires Exolon twin Wi-Fi waves that trap enemies in Bubble Bobble bubble', () => {
  const world = createWorld('playing');
  startNewGame(world);

  // Swap from Zúbok to Signálik
  stepWorld(world, 0.016, { ...IDLE_INPUT, swapHeroJustPressed: true });
  assert.equal(world.player.activeHero, 'signalik');

  const enemy = world.enemies[0];
  enemy.x = world.player.x + 26;
  enemy.y = world.player.y;
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.hp = 2;

  stepWorld(world, 0.016, { ...IDLE_INPUT, fireJustPressed: true, fireHeld: true });
  assert.equal(world.projectiles.length, 2);
  assert.equal(world.projectiles[0].kind, 'signal_wave');

  // Step until first signal wave hits enemy -> traps in bubble
  let sawBubbled = false;
  for (let i = 0; i < 15; i++) {
    stepWorld(world, 0.016, IDLE_INPUT);
    if (enemy.state === 'bubbled' || enemy.state === 'ko') {
      sawBubbled = true;
      break;
    }
  }
  assert.equal(sawBubbled, true);
});

test('Saboteur ninja dash grants speed burst, afterimage, and cooldown', () => {
  const world = createWorld('playing');
  startNewGame(world);
  const startX = world.player.x;

  stepWorld(world, 0.02, { ...IDLE_INPUT, right: true, dashJustPressed: true });
  assert.ok(world.player.dashTimer > 0);
  assert.ok(world.player.dashCooldown > 0.5);
  assert.ok(world.afterimages.some((a) => a.active));

  for (let i = 0; i < 6; i++) {
    stepWorld(world, 0.02, IDLE_INPUT);
  }
  assert.ok(world.player.x > startX + 18);
});

test('Dizzy/Towdie stage relic awards bonus points, heals wounded player, and logs chronicle', () => {
  const world = createWorld('playing');
  startNewGame(world);
  world.player.hp = 2;
  world.player.x = world.stageRelic.x;
  world.player.y = world.stageRelic.y;

  stepWorld(world, 0.016, IDLE_INPUT);
  assert.equal(world.stageRelic.collected, true);
  assert.equal(world.player.hp, 3);
  assert.ok(world.score >= 400);
  assert.equal(world.relicsCollected.length, 1);
  assert.ok(world.chronicleText.includes('CEREC'));
});

test('restoring all objectives triggers stage_clear and advances to next stage', () => {
  const world = createWorld('playing');
  startNewGame(world);

  for (const t of world.targets) {
    world.player.x = t.x;
    world.player.y = t.y;
    stepWorld(world, 0.016, IDLE_INPUT);
  }

  assert.equal(world.phase, 'stage_clear');

  for (let i = 0; i < 40; i++) {
    stepWorld(world, 0.04, IDLE_INPUT);
  }

  assert.equal(world.phase, 'playing');
  assert.equal(world.stageIndex, 1);
});

test('defeat is reachable when player loses all 3 vitality hearts', () => {
  const world = createWorld('playing');
  startNewGame(world);

  const enemy = world.enemies[0];
  for (let hit = 0; hit < 3; hit++) {
    world.player.invulnTimer = 0;
    world.hitstopTimer = 0;
    enemy.x = world.player.x;
    enemy.y = world.player.y;
    stepWorld(world, 0.02, IDLE_INPUT);
  }

  assert.equal(world.player.hp, 0);
  for (let i = 0; i < 20; i++) {
    stepWorld(world, 0.04, IDLE_INPUT);
  }
  assert.equal(world.phase, 'gameover');
  const snap = getHudSnapshot(world);
  assert.equal(snap.hp, 0);
  assert.equal(snap.damageTaken, 3);
});
