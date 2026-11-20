import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeZxAttributeByte,
  DEFAULT_UDG_PACK,
  formatUdgAsBasic,
  formatUdgPackAsZ80,
  isUdgPixelSet,
  toggleUdgPixel,
} from './udgAssets';
import {
  DIDAKTIK_CHIPTUNE_PACK,
  encodeChiptuneToWav,
  formatSfxAsBasic,
  formatSfxAsZ80,
  getChiptuneTotalDuration,
} from './chiptuneAssets';

test('DEFAULT_UDG_PACK fits well within the 168-byte Didaktik M UDG hardware table', () => {
  assert.equal(DEFAULT_UDG_PACK.length, 12);
  const totalBytes = DEFAULT_UDG_PACK.length * 8;
  assert.ok(totalBytes <= 168, `UDG pack (${totalBytes}B) must fit inside 168-byte UDG table`);

  for (const asset of DEFAULT_UDG_PACK) {
    assert.equal(asset.bytes.length, 8);
    for (const b of asset.bytes) {
      assert.ok(Number.isInteger(b) && b >= 0 && b <= 255);
    }
  }
});

test('toggleUdgPixel flips the exact bit and computeZxAttributeByte encodes BRIGHT/PAPER/INK', () => {
  const sample = [0, 0, 0, 0, 0, 0, 0, 0];
  const toggled = toggleUdgPixel(sample, 2, 0); // MSB = 128
  assert.equal(toggled[2], 128);
  assert.equal(isUdgPixelSet(toggled, 2, 0), true);
  assert.equal(isUdgPixelSet(toggled, 2, 1), false);

  // BRIGHT=1 (64) + PAPER=1 (8) + INK=5 (5) = 77
  assert.equal(computeZxAttributeByte(5, 1, 1), 77);
});

test('UDG exporters produce valid Sinclair BASIC DATA and Z80 DEFB output', () => {
  const basic = formatUdgAsBasic(DEFAULT_UDG_PACK[0]);
  assert.ok(basic.includes('POKE USR "a"+N,B'));
  assert.ok(basic.includes('DATA 24,60,90,126,60,24,60,102'));

  const z80 = formatUdgPackAsZ80(DEFAULT_UDG_PACK);
  assert.ok(z80.includes('ORG $FF58'));
  assert.ok(z80.includes('UDG_DR_MICRO:'));
  assert.ok(z80.includes('UDG_TEATRO_DISH:'));
});

test('DIDAKTIK_CHIPTUNE_PACK entries export valid BASIC BEEP, Z80 $03B5, and 16-bit PCM WAV', () => {
  assert.equal(DIDAKTIK_CHIPTUNE_PACK.length, 12); // 10 original + 2 Christmas SFX (jingle_bell + vianoce_fanfare)

  for (const sfx of DIDAKTIK_CHIPTUNE_PACK) {
    assert.ok(getChiptuneTotalDuration(sfx) > 0);
    const basic = formatSfxAsBasic(sfx);
    assert.ok(basic.includes('BEEP '));
    const z80 = formatSfxAsZ80(sfx);
    assert.ok(z80.includes('DEFW $0000'));

    const wav = encodeChiptuneToWav(sfx, 22050);
    assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
    assert.equal(String.fromCharCode(...wav.slice(8, 12)), 'WAVE');
    assert.ok(wav.length > 44);
  }
});
