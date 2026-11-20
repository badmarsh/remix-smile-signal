/**
 * Real Sinclair BASIC Tokenizer, ZX Spectrum / Didaktik M .TAP Binary Builder,
 * and 44.1 kHz Mono PCM .WAV Cassette Tape Audio Encoder.
 *
 * Follows the official ZX Spectrum 48K ROM tape loader specification (LD-BYTES),
 * fully compatible with Didaktik M (MG 5-pin DIN port) and ZX Spectrum emulators.
 */

import { BasicProgramConfig, generateSinclairBasicLines } from './basicSource';

/**
 * Standard Sinclair ZX Spectrum 48K BASIC token table (codes 0xA5 - 0xFF).
 * Sorted by descending token length during matching to avoid partial prefix hits.
 */
export const SINCLAIR_TOKENS: Record<string, number> = {
  'RND': 0xa5,
  'INKEY$': 0xa6,
  'PI': 0xa7,
  'FN': 0xa8,
  'POINT': 0xa9,
  'SCREEN$': 0xaa,
  'ATTR': 0xab,
  'AT': 0xac,
  'TAB': 0xad,
  'VAL$': 0xae,
  'CODE': 0xaf,
  'VAL': 0xb0,
  'LEN': 0xb1,
  'SIN': 0xb2,
  'COS': 0xb3,
  'TAN': 0xb4,
  'ASN': 0xb5,
  'ACS': 0xb6,
  'ATN': 0xb7,
  'LN': 0xb8,
  'EXP': 0xb9,
  'INT': 0xba,
  'SQR': 0xbb,
  'SGN': 0xbc,
  'ABS': 0xbd,
  'PEEK': 0xbe,
  'IN': 0xbf,
  'USR': 0xc0,
  'STR$': 0xc1,
  'CHR$': 0xc2,
  'NOT': 0xc3,
  'BIN': 0xc4,
  'OR': 0xc5,
  'AND': 0xc6,
  '<=': 0xc7,
  '>=': 0xc8,
  '<>': 0xc9,
  'LINE': 0xca,
  'THEN': 0xcb,
  'TO': 0xcc,
  'STEP': 0xcd,
  'DEF FN': 0xce,
  'CAT': 0xcf,
  'FORMAT': 0xd0,
  'MOVE': 0xd1,
  'ERASE': 0xd2,
  'OPEN #': 0xd3,
  'CLOSE #': 0xd4,
  'MERGE': 0xd5,
  'VERIFY': 0xd6,
  'BEEP': 0xd7,
  'CIRCLE': 0xd8,
  'INK': 0xd9,
  'PAPER': 0xda,
  'FLASH': 0xdb,
  'BRIGHT': 0xdc,
  'INVERSE': 0xdd,
  'OVER': 0xde,
  'OUT': 0xdf,
  'LPRINT': 0xe0,
  'LLIST': 0xe1,
  'STOP': 0xe2,
  'READ': 0xe3,
  'DATA': 0xe4,
  'RESTORE': 0xe5,
  'NEW': 0xe6,
  'BORDER': 0xe7,
  'CONTINUE': 0xe8,
  'DIM': 0xe9,
  'REM': 0xea,
  'FOR': 0xeb,
  'GO TO': 0xec,
  'GOTO': 0xec,
  'GO SUB': 0xed,
  'GOSUB': 0xed,
  'INPUT': 0xee,
  'LOAD': 0xef,
  'LIST': 0xf0,
  'LET': 0xf1,
  'PAUSE': 0xf2,
  'NEXT': 0xf3,
  'POKE': 0xf4,
  'PRINT': 0xf5,
  'PLOT': 0xf6,
  'RUN': 0xf7,
  'SAVE': 0xf8,
  'RANDOMIZE': 0xf9,
  'IF': 0xfa,
  'CLS': 0xfb,
  'DRAW': 0xfc,
  'CLEAR': 0xfd,
  'RETURN': 0xfe,
  'COPY': 0xff,
};

const SORTED_TOKEN_KEYS = Object.keys(SINCLAIR_TOKENS).sort((a, b) => b.length - a.length);

