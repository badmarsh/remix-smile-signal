import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMelodikTrack,
  getStepDurationSec,
  isChristmasTrack,
  MELODIK_TRACKS,
  selectTrackForStage,
  selectTitleTrack,
} from './music';

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
