import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceHandoverToVictory, createWorld, loadStage, stepWorld } from './engine';
import { isWallTile, STAGES, TILE_SIZE } from './levels';
import { InputState } from './types';

const IDLE: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  fireJustPressed: false,
  fireHeld: false,
  dashJustPressed: false,
  swapHeroJustPressed: false,
};

test('Stage 6 spawns player, boss, podium, and plaque safely with no ARTFAKT typos', () => {
  for (const stage of STAGES) {
    assert.ok(!stage.relic.chronicleNote.includes('ARTFAKT'), `Typo ARTFAKT in stage ${stage.index}`);
    assert.ok(
      stage.openingChronicle.length <= 56,
      `Opening chronicle too long (${stage.openingChronicle.length}) in stage ${stage.index}`
    );
    assert.ok(
      stage.relic.chronicleNote.length <= 56,
      `Relic chronicle too long (${stage.relic.chronicleNote.length}) in stage ${stage.index}`
    );
  }

  const world = createWorld('playing');
  loadStage(world, 5, true);
  assert.ok(world.boss, 'Stage 6 must spawn Veľký Rušič boss');
  assert.equal(world.boss.phase, 1);
  assert.ok(world.podiumPos, 'Stage 6 must have podiumPos');

  const pCol = Math.floor(world.player.x / TILE_SIZE);
  const pRow = Math.floor(world.player.y / TILE_SIZE);
  assert.equal(isWallTile(world.stage, pCol, pRow), false, 'Player must spawn on open tile');

  const bDist = Math.hypot(world.boss.x - world.player.x, world.boss.y - world.player.y);
  assert.ok(bDist >= 48, `Boss spawned too close to player (${bDist.toFixed(1)}px)`);

  const plCol = Math.floor(world.stageRelic.x / TILE_SIZE);
  const plRow = Math.floor(world.stageRelic.y / TILE_SIZE);
  assert.equal(isWallTile(world.stage, plCol, plRow), false, 'Plaque center tile must be open');
});