/**
 * Encodes a numeric value into the exact 5-byte ZX Spectrum internal number format.
 * Integers in [-65535, 65535] use the compact small-integer format;
 * floats use ZX Spectrum 1-byte biased exponent (exp + 128) + 4-byte mantissa.
 */
export function encodeZxNumber(value: number): Uint8Array {
  const bytes = new Uint8Array(5);

  if (Number.isInteger(value) && value >= -65535 && value <= 65535) {
    bytes[0] = 0x00;
    if (value >= 0) {
      bytes[1] = 0x00;
      bytes[2] = value & 0xff;
      bytes[3] = (value >> 8) & 0xff;
    } else {
      const twos = 65536 + value;
      bytes[1] = 0xff;
      bytes[2] = twos & 0xff;
      bytes[3] = (twos >> 8) & 0xff;
    }
    bytes[4] = 0x00;
    return bytes;
  }

  if (value === 0) {
    return bytes;
  }

  const negative = value < 0;
  const absVal = Math.abs(value);
  const exp = Math.floor(Math.log2(absVal)) + 1;
  const biasedExp = exp + 128;
  const normalized = absVal / Math.pow(2, exp); // [0.5, 1.0)
  const mantissa = Math.round(normalized * 0x100000000); // 32-bit unsigned

  bytes[0] = biasedExp & 0xff;
  // Clear implicit leading 1 bit (MSB of byte 1), set to 1 only if negative
  const m1 = ((mantissa >>> 24) & 0x7f) | (negative ? 0x80 : 0x00);
  bytes[1] = m1;
  bytes[2] = (mantissa >>> 16) & 0xff;
  bytes[3] = (mantissa >>> 8) & 0xff;
  bytes[4] = mantissa & 0xff;

  return bytes;
}

