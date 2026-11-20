import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMelodikTrack,
  getStepDurationSec,
  isChristmasTrack,
  MELODIK_TRACKS,
  selectTrackForMode,
  selectTrackForPhase,
  selectTrackForStage,
  selectTitleTrack,
} from './music';
import { GamePhase, PlayMode } from './types';

test('Melodik AY jukebox provides 5 distinct valid 3-channel chiptune tracks (incl. Christmas vianoce)', () => {
  assert.equal(MELODIK_TRACKS.length, 5);
  const ids = new Set(MELODIK_TRACKS.map((t) => t.id));
  assert.equal(ids.size, 5);
  assert.ok(ids.has('vianoce'), 'vianoce Christmas track must be present');

  for (const track of MELODIK_TRACKS) {
    assert.ok(track.bpm >= 100 && track.bpm <= 170, `${track.id} BPM should be musical`);
    assert.ok(track.steps.length >= 16, `${track.id} should have at least 16 steps`);
    const stepSec = getStepDurationSec(track);
    assert.ok(stepSec > 0.12 && stepSec < 0.4, `${track.id} step duration should be playable`);
    assert.equal(getMelodikTrack(track.id).id, track.id);
  }
});

test('selectTrackForStage maps Rimavská Sobota stages and boss fight to appropriate Melodik tracks', () => {
  assert.equal(selectTrackForStage(0, false), 'microdent');
  assert.equal(selectTrackForStage(1, false), 'microdent');
  assert.equal(selectTrackForStage(2, false), 'teatro');
  assert.equal(selectTrackForStage(3, false), 'rimava');
  assert.equal(selectTrackForStage(4, false), 'rimava');
  assert.equal(selectTrackForStage(5, true), 'boss');
  assert.equal(selectTrackForStage(0, true), 'boss');
});

test('selectTitleTrack always returns vianoce Christmas track for title screen and cutscenes', () => {
  assert.equal(selectTitleTrack(), 'vianoce');
  const track = MELODIK_TRACKS.find((t) => t.id === 'vianoce');
  assert.ok(track, 'vianoce track must exist in MELODIK_TRACKS');
  assert.ok(track!.bpm >= 100 && track!.bpm <= 130, 'vianoce should be calm Christmas tempo');
  assert.ok(track!.steps.length >= 16, 'vianoce must have at least 16 steps');
});

test('isChristmasTrack correctly identifies the vianoce Christmas track', () => {
  assert.equal(isChristmasTrack('vianoce'), true);
  assert.equal(isChristmasTrack('boss'), false);
  assert.equal(isChristmasTrack('microdent'), false);
});

test('selectTrackForMode assigns Melodik tracks to Service Incident Arc modes', () => {
  assert.equal(selectTrackForMode('deploy_select', false), 'microdent');
  assert.equal(selectTrackForMode('timed_arena', false), 'microdent');
  assert.equal(selectTrackForMode('relay_repair', false), 'rimava');
  assert.equal(selectTrackForMode('wave_defense', false), 'rimava');
  assert.equal(selectTrackForMode('normal', false), 'microdent');
  // Boss takes priority over mode
  assert.equal(selectTrackForMode('wave_defense', true), 'boss');
});

test('selectTrackForPhase: title / handover / victory → vianoce Christmas track', () => {
  assert.equal(selectTrackForPhase('title', 'normal', 0, false, false, false), 'vianoce');
  assert.equal(selectTrackForPhase('handover', 'normal', 0, false, false, false), 'vianoce');
  assert.equal(selectTrackForPhase('victory', 'normal', 0, false, false, false), 'vianoce');
});

test('selectTrackForPhase: gameover and paused → silence', () => {
  assert.equal(selectTrackForPhase('gameover', 'normal', 0, false, false, false), null);
  assert.equal(selectTrackForPhase('paused', 'normal', 0, false, false, false), null);
});

test('selectTrackForPhase: muted or overlay open → silence regardless of phase', () => {
  assert.equal(selectTrackForPhase('title', 'normal', 0, false, false, true), null);
  assert.equal(selectTrackForPhase('playing', 'normal', 0, false, true, false), null);
  assert.equal(selectTrackForPhase('playing', 'normal', 0, false, true, true), null);
});

test('selectTrackForPhase: playing with boss → boss track', () => {
  assert.equal(selectTrackForPhase('playing', 'normal', 5, true, false, false), 'boss');
});

test('selectTrackForPhase: playing normal stage → stage-appropriate track', () => {
  assert.equal(selectTrackForPhase('playing', 'normal', 0, false, false, false), 'microdent');
  assert.equal(selectTrackForPhase('playing', 'normal', 2, false, false, false), 'teatro');
  assert.equal(selectTrackForPhase('playing', 'normal', 3, false, false, false), 'rimava');
});

test('selectTrackForPhase: playing non-normal mode → mode-appropriate track', () => {
  assert.equal(selectTrackForPhase('playing', 'deploy_select', 6, false, false, false), 'microdent');
  assert.equal(selectTrackForPhase('playing', 'timed_arena', 6, false, false, false), 'microdent');
  assert.equal(selectTrackForPhase('playing', 'relay_repair', 6, false, false, false), 'rimava');
  assert.equal(selectTrackForPhase('playing', 'wave_defense', 6, false, false, false), 'rimava');
});

test('selectTrackForPhase: stage_clear continues stage-appropriate music', () => {
  assert.equal(selectTrackForPhase('stage_clear', 'normal', 0, false, false, false), 'microdent');
  assert.equal(selectTrackForPhase('stage_clear', 'normal', 2, false, false, false), 'teatro');
});
