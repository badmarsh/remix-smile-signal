import assert from 'node:assert/strict';
import test from 'node:test';
import { CITIZEN_SIGNATURES, formatSignaturesAsBasicData } from '../data/signatures';
import { DEFAULT_TAPE_CONFIG } from './basicSource';
import {
  buildDeluxeTapFile,
  buildTapFile,
  decodeWavToBlocks,
  encodeTapeToWav,
  parseTap,
} from './tapeBuilder';
import { computeZxAttributeByte } from './udgAssets';
import {
  CASSETTE_INTRO_DURATION_SEC,
  computeCassetteIntroState,
  quantizeRgbaToZxPalette,
  rgbaToZxScreen,
  ZX_RGB_BRIGHT,
  ZX_RGB_NORMAL,
  ZX_SCREEN_BYTES,
  zxScreenOffset,
  zxScreenToRgba,
} from './zxScreen';

test('zxScreenOffset matches exact ZX Spectrum / Didaktik M interlaced video RAM layout', () => {
  assert.equal(zxScreenOffset(0, 0), 0);
  assert.equal(zxScreenOffset(0, 1), 256);
  assert.equal(zxScreenOffset(0, 8), 32);
  assert.equal(zxScreenOffset(0, 64), 2048);
  assert.equal(zxScreenOffset(0, 128), 4096);
  assert.equal(zxScreenOffset(255, 191), 6143);
});

test('rgbaToZxScreen outputs 6912 B with valid 8x8 attributes and strict ZX colors on decode', () => {
  // Build a 32x24 synthetic test image with bright yellow left half & bright cyan right half
  const w = 32;
  const h = 24;
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (x < 16) {
        rgba[idx] = 255;
        rgba[idx + 1] = 238;
        rgba[idx + 2] = 0;
      } else {
        rgba[idx] = 0;
        rgba[idx + 1] = 232;
        rgba[idx + 2] = 232;
      }
      rgba[idx + 3] = 255;
    }
  }

  const screen = rgbaToZxScreen(rgba, w, h);
  assert.equal(screen.length, ZX_SCREEN_BYTES);

  // Left cell (0,0) should encode BRIGHT yellow (ink=6, paper=0, bright=1 => 70) with all pixels lit (0xff)
  const attrLeft = screen[6144];
  assert.equal((attrLeft & 0x40) !== 0, true, 'Bright bit should be set for bright yellow');
  assert.equal(
    attrLeft,
    computeZxAttributeByte(6, 0, 1),
    'Uniform bright yellow 8x8 cell must match computeZxAttributeByte(6, 0, 1)'
  );
  assert.equal(screen[zxScreenOffset(0, 0)], 0xff, 'Uniform INK cell bitmap row 0 must be 0xff');

  // Right cell (16,0) should encode BRIGHT cyan (ink=5, paper=0, bright=1 => 69)
  const attrRight = screen[6144 + 16];
  assert.equal(
    attrRight,
    computeZxAttributeByte(5, 0, 1),
    'Uniform bright cyan 8x8 cell must match computeZxAttributeByte(5, 0, 1)'
  );

  // Decode back to RGBA and verify every single pixel is strictly a ZX_PALETTE RGB triple
  const decoded = zxScreenToRgba(screen);
  assert.equal(decoded.length, 256 * 192 * 4);
  const validSet = new Set(
    [...ZX_RGB_NORMAL, ...ZX_RGB_BRIGHT].map((c) => `${c.r},${c.g},${c.b}`)
  );
  for (let i = 0; i < decoded.length; i += 4) {
    const key = `${decoded[i]},${decoded[i + 1]},${decoded[i + 2]}`;
    assert.equal(validSet.has(key), true, `Non-ZX pixel ${key} found in decoded SCREEN$`);
  }
});

test('quantizeRgbaToZxPalette strictly outputs 15-color ZX_PALETTE pixels', () => {
  const rgba = new Uint8ClampedArray(16 * 16 * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = (i * 7) & 255;
    rgba[i + 1] = (i * 13) & 255;
    rgba[i + 2] = (i * 29) & 255;
    rgba[i + 3] = 255;
  }
  const quantized = quantizeRgbaToZxPalette(rgba, 16, 16);
  const validSet = new Set(
    [...ZX_RGB_NORMAL, ...ZX_RGB_BRIGHT].map((c) => `${c.r},${c.g},${c.b}`)
  );
  for (let i = 0; i < quantized.length; i += 4) {
    const key = `${quantized[i]},${quantized[i + 1]},${quantized[i + 2]}`;
    assert.equal(validSet.has(key), true, `Non-ZX color ${key} leaked into quantized portrait`);
  }
});

test('computeCassetteIntroState progresses through pilot stripes and 3 SCREEN$ thirds', () => {
  const s0 = computeCassetteIntroState(0.2);
  assert.equal(s0.phase, 'pilot');
  assert.equal(s0.stripeMode, 'red_cyan');
  assert.equal(s0.revealedThirds, 0);

  const s1 = computeCassetteIntroState(1.4);
  assert.equal(s1.phase, 'header');
  assert.equal(s1.stripeMode, 'blue_yellow');

  const sThird1 = computeCassetteIntroState(2.2);
  assert.equal(sThird1.phase, 'loading_screen');
  assert.equal(sThird1.revealedThirds, 1);

  const sThird2 = computeCassetteIntroState(3.1);
  assert.equal(sThird2.revealedThirds, 2);

  const sThird3 = computeCassetteIntroState(4.1);
  assert.equal(sThird3.revealedThirds, 3);

  const sDone = computeCassetteIntroState(CASSETTE_INTRO_DURATION_SEC + 0.1);
  assert.equal(sDone.phase, 'done');
  assert.equal(sDone.revealedLines, 192);
});