function isAlpha(ch: string): boolean {
  return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

/**
 * Tokenizes a single Sinclair BASIC line (e.g. '10 BORDER 0: PRINT "HI"')
 * into the binary line record expected by ZX Spectrum / Didaktik M ROM.
 */
export function tokenizeBasicLine(line: string): Uint8Array {
  const match = line.trim().match(/^(\d+)\s+(.*)$/);
  if (!match) {
    throw new Error(`Invalid Sinclair BASIC line (missing line number): ${line}`);
  }
  const lineNumber = parseInt(match[1], 10);
  const body = match[2];

  const content: number[] = [];
  let i = 0;
  let inString = false;
  let inRem = false;

  while (i < body.length) {
    const ch = body[i];

    if (inRem) {
      content.push(ch.charCodeAt(0) & 0x7f);
      i++;
      continue;
    }

    if (inString) {
      content.push(ch.charCodeAt(0) & 0x7f);
      if (ch === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"') {
      inString = true;
      content.push(0x22);
      i++;
      continue;
    }

    // Check operators/keywords first
    let matchedToken: string | null = null;
    for (const token of SORTED_TOKEN_KEYS) {
      if (body.slice(i, i + token.length).toUpperCase() === token) {
        const isWordToken = isAlpha(token[0]);
        if (isWordToken) {
          // Ensure keyword doesn't split an identifier (e.g., PRINT shouldn't match inside SPRINT)
          const prevChar = i > 0 ? body[i - 1] : ' ';
          const nextChar = i + token.length < body.length ? body[i + token.length] : ' ';
          const tokenEndsWithSymbol = token.endsWith('$') || token.endsWith('#');
          if (isAlpha(prevChar)) {
            continue;
          }
          if (!tokenEndsWithSymbol && (isAlpha(nextChar) || isDigit(nextChar) || nextChar === '$')) {
            continue;
          }
        }
        matchedToken = token;
        break;
      }
    }

    if (matchedToken) {
      const code = SINCLAIR_TOKENS[matchedToken];
      content.push(code);
      i += matchedToken.length;
      if (code === SINCLAIR_TOKENS['REM']) {
        inRem = true;
      }
      continue;
    }

    // Check numeric literals (integer or decimal like .08 or 12.5)
    const prevCh = i > 0 ? body[i - 1] : ' ';
    const startsNumber =
      (isDigit(ch) || (ch === '.' && i + 1 < body.length && isDigit(body[i + 1]))) &&
      !isAlpha(prevCh);

    if (startsNumber) {
      let numStr = '';
      let sawDot = false;
      while (i < body.length) {
        const c = body[i];
        if (isDigit(c)) {
          numStr += c;
          i++;
        } else if (c === '.' && !sawDot) {
          sawDot = true;
          numStr += c;
          i++;
        } else {
          break;
        }
      }
      for (const c of numStr) {
        content.push(c.charCodeAt(0));
      }
      // Sinclair BASIC embeds 0x0E + 5-byte binary float after every numeric literal
      content.push(0x0e);
      const parsed = parseFloat(numStr);
      const encoded = encodeZxNumber(parsed);
      for (const b of encoded) {
        content.push(b);
      }
      continue;
    }

    content.push(ch.charCodeAt(0) & 0x7f);
    i++;
  }

  // Terminate line with ENTER (0x0D)
  content.push(0x0d);

  const lineLen = content.length;
  const out = new Uint8Array(4 + lineLen);
  // Line number is BIG-ENDIAN in ZX Spectrum BASIC
  out[0] = (lineNumber >> 8) & 0xff;
  out[1] = lineNumber & 0xff;
  // Line length is LITTLE-ENDIAN in ZX Spectrum BASIC
  out[2] = lineLen & 0xff;
  out[3] = (lineLen >> 8) & 0xff;
  out.set(content, 4);

  return out;
}

/**
 * Computes the standard ZX Spectrum tape block XOR checksum.
 */
export function computeTapeChecksum(bytes: Uint8Array): number {
  let xor = 0;
  for (let i = 0; i < bytes.length; i++) {
    xor ^= bytes[i];
  }
  return xor & 0xff;
}

export interface TapBlock {
  flag: number; // 0x00 header, 0xFF data
  payload: Uint8Array;
  rawWithFlagAndChecksum: Uint8Array;
}

export interface BuiltTapeArtifact {
  filename: string;
  basicLines: string[];
  basicBytes: Uint8Array;
  tapBytes: Uint8Array;
  blocks: TapBlock[];
  autostartLine: number;
}

/**
 * Compiles Sinclair BASIC lines into a complete, emulator- & Didaktik-M-ready .TAP file.
 */
export function buildTapFile(
  config: BasicProgramConfig,
  tapeName = 'ZUBOK&SIG',
  autostartLine = 10
): BuiltTapeArtifact {
  const basicLines = generateSinclairBasicLines(config);
  const tokenizedLines = basicLines.map(tokenizeBasicLine);
  const totalBasicLen = tokenizedLines.reduce((acc, l) => acc + l.length, 0);

  const basicBytes = new Uint8Array(totalBasicLen);
  let offset = 0;
  for (const lineBytes of tokenizedLines) {
    basicBytes.set(lineBytes, offset);
    offset += lineBytes.length;
  }

  // Build 19-byte Header Block (flag + 17 bytes header + checksum)
  const paddedName = tapeName.toUpperCase().replace(/[^A-Z0-9&\-_ ]/g, '').slice(0, 10).padEnd(10, ' ');
  const headerBody = new Uint8Array(18);
  headerBody[0] = 0x00; // Header flag
  headerBody[1] = 0x00; // File type: 0 = Program (BASIC)
  for (let i = 0; i < 10; i++) {
    headerBody[2 + i] = paddedName.charCodeAt(i);
  }
  // Length of data block (uint16 LE)
  headerBody[12] = totalBasicLen & 0xff;
  headerBody[13] = (totalBasicLen >> 8) & 0xff;
  // Parameter 1: Autostart line number (uint16 LE)
  headerBody[14] = autostartLine & 0xff;
  headerBody[15] = (autostartLine >> 8) & 0xff;
  // Parameter 2: Start of variable area (= basic length when no variables stored)
  headerBody[16] = totalBasicLen & 0xff;
  headerBody[17] = (totalBasicLen >> 8) & 0xff;

  const headerRaw = new Uint8Array(19);
  headerRaw.set(headerBody, 0);
  headerRaw[18] = computeTapeChecksum(headerBody);

  // Build Data Block (0xFF flag + basicBytes + checksum)
  const dataBody = new Uint8Array(1 + totalBasicLen);
  dataBody[0] = 0xff;
  dataBody.set(basicBytes, 1);

  const dataRaw = new Uint8Array(2 + totalBasicLen);
  dataRaw.set(dataBody, 0);
  dataRaw[dataRaw.length - 1] = computeTapeChecksum(dataBody);

  // Assemble .TAP binary: [uint16 LE len][block]...
  const tapBytes = new Uint8Array(2 + headerRaw.length + 2 + dataRaw.length);
  let ptr = 0;
  tapBytes[ptr++] = headerRaw.length & 0xff;
  tapBytes[ptr++] = (headerRaw.length >> 8) & 0xff;
  tapBytes.set(headerRaw, ptr);
  ptr += headerRaw.length;

  tapBytes[ptr++] = dataRaw.length & 0xff;
  tapBytes[ptr++] = (dataRaw.length >> 8) & 0xff;
  tapBytes.set(dataRaw, ptr);

  return {
    filename: paddedName.trim(),
    basicLines,
    basicBytes,
    tapBytes,
    autostartLine,
    blocks: [
      { flag: 0x00, payload: headerBody.slice(1), rawWithFlagAndChecksum: headerRaw },
      { flag: 0xff, payload: basicBytes, rawWithFlagAndChecksum: dataRaw },
    ],
  };
}

export type TapeClockProfile = 'zx35' | 'didaktik40';

export interface WavTapeResult {
  wavBytes: Uint8Array;
  sampleRate: number;
  durationSec: number;
  samplesFloat32: Float32Array;
}

/**
 * Fast O(bytes) exact duration calculator for a ZX Spectrum / Didaktik M audio cassette signal.
 * Used for instant UI readouts while editing dedication text without allocating PCM buffers.
 */
export function estimateTapeDurationSec(
  blocks: TapBlock[],
  clockProfile: TapeClockProfile = 'zx35'
): number {
  const tStatesPerSec = clockProfile === 'didaktik40' ? 3850000 : 3500000;
  let totalT = 0;
  let silenceSec = 0.35; // lead-in

  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];
    const pilotPulses = block.flag < 128 ? 8063 : 3223;
    totalT += pilotPulses * 2168 + 667 + 735;

    const raw = block.rawWithFlagAndChecksum;
    for (let i = 0; i < raw.length; i++) {
      const byte = raw[i];
      for (let bit = 7; bit >= 0; bit--) {
        totalT += (byte & (1 << bit)) !== 0 ? 3420 : 1710;
      }
    }
    totalT += 855; // trailing edge
    silenceSec += bIdx === 0 ? 1.0 : 0.4;
  }

  return silenceSec + totalT / tStatesPerSec;
}