test('Boss F1 -> F2 -> F3 -> F4 transitions enforce hero-specific weapons and mandatory plaque handover', () => {
  const world = createWorld('playing');
  loadStage(world, 5, true);
  assert.ok(world.boss);
  // Keep enemies out of the way for deterministic boss phase verification
  world.enemies = [];

  // F1: boss is shielded, plaque cannot be picked up yet
  world.player.x = world.stageRelic.x;
  world.player.y = world.stageRelic.y;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.stageRelic.collected, false, 'Plaque must remain locked while boss is in F1');
  assert.equal(world.plaqueCarried, false);

  // Restoring all 8 targets drops shield -> F2 (and does NOT win immediately!)
  for (const t of world.targets) {
    world.player.x = t.x;
    world.player.y = t.y;
    stepWorld(world, 0.016, IDLE);
  }
  assert.equal(world.phase, 'playing', 'Restoring 8 targets on Stage 6 must not end the game');
  assert.equal(world.boss.phase, 2, 'Restoring all 8 targets drops boss shield to F2');

  // F2: Signálik wave must NOT damage caries weak spots
  world.player.activeHero = 'signalik';
  world.boss.x = 124;
  world.boss.y = 84;
  world.boss.vx = 0;
  world.boss.vy = 0;
  world.boss.state = 'move';
  world.boss.stateTimer = 5;
  world.player.x = world.boss.x - 28;
  world.player.y = world.boss.y;
  world.player.facing = 'right';
  world.player.fireCooldown = 0;

  stepWorld(world, 0.016, { ...IDLE, fireJustPressed: true, fireHeld: true });
  for (let i = 0; i < 20; i++) {
    stepWorld(world, 0.016, IDLE);
  }
  assert.equal(
    world.boss.weakSpots.every((w) => w.hp === w.maxHp && !w.destroyed),
    true,
    'Signálik wave must not damage F2 caries weak spots'
  );

  // F2: Zúbok dental_laser destroys all 3 caries weak spots -> F3
  world.player.activeHero = 'zubok';
  for (let shot = 0; shot < 6; shot++) {
    world.boss.state = 'move';
    world.boss.stateTimer = 5;
    world.player.x = world.boss.x - 26;
    world.player.y = world.boss.y;
    world.player.facing = 'right';
    world.player.fireCooldown = 0;
    world.hitstopTimer = 0;
    stepWorld(world, 0.016, { ...IDLE, fireJustPressed: true, fireHeld: true });
    for (let i = 0; i < 18; i++) {
      world.hitstopTimer = 0;
      stepWorld(world, 0.016, IDLE);
    }
  }
  assert.equal(world.boss.phase, 3, 'Destroying all 3 weak spots with Zúbok laser transitions to F3');

  // F3: Zúbok laser cannot bubble or damage un-bubbled boss
  const hpBeforeLaser = world.boss.hp;
  world.player.activeHero = 'zubok';
  world.boss.state = 'move';
  world.boss.stateTimer = 5;
  world.player.x = world.boss.x - 26;
  world.player.y = world.boss.y;
  world.player.facing = 'right';
  world.player.fireCooldown = 0;
  stepWorld(world, 0.016, { ...IDLE, fireJustPressed: true, fireHeld: true });
  for (let i = 0; i < 18; i++) {
    world.hitstopTimer = 0;
    stepWorld(world, 0.016, IDLE);
  }
  assert.equal(world.boss.hp, hpBeforeLaser, 'Zúbok laser must not damage un-bubbled F3 boss');
  assert.notEqual(world.boss.state, 'bubbled');

  // F3: Signálik traps boss in bubble, popping bubble deals damage until F4
  world.player.activeHero = 'signalik';
  for (let cycle = 0; cycle < 3; cycle++) {
    world.boss.state = 'move';
    world.boss.stateTimer = 5;
    world.player.x = world.boss.x - 28;
    world.player.y = world.boss.y;
    world.player.facing = 'right';
    world.player.fireCooldown = 0;
    world.hitstopTimer = 0;

    stepWorld(world, 0.016, { ...IDLE, fireJustPressed: true, fireHeld: true });
    let sawBubbled = false;
    for (let i = 0; i < 18; i++) {
      world.hitstopTimer = 0;
      stepWorld(world, 0.016, IDLE);
      const bossAfterStep = world.boss;
      if (bossAfterStep && (bossAfterStep.state === 'bubbled' || bossAfterStep.phase === 4)) {
        sawBubbled = true;
        break;
      }
    }
    assert.equal(sawBubbled, true, `Boss must become bubbled in F3 cycle ${cycle}`);

    const bossBeforePop = world.boss;
    if (bossBeforePop && bossBeforePop.state === 'bubbled') {
      // Bump bubbled boss to pop it
      world.player.x = bossBeforePop.x;
      world.player.y = bossBeforePop.y;
      world.hitstopTimer = 0;
      stepWorld(world, 0.016, IDLE);
    }
  }

  assert.equal(world.boss.phase, 4, 'Boss must reach F4 after 3 bubble pops');
  assert.equal(world.boss.active, false);
  assert.equal(world.enemies.length, 0, 'No enemies remain after boss F4');
  assert.equal(world.phase, 'playing', 'Victory must NOT trigger before plaque delivery');

  // Advance past defeat hitstop, then walk onto dropped plaque -> player carries plaque, still not victory
  for (let i = 0; i < 10; i++) {
    stepWorld(world, 0.016, IDLE);
  }
  world.player.x = world.stageRelic.x;
  world.player.y = world.stageRelic.y;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.plaqueCarried, true, 'Player should now carry the MVP plaque');
  assert.equal(world.enemies.length, 0, 'No enemies remain while carrying plaque');
  assert.equal(world.phase, 'playing', 'Must deliver plaque to podium before victory');

  // Walk to podium -> triggers 256x192 handover cutscene
  assert.ok(world.podiumPos);
  world.player.x = world.podiumPos.x;
  world.player.y = world.podiumPos.y;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.phase, 'handover', 'Delivering plaque to podium enters handover cutscene');
  assert.ok(world.handover);
  assert.ok(world.audioQueue.some((e) => e.type === 'victory'), 'Handover triggers victory fanfare');

  // Step handover cutscene -> portrait scales up & typewriter reveals text
  const initialChars = world.handover.revealedChars;
  for (let i = 0; i < 60; i++) {
    stepWorld(world, 0.03, IDLE);
  }
  assert.ok(world.handover.portraitScale > 0.8);
  assert.ok(world.handover.revealedChars > initialChars);

  // ENTER advances handover -> victory
  advanceHandoverToVictory(world);
  assert.equal(world.phase, 'victory');
});

test('Boss telegraphs attacks with tokens and never instant-kills player', () => {
  const world = createWorld('playing');
  loadStage(world, 5, true);
  assert.ok(world.boss);
  world.enemies = [];
  world.boss.stateTimer = 0.05;
  world.player.invulnTimer = 0;

  // Step until boss enters telegraph
  let sawTelegraph = false;
  for (let i = 0; i < 30; i++) {
    stepWorld(world, 0.02, IDLE);
    if (world.boss.state === 'telegraph') {
      sawTelegraph = true;
      assert.equal(world.boss.hasAttackToken, true);
      assert.ok(world.activeAttackTokens >= 1);
      break;
    }
  }
  assert.equal(sawTelegraph, true, 'Boss must visibly telegraph its attacks');

  // Direct contact with boss deals 1 HP (not instant death)
  const hpStart = world.player.hp;
  world.player.x = world.boss.x;
  world.player.y = world.boss.y;
  stepWorld(world, 0.016, IDLE);
  assert.equal(world.player.hp, hpStart - 1);
  assert.ok(world.player.hp > 0);
  assert.equal(world.phase, 'playing');
});
