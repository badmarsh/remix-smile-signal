import assert from 'node:assert/strict';
import test from 'node:test';
import {
  continueFromCheckpoint,
  createWorld,
  loadStage,
  setRadoPokeMode,
  stepWorld,
} from './engine';
import {
  applyCheckpointPenalty,
  loadSavedProgress,
  PROGRESS_STORAGE_KEY,
  RADO_POKE_ENEMY_SHOT_SCALE,
  recordStageLoss,
  saveProgress,
} from './progress';
import { InputState } from './types';

const IDLE: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  fireJustPressed: false,
  fireHeld: false,
};

function forceDefeatToGameOver(world: ReturnType<typeof createWorld>): void {
  world.player.invulnTimer = 0;
  world.player.hp = 0;
  world.defeatBeatTimer = 0.05;
  for (let i = 0; i < 6; i++) {
    stepWorld(world, 0.02, IDLE);
  }
}

test('Checkpoint continue resumes on reached stage with -20% score penalty', () => {
  const world = createWorld('playing');
  world.score = 1000;
  loadStage(world, 3, false); // Reach Stage 4 (index 3) with 1000 pts

  assert.equal(world.checkpointStageIndex, 3);
  assert.equal(world.checkpointScore, 1000);

  // Score more mid-stage, then lose all HP
  world.score = 1450;
  forceDefeatToGameOver(world);
  assert.equal(world.phase, 'gameover');

  continueFromCheckpoint(world);
  assert.equal(world.phase, 'playing');
  assert.equal(world.stageIndex, 3, 'Should stay on Stage 4 instead of resetting to Stage 1');
  assert.equal(world.score, applyCheckpointPenalty(1000));
  assert.equal(world.score, 800, 'Checkpoint continue applies exact 20% score penalty');
  assert.equal(world.player.hp, world.player.maxHp, 'Vitality should be fully restored');
});

test('Spectrum POKE Rado prompt triggers only after 2nd loss in the SAME stage', () => {
  const world = createWorld('playing');
  loadStage(world, 2, false); // Stage 3 (index 2)

  // 1st loss on Stage 3 -> NO POKE prompt yet
  forceDefeatToGameOver(world);
  assert.equal(world.phase, 'gameover');
  assert.equal(world.pokePromptVisible, false, '1st defeat must not show POKE prompt');

  // Continue on Stage 3, then suffer 2nd loss on the SAME Stage 3 -> POKE prompt appears!
  continueFromCheckpoint(world);
  forceDefeatToGameOver(world);
  assert.equal(world.phase, 'gameover');
  assert.equal(world.pokePromptVisible, true, '2nd defeat in same stage must offer POKE 48621,5');

  // Losing once on a different stage does NOT count toward another stage
  const isolated = recordStageLoss({ 2: 1 }, 4);
  assert.equal(isolated.shouldOfferPoke, false, '1st loss in a different stage does not trigger POKE');
  const secondSame = recordStageLoss(isolated.nextLosses, 4);
  assert.equal(secondSame.shouldOfferPoke, true, '2nd loss in that same stage triggers POKE');
});

test('Rado POKE mode grants +2 max hearts (5 total) and slows enemy projectiles by 30%', () => {
  // Measure normal enemy bolt speed
  const normalWorld = createWorld('playing');
  loadStage(normalWorld, 1, false); // Stage 2 has kiters
  const normalKiter = normalWorld.enemies.find((e) => e.archetype === 'kiter');
  assert.ok(normalKiter, 'Stage 2 should have a kiter enemy');
  normalKiter.state = 'telegraph';
  normalKiter.stateTimer = 0.01;
  normalKiter.hasAttackToken = true;
  normalWorld.activeAttackTokens = 1;
  stepWorld(normalWorld, 0.02, IDLE);
  const normalBolt = normalWorld.projectiles.find((pr) => !pr.fromPlayer);
  assert.ok(normalBolt, 'Kiter should fire an enemy bolt');
  const normalSpeed = Math.hypot(normalBolt.vx, normalBolt.vy);

  // Measure Rado POKE enemy bolt speed + maxHp
  const pokeWorld = createWorld('playing');
  setRadoPokeMode(pokeWorld, true);
  assert.equal(pokeWorld.player.maxHp, 5, 'Rado POKE should grant +2 max hearts (3 -> 5)');
  assert.equal(pokeWorld.player.hp, 5, 'Rado POKE should fill hearts up to 5');

  loadStage(pokeWorld, 1, false);
  assert.equal(pokeWorld.player.maxHp, 5, 'maxHp remains 5 across stage transitions');

  const pokeKiter = pokeWorld.enemies.find((e) => e.archetype === 'kiter');
  assert.ok(pokeKiter);
  pokeKiter.state = 'telegraph';
  pokeKiter.stateTimer = 0.01;
  pokeKiter.hasAttackToken = true;
  pokeWorld.activeAttackTokens = 1;
  stepWorld(pokeWorld, 0.02, IDLE);
  const pokeBolt = pokeWorld.projectiles.find((pr) => !pr.fromPlayer);
  assert.ok(pokeBolt, 'Kiter should fire an enemy bolt in POKE mode');
  const pokeSpeed = Math.hypot(pokeBolt.vx, pokeBolt.vy);

  const ratio = pokeSpeed / normalSpeed;
  assert.ok(
    Math.abs(ratio - RADO_POKE_ENEMY_SHOT_SCALE) < 0.01,
    `Expected enemy bolt speed ratio ${RADO_POKE_ENEMY_SHOT_SCALE}, got ${ratio.toFixed(4)}`
  );
});

test('Storage persistence handles missing, corrupt, and throwing Storage safely', () => {
  // Missing storage
  const def = loadSavedProgress(null);
  assert.equal(def.checkpointStageIndex, 0);
  assert.equal(def.radoPokeMode, false);
  assert.equal(saveProgress(def, null), false);

  // Throwing storage (simulates restricted file:// or Safari private mode)
  const throwingStorage = {
    getItem() {
      throw new Error('SecurityError');
    },
    setItem() {
      throw new Error('QuotaExceededError');
    },
  };
  assert.doesNotThrow(() => loadSavedProgress(throwingStorage));
  assert.equal(saveProgress(def, throwingStorage), false);

  // Corrupt JSON
  const corruptStorage = {
    getItem() {
      return '{bad-json';
    },
  };
  const recovered = loadSavedProgress(corruptStorage);
  assert.equal(recovered.bestScore, 0);

  // Valid round-trip
  const backing = new Map<string, string>();
  const memoryStorage = {
    getItem: (k: string) => backing.get(k) ?? null,
    setItem: (k: string, v: string) => {
      backing.set(k, v);
    },
  };
  const saved = {
    checkpointStageIndex: 4,
    checkpointScore: 2200,
    bestScore: 3400,
    radoPokeMode: true,
    stageLosses: { 2: 1, 4: 2 },
  };
  assert.equal(saveProgress(saved, memoryStorage), true);
  assert.ok(backing.has(PROGRESS_STORAGE_KEY));
  const loaded = loadSavedProgress(memoryStorage);
  assert.deepEqual(loaded, saved);
});