/**
 * Encodes .TAP blocks into an authentic 44.1 kHz Mono 16-bit PCM .WAV file
 * using exact ZX Spectrum / Didaktik M ROM tape pulse timings:
 * - Pilot pulse: 2168 T-states (8063 pulses for header, 3223 for data)
 * - Sync1: 667 T-states, Sync2: 735 T-states
 * - Bit 0: 2 x 855 T-states
 * - Bit 1: 2 x 1710 T-states
 */
export function encodeTapeToWav(
  blocks: TapBlock[],
  clockProfile: TapeClockProfile = 'zx35',
  sampleRate = 44100
): WavTapeResult {
  // Standard ZX Spectrum = 3.50 MHz; Didaktik M clock = 4.00 MHz (Wait-state compensated ~3.5-3.85 MHz)
  // Using 3.5 MHz is universally readable by Didaktik M ROM; 3.85 MHz matches uncontended Didaktik M 4.0 MHz slightly faster.
  const tStatesPerSec = clockProfile === 'didaktik40' ? 3850000 : 3500000;
  const samplesPerT = sampleRate / tStatesPerSec;

  const PILOT_T = 2168;
  const SYNC1_T = 667;
  const SYNC2_T = 735;
  const BIT0_T = 855;
  const BIT1_T = 1710;

  // Estimate sample count upfront
  let estimatedPulses = sampleRate * 1.5; // lead-in + gaps
  for (const block of blocks) {
    const pilotCount = block.flag < 128 ? 8063 : 3223;
    estimatedPulses += pilotCount * PILOT_T * samplesPerT;
    estimatedPulses += (SYNC1_T + SYNC2_T) * samplesPerT;
    estimatedPulses += block.rawWithFlagAndChecksum.length * 8 * 2 * BIT1_T * samplesPerT;
    estimatedPulses += sampleRate * 1.1; // inter-block pause
  }

  const buffer = new Float32Array(Math.ceil(estimatedPulses) + sampleRate);
  let writeIdx = 0;
  let phase = 1;
  let fractionalAcc = 0;

  const emitSilence = (seconds: number) => {
    const count = Math.floor(seconds * sampleRate);
    for (let i = 0; i < count && writeIdx < buffer.length; i++) {
      buffer[writeIdx++] = 0;
    }
  };

  const emitPulse = (tStates: number) => {
    const exactSamples = tStates * samplesPerT + fractionalAcc;
    const count = Math.floor(exactSamples);
    fractionalAcc = exactSamples - count;
    const amp = phase * 0.85;
    for (let i = 0; i < count && writeIdx < buffer.length; i++) {
      buffer[writeIdx++] = amp;
    }
    phase = -phase;
  };

  // 0.35s quiet lead-in so cassette decks stabilize
  emitSilence(0.35);

  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];
    const pilotPulses = block.flag < 128 ? 8063 : 3223;

    for (let p = 0; p < pilotPulses; p++) {
      emitPulse(PILOT_T);
    }

    // Sync pair
    emitPulse(SYNC1_T);
    emitPulse(SYNC2_T);

    // Data bytes (MSB first, per ZX Spectrum ROM)
    const raw = block.rawWithFlagAndChecksum;
    for (let i = 0; i < raw.length; i++) {
      const byte = raw[i];
      for (let bit = 7; bit >= 0; bit--) {
        const pulseLen = (byte & (1 << bit)) !== 0 ? BIT1_T : BIT0_T;
        emitPulse(pulseLen);
        emitPulse(pulseLen);
      }
    }

    // Final trailing edge & 1.0s pause between header and data block
    emitPulse(BIT0_T);
    emitSilence(bIdx === 0 ? 1.0 : 0.4);
  }

  const samplesFloat32 = buffer.subarray(0, writeIdx);
  const numSamples = samplesFloat32.length;
  const dataByteLen = numSamples * 2; // 16-bit PCM mono
  const wavBytes = new Uint8Array(44 + dataByteLen);
  const view = new DataView(wavBytes.buffer);

  // RIFF Header
  const writeAscii = (pos: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      wavBytes[pos + i] = text.charCodeAt(i);
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLen, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
  view.setUint16(22, 1, true); // NumChannels = 1 (Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeAscii(36, 'data');
  view.setUint32(40, dataByteLen, true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samplesFloat32[i]));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }

  return {
    wavBytes,
    sampleRate,
    durationSec: numSamples / sampleRate,
    samplesFloat32,
  };
}