test('buildDeluxeTapFile + parseTap builds valid 6-block loader + 6912B SCREEN$ + game archive', () => {
  const screenBytes = new Uint8Array(6912);
  for (let i = 0; i < screenBytes.length; i++) {
    screenBytes[i] = (i * 37) & 0xff;
  }

  const deluxe = buildDeluxeTapFile(DEFAULT_TAPE_CONFIG, screenBytes);
  const parsed = parseTap(deluxe.tapBytes);

  assert.equal(parsed.length, 6, 'Deluxe .TAP must contain 6 blocks (3 files x header+data)');
  for (let i = 0; i < parsed.length; i++) {
    assert.equal(parsed[i].checksumValid, true, `Block ${i} XOR checksum must be valid`);
  }

  // Block 0: Loader BASIC header
  assert.equal(parsed[0].flag, 0x00);
  assert.equal(parsed[0].header?.fileType, 0);
  assert.equal(parsed[0].header?.name.trim(), 'ZUBOK&SIG');
  assert.equal(parsed[0].header?.param1, 10);

  // Block 2-3: SCREEN$ Bytes header (type 3, length 6912, load address 16384)
  assert.equal(parsed[2].flag, 0x00);
  assert.equal(parsed[2].header?.fileType, 3);
  assert.equal(parsed[2].header?.name.trim(), 'ZUBOK');
  assert.equal(parsed[2].header?.dataLength, 6912);
  assert.equal(parsed[2].header?.param1, 16384);
  assert.equal(parsed[3].flag, 0xff);
  assert.deepEqual(parsed[3].payload, screenBytes);

  // Block 4-5: Game BASIC program
  assert.equal(parsed[4].flag, 0x00);
  assert.equal(parsed[4].header?.fileType, 0);
  assert.equal(parsed[4].header?.name.trim(), 'GAME');
  assert.equal(parsed[5].flag, 0xff);
  assert.equal(parsed[5].payload.length, parsed[4].header?.dataLength);
});

test('WAV -> TAP round-trip decoder recovers exact bytes for both original and Deluxe tapes (zx35)', () => {
  // 1) Original 2-block buildTapFile round-trip
  const orig = buildTapFile(DEFAULT_TAPE_CONFIG, 'ZUBOK&SIG', 10);
  const origWav = encodeTapeToWav(orig.blocks, 'zx35', 44100);
  const origDecoded = decodeWavToBlocks(origWav.wavBytes, 'zx35');

  assert.equal(origDecoded.length, orig.blocks.length, 'Original WAV must decode 2 blocks');
  for (let i = 0; i < orig.blocks.length; i++) {
    assert.equal(origDecoded[i].checksumValid, true, `Original WAV block ${i} checksum valid`);
    assert.deepEqual(
      origDecoded[i].rawBytes,
      orig.blocks[i].rawWithFlagAndChecksum,
      `Original WAV block ${i} bytes must match bit-for-bit`
    );
  }

  // 2) Deluxe 6-block buildDeluxeTapFile round-trip (including 6912B SCREEN$ + citizen signatures)
  const screenBytes = new Uint8Array(6912);
  for (let i = 0; i < screenBytes.length; i++) {
    screenBytes[i] = (i * 53 + 17) & 0xff;
  }
  const sigLines = formatSignaturesAsBasicData(CITIZEN_SIGNATURES);
  const deluxe = buildDeluxeTapFile(DEFAULT_TAPE_CONFIG, screenBytes, sigLines);
  const deluxeWav = encodeTapeToWav(deluxe.blocks, 'zx35', 44100);

  assert.ok(
    deluxeWav.durationSec < 150,
    `Deluxe cassette duration (${deluxeWav.durationSec.toFixed(1)}s) must be under 150s`
  );

  const deluxeDecoded = decodeWavToBlocks(deluxeWav.wavBytes, 'zx35');
  assert.equal(deluxeDecoded.length, deluxe.blocks.length, 'Deluxe WAV must decode all 6 blocks');
  for (let i = 0; i < deluxe.blocks.length; i++) {
    assert.equal(deluxeDecoded[i].checksumValid, true, `Deluxe WAV block ${i} checksum valid`);
    assert.deepEqual(
      deluxeDecoded[i].rawBytes,
      deluxe.blocks[i].rawWithFlagAndChecksum,
      `Deluxe WAV block ${i} bytes must match bit-for-bit`
    );
  }
});

test('informative didaktik40 WAV round-trip matches its own 4.0 MHz reference clock', () => {
  const orig = buildTapFile(DEFAULT_TAPE_CONFIG, 'ZUBOK&SIG', 10);
  const d40Wav = encodeTapeToWav(orig.blocks, 'didaktik40', 44100);
  const decodedD40 = decodeWavToBlocks(d40Wav.wavBytes, 'didaktik40');

  assert.equal(decodedD40.length, orig.blocks.length);
  for (let i = 0; i < orig.blocks.length; i++) {
    assert.equal(decodedD40[i].checksumValid, true);
    assert.deepEqual(decodedD40[i].rawBytes, orig.blocks[i].rawWithFlagAndChecksum);
  }
});
