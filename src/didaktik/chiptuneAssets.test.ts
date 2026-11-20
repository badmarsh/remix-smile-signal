import test from 'node:test';
import assert from 'node:assert/strict';
import {
  semitoneToFrequency,
  getChiptuneTotalDuration,
  formatSfxAsBasic,
  formatSfxAsZ80,
  encodeChiptuneToWav,
  DIDAKTIK_CHIPTUNE_PACK,
  type DidaktikChiptuneAsset,
} from './chiptuneAssets';

test('semitoneToFrequency returns Middle C (C4=0) at ~261.6 Hz', () => {
  assert.equal(Math.round(semitoneToFrequency(0)), 262);
});

test('semitoneToFrequency doubles every octave (12 semitones)', () => {
  const c4 = semitoneToFrequency(0);
  const c5 = semitoneToFrequency(12);
  assert.equal(Math.round(c5), Math.round(c4 * 2));
});

test('semitoneToFrequency for A4 (9 semitones above C4) is ~440 Hz', () => {
  assert.equal(Math.round(semitoneToFrequency(9)), 440);
});

test('getChiptuneTotalDuration sums all step durations', () => {
  const asset: DidaktikChiptuneAsset = {
    id: 'test',
    name: 'Test',
    category: 'arcade',
    description: 'Test',
    steps: [
      { duration: 0.1, semitone: 0 },
      { duration: 0.2, semitone: null },
      { duration: 0.05, semitone: 12 },
    ],
    z80Bytes: 14,
  };
  assert.equal(Math.round(getChiptuneTotalDuration(asset) * 1000), 350);
});

test('formatSfxAsBasic emits BEEP lines with correct pitch and duration', () => {
  const asset: DidaktikChiptuneAsset = {
    id: 'test',
    name: 'test sfx',
    category: 'arcade',
    description: 't',
    steps: [
      { duration: 0.08, semitone: 12 },
      { duration: 0.04, semitone: null },
      { duration: 0.1, semitone: 24 },
    ],
    z80Bytes: 12,
  };
  const out = formatSfxAsBasic(asset, 500);
  assert.ok(out.includes('500 REM TEST SFX'));
  assert.ok(out.includes('510 BEEP .08,12'));
  assert.ok(out.includes('PAUSE 2')); // 0.04 * 50 = 2 frames
  assert.ok(out.includes('BEEP .10,24'));
});

test('formatSfxAsZ80 produces DEFW table with terminator', () => {
  const asset: DidaktikChiptuneAsset = {
    id: 'test',
    name: 'test sfx',
    category: 'arcade',
    description: 't',
    steps: [{ duration: 0.1, semitone: 12 }],
    z80Bytes: 6,
  };
  const out = formatSfxAsZ80(asset);
  assert.ok(out.includes('SFX_TEST:'));
  assert.ok(out.includes('DEFW $0000 ; End of sequence'));
  assert.ok(out.includes('Hz,'));
  assert.ok(out.includes('ms'));
});

test('encodeChiptuneToWav produces valid RIFF/WAVE header', () => {
  const asset: DidaktikChiptuneAsset = {
    id: 'test',
    name: 'test',
    category: 'arcade',
    description: 't',
    steps: [{ duration: 0.01, semitone: 12 }],
    z80Bytes: 6,
  };
  const wav = encodeChiptuneToWav(asset);
  const header = String.fromCharCode(...wav.subarray(0, 4));
  assert.equal(header, 'RIFF');
  const wave = String.fromCharCode(...wav.subarray(8, 12));
  assert.equal(wave, 'WAVE');
  const fmt = String.fromCharCode(...wav.subarray(12, 16));
  assert.equal(fmt, 'fmt ');
  const data = String.fromCharCode(...wav.subarray(36, 40));
  assert.equal(data, 'data');
});

test('encodeChiptuneToWav produces non-zero samples for audible steps', () => {
  const asset: DidaktikChiptuneAsset = {
    id: 'test',
    name: 'test',
    category: 'arcade',
    description: 't',
    steps: [{ duration: 0.1, semitone: 12 }],
    z80Bytes: 6,
  };
  const wav = encodeChiptuneToWav(asset);
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const numSamples = (wav.length - 44) / 2;
  let nonzero = 0;
  for (let i = 0; i < numSamples; i++) {
    if (view.getInt16(44 + i * 2, true) !== 0) nonzero++;
  }
  assert.ok(nonzero > 0, 'should have non-zero PCM samples');
});

test('DIDAKTIK_CHIPTUNE_PACK has 12 assets across 4 categories', () => {
  assert.equal(DIDAKTIK_CHIPTUNE_PACK.length, 12);
  const cats = new Set(DIDAKTIK_CHIPTUNE_PACK.map((a) => a.category));
  assert.deepEqual([...cats].sort(), ['arcade', 'christmas', 'microdent', 'teatro']);
});

test('Every DIDAKTIK_CHIPTUNE_PACK asset has required fields', () => {
  for (const asset of DIDAKTIK_CHIPTUNE_PACK) {
    assert.ok(asset.id);
    assert.ok(asset.name);
    assert.ok(asset.description);
    assert.ok(asset.steps.length > 0);
    assert.ok(asset.z80Bytes > 0);
    for (const step of asset.steps) {
      assert.ok(step.duration > 0);
      if (step.semitone !== null) {
        assert.ok(Number.isFinite(step.semitone));
      }
    }
  }
});

test('DIDAKTIK_CHIPTUNE_PACK includes microDENT laser, Teatro IPTV, and Christmas fanfare', () => {
  const ids = DIDAKTIK_CHIPTUNE_PACK.map((a) => a.id);
  assert.ok(ids.includes('microdent_laser'));
  assert.ok(ids.includes('iptv_lock'));
  assert.ok(ids.includes('vianoce_fanfare'));
  assert.ok(ids.includes('ticha_noc'));
  assert.ok(ids.includes('xmas_jingle'));
});