// ============================================================================
// Additive Deluxe Tape Builder (Loader + 6912B SCREEN$ + Game), .TAP Parser,
// and ROM-accurate WAV -> Blocks Round-Trip Decoder
// ============================================================================

export interface BuiltDeluxeTapeArtifact {
  filename: string;
  loaderLines: string[];
  gameLines: string[];
  screenBytes: Uint8Array;
  tapBytes: Uint8Array;
  blocks: TapBlock[];
}

export interface ParsedTapHeader {
  fileType: number; // 0 = Program, 1 = Num array, 2 = Char array, 3 = Bytes/Code
  name: string;
  dataLength: number;
  param1: number;
  param2: number;
}

export interface ParsedTapBlock {
  blockLength: number;
  flag: number;
  payload: Uint8Array;
  checksum: number;
  checksumValid: boolean;
  header?: ParsedTapHeader;
}

export interface DecodedWavBlock {
  rawBytes: Uint8Array;
  flag: number;
  payload: Uint8Array;
  checksumValid: boolean;
  pilotPulses: number;
}

function buildGenericHeaderBlock(
  fileType: number,
  tapeName: string,
  dataLen: number,
  param1: number,
  param2: number
): TapBlock {
  const paddedName = tapeName
    .toUpperCase()
    .replace(/[^A-Z0-9&\-_ ]/g, '')
    .slice(0, 10)
    .padEnd(10, ' ');

  const headerBody = new Uint8Array(18);
  headerBody[0] = 0x00; // Header flag
  headerBody[1] = fileType & 0xff;
  for (let i = 0; i < 10; i++) {
    headerBody[2 + i] = paddedName.charCodeAt(i);
  }
  headerBody[12] = dataLen & 0xff;
  headerBody[13] = (dataLen >> 8) & 0xff;
  headerBody[14] = param1 & 0xff;
  headerBody[15] = (param1 >> 8) & 0xff;
  headerBody[16] = param2 & 0xff;
  headerBody[17] = (param2 >> 8) & 0xff;

  const headerRaw = new Uint8Array(19);
  headerRaw.set(headerBody, 0);
  headerRaw[18] = computeTapeChecksum(headerBody);

  return {
    flag: 0x00,
    payload: headerBody.slice(1),
    rawWithFlagAndChecksum: headerRaw,
  };
}

