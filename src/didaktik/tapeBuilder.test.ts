import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TAPE_CONFIG, sanitizeZxString } from './basicSource';
import {
  buildTapFile,
  computeTapeChecksum,
  encodeTapeToWav,
  encodeZxNumber,
  estimateTapeDurationSec,
  SINCLAIR_TOKENS,
  tokenizeBasicLine,
} from './tapeBuilder';

test('sanitizeZxString strips accents and quotes into safe ZX Spectrum ASCII', () => {
  assert.equal(sanitizeZxString('Veselé Vianoce "Šťastné"'), 'VESELE VIANOCE STASTNE');
  assert.equal(sanitizeZxString('   '), 'VESELE VIANOCE!');
});

test('encodeZxNumber encodes small positive and negative integers accurately', () => {
  const pos = encodeZxNumber(1000);
  assert.deepEqual(Array.from(pos), [0x00, 0x00, 0xe8, 0x03, 0x00]);

  const neg = encodeZxNumber(-8);
  assert.deepEqual(Array.from(neg), [0x00, 0xff, 0xf8, 0xff, 0x00]);
});

test('encodeZxNumber encodes floating-point durations (e.g. BEEP .08)', () => {
  const flt = encodeZxNumber(0.5);
  // 0.5 = 0.5 * 2^0 => exponent 0 + 128 = 128 (0x80), mantissa = 0x80000000 with implicit leading 1 cleared => 0x00
  assert.equal(flt[0], 0x80);
  assert.equal(flt[1], 0x00);
});

test('tokenizeBasicLine produces big-endian line number, tokens, 0x0E floats, and 0x0D terminator', () => {
  const bytes = tokenizeBasicLine('10 BORDER 0: PRINT "HI"');
  // Big-endian line 10
  assert.equal(bytes[0], 0x00);
  assert.equal(bytes[1], 0x0a);
  // Content starts with BORDER token (0xE7)
  assert.equal(bytes[4], SINCLAIR_TOKENS['BORDER']);
  // Contains 0x0E numeric marker for literal 0
  assert.ok(bytes.includes(0x0e));
  // Contains PRINT token (0xF5)
  assert.ok(bytes.includes(SINCLAIR_TOKENS['PRINT']));
  // Terminates with 0x0D
  assert.equal(bytes[bytes.length - 1], 0x0d);
});

test('buildTapFile generates valid 2-block ZX Spectrum .TAP archive with exact XOR checksums', () => {
  const artifact = buildTapFile(DEFAULT_TAPE_CONFIG, 'SMILE&SIG', 10);
  assert.equal(artifact.blocks.length, 2);
  assert.equal(artifact.blocks[0].flag, 0x00);
  assert.equal(artifact.blocks[1].flag, 0xff);

  // Verify header length prefix in TAP (19 bytes = 0x13 0x00)
  assert.equal(artifact.tapBytes[0], 19);
  assert.equal(artifact.tapBytes[1], 0);

  // Verify both block XOR checksums evaluate to 0 over the entire block including checksum byte
  for (const block of artifact.blocks) {
    assert.equal(computeTapeChecksum(block.rawWithFlagAndChecksum), 0);
  }

  // Verify autostart line 10 is encoded in header bytes 14-15 (offset 14 from flag byte)
  const headerRaw = artifact.blocks[0].rawWithFlagAndChecksum;
  const autostart = headerRaw[14] | (headerRaw[15] << 8);
  assert.equal(autostart, 10);
});

test('encodeTapeToWav creates valid 44.1kHz mono 16-bit PCM WAV with realistic duration', () => {
  const artifact = buildTapFile(DEFAULT_TAPE_CONFIG);
  const wavStandard = encodeTapeToWav(artifact.blocks, 'zx35', 44100);
  const wavDidaktik = encodeTapeToWav(artifact.blocks, 'didaktik40', 44100);

  // Check RIFF / WAVE magic bytes
  const magic = String.fromCharCode(...wavStandard.wavBytes.slice(0, 4));
  const format = String.fromCharCode(...wavStandard.wavBytes.slice(8, 12));
  assert.equal(magic, 'RIFF');
  assert.equal(format, 'WAVE');

  // Realistic cassette tape duration (between 10 and 90 seconds for a 4KB BASIC program)
  assert.ok(wavStandard.durationSec > 10 && wavStandard.durationSec < 90);
  // Analytical duration estimate matches actual encoded WAV within 50ms
  const estimated = estimateTapeDurationSec(artifact.blocks, 'zx35');
  assert.ok(Math.abs(estimated - wavStandard.durationSec) < 0.05);
  // 4.0 MHz Didaktik profile should be slightly shorter than 3.5 MHz standard profile
  assert.ok(wavDidaktik.durationSec < wavStandard.durationSec);
});