function buildGenericDataBlock(payload: Uint8Array): TapBlock {
  const dataBody = new Uint8Array(1 + payload.length);
  dataBody[0] = 0xff;
  dataBody.set(payload, 1);

  const dataRaw = new Uint8Array(2 + payload.length);
  dataRaw.set(dataBody, 0);
  dataRaw[dataRaw.length - 1] = computeTapeChecksum(dataBody);

  return {
    flag: 0xff,
    payload: new Uint8Array(payload),
    rawWithFlagAndChecksum: dataRaw,
  };
}

function assembleTapBlocks(blocks: TapBlock[]): Uint8Array {
  let totalLen = 0;
  for (const b of blocks) {
    totalLen += 2 + b.rawWithFlagAndChecksum.length;
  }
  const tapBytes = new Uint8Array(totalLen);
  let ptr = 0;
  for (const b of blocks) {
    const len = b.rawWithFlagAndChecksum.length;
    tapBytes[ptr++] = len & 0xff;
    tapBytes[ptr++] = (len >> 8) & 0xff;
    tapBytes.set(b.rawWithFlagAndChecksum, ptr);
    ptr += len;
  }
  return tapBytes;
}

function tokenizeProgramLines(lines: string[]): Uint8Array {
  const tokenized = lines.map(tokenizeBasicLine);
  const totalLen = tokenized.reduce((acc, l) => acc + l.length, 0);
  const bytes = new Uint8Array(totalLen);
  let offset = 0;
  for (const lineBytes of tokenized) {
    bytes.set(lineBytes, offset);
    offset += lineBytes.length;
  }
  return bytes;
}

/**
 * Builds a 6-block Deluxe .TAP cassette archive for Didaktik M / ZX Spectrum 48K:
 *   1-2) Loader BASIC program ("ZUBOK&SIG", autostart 10): LOAD ""SCREEN$ then LOAD ""
 *   3-4) Bytes SCREEN$ block ("ZUBOK", 6912 B, load address 16384 / $4000)
 *   5-6) Main Game BASIC program ("GAME", autostart 10) + optional extra BASIC lines (e.g. signatures DATA)
 * Does NOT alter the original 2-block buildTapFile output.
 */
export function buildDeluxeTapFile(
  config: BasicProgramConfig,
  screenBytes: Uint8Array,
  extraBasicLines?: string[]
): BuiltDeluxeTapeArtifact {
  if (screenBytes.length !== 6912) {
    throw new Error(`ZX Spectrum SCREEN$ must be exactly 6912 bytes (got ${screenBytes.length})`);
  }

  const loaderLines = [
    '10 BORDER 0: PAPER 0: INK 0: CLS',
    '20 LOAD ""SCREEN$',
    '30 LOAD ""',
  ];
  const loaderBytes = tokenizeProgramLines(loaderLines);

  const baseGameLines = generateSinclairBasicLines(config);
  const hasSignatureScreen = Boolean(
    extraBasicLines?.some((line) => line.startsWith('9000 '))
  );
  const routedBaseLines = hasSignatureScreen
    ? baseGameLines.map((line) =>
        line.startsWith('795 ') ? '795 PAUSE 120: GOTO 9000' : line
      )
    : baseGameLines;
  const gameLines =
    extraBasicLines && extraBasicLines.length > 0
      ? [...routedBaseLines, ...extraBasicLines]
      : routedBaseLines;
  const gameBytes = tokenizeProgramLines(gameLines);

  const blocks: TapBlock[] = [
    buildGenericHeaderBlock(0x00, 'ZUBOK&SIG', loaderBytes.length, 10, loaderBytes.length),
    buildGenericDataBlock(loaderBytes),
    buildGenericHeaderBlock(0x03, 'ZUBOK', 6912, 16384, 32768),
    buildGenericDataBlock(screenBytes),
    buildGenericHeaderBlock(0x00, 'GAME', gameBytes.length, 10, gameBytes.length),
    buildGenericDataBlock(gameBytes),
  ];

  return {
    filename: 'ZUBOK&SIG',
    loaderLines,
    gameLines,
    screenBytes: new Uint8Array(screenBytes),
    tapBytes: assembleTapBlocks(blocks),
    blocks,
  };
}

/**
 * Parses a binary .TAP archive into structured blocks and verifies XOR checksums.
 */
export function parseTap(bytes: Uint8Array): ParsedTapBlock[] {
  const result: ParsedTapBlock[] = [];
  let ptr = 0;

  while (ptr + 2 <= bytes.length) {
    const blockLength = bytes[ptr] | (bytes[ptr + 1] << 8);
    ptr += 2;
    if (blockLength < 2 || ptr + blockLength > bytes.length) {
      throw new Error(`Invalid .TAP block length ${blockLength} at offset ${ptr - 2}`);
    }

    const raw = bytes.subarray(ptr, ptr + blockLength);
    ptr += blockLength;

    let xor = 0;
    for (let i = 0; i < raw.length; i++) {
      xor ^= raw[i];
    }

    const flag = raw[0];
    const payload = raw.slice(1, raw.length - 1);
    const checksum = raw[raw.length - 1];
    const checksumValid = xor === 0;

    let header: ParsedTapHeader | undefined;
    if (flag === 0x00 && blockLength === 19) {
      let name = '';
      for (let i = 0; i < 10; i++) {
        name += String.fromCharCode(payload[1 + i]);
      }
      header = {
        fileType: payload[0],
        name,
        dataLength: payload[11] | (payload[12] << 8),
        param1: payload[13] | (payload[14] << 8),
        param2: payload[15] | (payload[16] << 8),
      };
    }

    result.push({
      blockLength,
      flag,
      payload,
      checksum,
      checksumValid,
      header,
    });
  }

  return result;
}

/**
 * Simulates the ZX Spectrum / Didaktik M ROM LD-BYTES edge-timing tape decoder on a 16-bit PCM .WAV file.
 * Measures pulse widths in T-states relative to the reference ROM clock (default 3.5 MHz = zx35)
 * and recovers each tape block's exact bytes and XOR checksum validity.
 */
export function decodeWavToBlocks(
  wavBytes: Uint8Array,
  referenceClock: TapeClockProfile = 'zx35'
): DecodedWavBlock[] {
  if (wavBytes.length < 44) {
    throw new Error('WAV buffer too short');
  }
  const view = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength);
  const riff = String.fromCharCode(wavBytes[0], wavBytes[1], wavBytes[2], wavBytes[3]);
  const wave = String.fromCharCode(wavBytes[8], wavBytes[9], wavBytes[10], wavBytes[11]);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('Invalid RIFF/WAVE header');
  }

  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);
  if (bitsPerSample !== 16) {
    throw new Error(`Unsupported WAV bit depth: ${bitsPerSample}`);
  }
  const dataByteLen = view.getUint32(40, true);
  const numSamples = Math.min(
    Math.floor(dataByteLen / 2),
    Math.floor((wavBytes.length - 44) / 2)
  );

  const tStatesPerSec = referenceClock === 'didaktik40' ? 3850000 : 3500000;
  const ampThreshold = 2000;

  // Segment PCM stream into half-pulse runs & silence gaps
  interface PulseRun {
    isSilence: boolean;
    tStates: number;
  }

  const runs: PulseRun[] = [];
  let curState = 0; // -1, 0, +1
  let curCount = 0;

  for (let i = 0; i < numSamples; i++) {
    const sample = view.getInt16(44 + i * 2, true);
    const state = sample >= ampThreshold ? 1 : sample <= -ampThreshold ? -1 : 0;
    if (state === curState) {
      curCount++;
    } else {
      if (curCount > 0) {
        runs.push({
          isSilence: curState === 0,
          tStates: (curCount / sampleRate) * tStatesPerSec,
        });
      }
      curState = state;
      curCount = 1;
    }
  }
  if (curCount > 0) {
    runs.push({
      isSilence: curState === 0,
      tStates: (curCount / sampleRate) * tStatesPerSec,
    });
  }

  // ROM LD-BYTES state machine: detect pilot -> sync1 + sync2 -> MSB-first data bit pairs
  const blocks: DecodedWavBlock[] = [];
  let idx = 0;

  while (idx < runs.length) {
    // 1) Find pilot leader (>= 100 consecutive pulses around 2168 T-states)
    let pilotCount = 0;
    while (idx < runs.length) {
      const r = runs[idx];
      if (!r.isSilence && r.tStates >= 1400 && r.tStates <= 3000) {
        pilotCount++;
        idx++;
      } else {
        break;
      }
    }

    if (pilotCount < 100) {
      idx++;
      continue;
    }

    // 2) Verify sync1 + sync2 short pulses (< 1150 T-states each)
    if (
      idx + 1 >= runs.length ||
      runs[idx].isSilence ||
      runs[idx + 1].isSilence ||
      runs[idx].tStates > 1150 ||
      runs[idx + 1].tStates > 1150
    ) {
      idx++;
      continue;
    }
    idx += 2;

    // 3) Decode data bits (each bit = 2 half-pulses; Bit0 ~ 1710 T, Bit1 ~ 3420 T, threshold = 2565 T)
    const decodedBytes: number[] = [];
    let currentByte = 0;
    let bitCount = 0;

    while (idx + 1 < runs.length) {
      const p1 = runs[idx];
      const p2 = runs[idx + 1];
      if (p1.isSilence || p2.isSilence) {
        break;
      }
      const pairT = p1.tStates + p2.tStates;
      if (pairT < 900 || pairT > 5000) {
        break;
      }
      const bit = pairT >= 2565 ? 1 : 0;
      currentByte = (currentByte << 1) | bit;
      bitCount++;
      idx += 2;

      if (bitCount === 8) {
        decodedBytes.push(currentByte);
        currentByte = 0;
        bitCount = 0;
      }
    }

    if (decodedBytes.length >= 2) {
      const rawBytes = new Uint8Array(decodedBytes);
      let xor = 0;
      for (let i = 0; i < rawBytes.length; i++) {
        xor ^= rawBytes[i];
      }
      blocks.push({
        rawBytes,
        flag: rawBytes[0],
        payload: rawBytes.slice(1, rawBytes.length - 1),
        checksumValid: xor === 0,
        pilotPulses: pilotCount,
      });
    }
  }

  return blocks;
}

