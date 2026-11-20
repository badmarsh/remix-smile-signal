/**
 * Pure ZX Spectrum / Didaktik M SCREEN$ (6912 B) encoder, decoder, and ZX palette quantizer.
 * Zero DOM dependencies — fully unit-testable in Node.js.
 */

import { computeZxAttributeByte } from './udgAssets';

export const ZX_SCREEN_W = 256;
export const ZX_SCREEN_H = 192;
export const ZX_BITMAP_BYTES = 6144;
export const ZX_ATTR_BYTES = 768;
export const ZX_SCREEN_BYTES = ZX_BITMAP_BYTES + ZX_ATTR_BYTES; // 6912

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// Normal (BRIGHT 0) 8-color ZX Spectrum / Didaktik M palette matching ZX_PALETTE
export const ZX_RGB_NORMAL: readonly RgbColor[] = [
  { r: 0, g: 0, b: 0 },       // 0 black
  { r: 0, g: 0, b: 200 },     // 1 blue
  { r: 200, g: 0, b: 0 },     // 2 red
  { r: 200, g: 0, b: 200 },   // 3 magenta
  { r: 0, g: 200, b: 0 },     // 4 green
  { r: 0, g: 200, b: 200 },   // 5 cyan
  { r: 200, g: 200, b: 0 },   // 6 yellow
  { r: 200, g: 200, b: 200 }, // 7 white
];

// Bright (BRIGHT 1) 8-color ZX Spectrum / Didaktik M palette matching ZX_PALETTE
export const ZX_RGB_BRIGHT: readonly RgbColor[] = [
  { r: 0, g: 0, b: 0 },       // 0 black (same as normal)
  { r: 0, g: 34, b: 255 },    // 1 brightBlue
  { r: 255, g: 30, b: 30 },   // 2 brightRed
  { r: 255, g: 30, b: 255 },  // 3 brightMagenta
  { r: 26, g: 230, b: 42 },   // 4 brightGreen
  { r: 0, g: 232, b: 232 },   // 5 brightCyan
  { r: 255, g: 238, b: 0 },   // 6 brightYellow
  { r: 255, g: 255, b: 255 }, // 7 brightWhite
];

// 15 unique ZX colors (bright black == normal black)
const ZX_UNIQUE_RGB: readonly RgbColor[] = [
  ...ZX_RGB_NORMAL,
  ...ZX_RGB_BRIGHT.slice(1),
];

// 4x4 Bayer ordered dithering matrix normalized to [-0.5, +0.5]
const BAYER_4X4: readonly number[] = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
].map((v) => (v + 0.5) / 16 - 0.5);

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function colorDistSq(r1: number, g1: number, b1: number, c: RgbColor): number {
  const dr = r1 - c.r;
  const dg = g1 - c.g;
  const db = b1 - c.b;
  // Perceptual luminance-weighted RGB distance
  return 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;
}

/**
 * Exact ZX Spectrum / Didaktik M interlaced video RAM bitmap byte offset for pixel (x, y).
 * Range: 0..6143 (corresponding to $4000..$57FF in RAM).
 */
export function zxScreenOffset(x: number, y: number): number {
  const cx = Math.max(0, Math.min(ZX_SCREEN_W - 1, x | 0));
  const cy = Math.max(0, Math.min(ZX_SCREEN_H - 1, y | 0));
  return ((cy & 0xc0) << 5) + ((cy & 7) << 8) + ((cy & 0x38) << 2) + (cx >> 3);
}

/**
 * Converts an arbitrary RGBA buffer (w x h) into a 6912-byte authentic ZX Spectrum SCREEN$ block:
 * - Scales input to 256x192
 * - Applies 4x4 Bayer ordered dithering
 * - Enforces authentic 8x8 attribute clash (one BRIGHT flag + optimal INK/PAPER pair per cell)
 * - Writes interlaced bitmap (6144 B) + attributes (768 B)
 */
export function rgbaToZxScreen(
  rgba: Uint8ClampedArray | Uint8Array,
  w: number,
  h: number
): Uint8Array {
  const screen = new Uint8Array(ZX_SCREEN_BYTES);
  if (w <= 0 || h <= 0 || rgba.length < w * h * 4) {
    return screen;
  }

  // Resample to 256x192 and apply ordered dithering
  const ditheredR = new Float32Array(ZX_SCREEN_W * ZX_SCREEN_H);
  const ditheredG = new Float32Array(ZX_SCREEN_W * ZX_SCREEN_H);
  const ditheredB = new Float32Array(ZX_SCREEN_W * ZX_SCREEN_H);
  const ditherStrength = 44;

  for (let y = 0; y < ZX_SCREEN_H; y++) {
    const sy = Math.min(h - 1, Math.floor((y * h) / ZX_SCREEN_H));
    for (let x = 0; x < ZX_SCREEN_W; x++) {
      const sx = Math.min(w - 1, Math.floor((x * w) / ZX_SCREEN_W));
      const srcIdx = (sy * w + sx) * 4;
      const dstIdx = y * ZX_SCREEN_W + x;
      const bayer = BAYER_4X4[((y & 3) << 2) | (x & 3)] * ditherStrength;
      ditheredR[dstIdx] = clampByte(rgba[srcIdx] + bayer);
      ditheredG[dstIdx] = clampByte(rgba[srcIdx + 1] + bayer);
      ditheredB[dstIdx] = clampByte(rgba[srcIdx + 2] + bayer);
    }
  }

  // Solve optimal (ink, paper, bright) per 8x8 attribute cell
  for (let cellY = 0; cellY < 24; cellY++) {
    for (let cellX = 0; cellX < 32; cellX++) {
      let bestErr = Number.POSITIVE_INFINITY;
      let bestInk = 7;
      let bestPaper = 0;
      let bestBright = false;

      // Pre-extract 64 pixels in this 8x8 cell
      const cellR = new Float32Array(64);
      const cellG = new Float32Array(64);
      const cellB = new Float32Array(64);
      let k = 0;
      for (let ly = 0; ly < 8; ly++) {
        const py = cellY * 8 + ly;
        const rowBase = py * ZX_SCREEN_W + cellX * 8;
        for (let lx = 0; lx < 8; lx++) {
          const idx = rowBase + lx;
          cellR[k] = ditheredR[idx];
          cellG[k] = ditheredG[idx];
          cellB[k] = ditheredB[idx];
          k++;
        }
      }

      for (let brightIdx = 0; brightIdx < 2; brightIdx++) {
        const pal = brightIdx === 1 ? ZX_RGB_BRIGHT : ZX_RGB_NORMAL;
        // Precompute distance of each of the 64 pixels to each of the 8 colors in this brightness bank
        const distTable = new Float32Array(8 * 64);
        for (let c = 0; c < 8; c++) {
          const col = pal[c];
          const base = c * 64;
          for (let p = 0; p < 64; p++) {
            distTable[base + p] = colorDistSq(cellR[p], cellG[p], cellB[p], col);
          }
        }

        for (let paper = 0; paper < 8; paper++) {
          const pBase = paper * 64;
          for (let ink = paper; ink < 8; ink++) {
            const iBase = ink * 64;
            let err = 0;
            for (let p = 0; p < 64; p++) {
              const dp = distTable[pBase + p];
              const di = distTable[iBase + p];
              err += di < dp ? di : dp;
              if (err >= bestErr) break;
            }
            if (err < bestErr) {
              bestErr = err;
              bestInk = ink;
              bestPaper = paper;
              bestBright = brightIdx === 1;
            }
          }
        }
      }

      // Write attribute byte
      screen[ZX_BITMAP_BYTES + cellY * 32 + cellX] = computeZxAttributeByte(
        bestInk,
        bestPaper,
        bestBright ? 1 : 0
      );

      // Write interlaced bitmap bits for this 8x8 cell
      const pal = bestBright ? ZX_RGB_BRIGHT : ZX_RGB_NORMAL;
      const inkCol = pal[bestInk];
      const paperCol = pal[bestPaper];

      for (let ly = 0; ly < 8; ly++) {
        const py = cellY * 8 + ly;
        let byteVal = 0;
        for (let lx = 0; lx < 8; lx++) {
          const pIdx = ly * 8 + lx;
          const di = colorDistSq(cellR[pIdx], cellG[pIdx], cellB[pIdx], inkCol);
          const dp = colorDistSq(cellR[pIdx], cellG[pIdx], cellB[pIdx], paperCol);
          if (di < dp) {
            byteVal |= 1 << (7 - lx);
          }
        }
        screen[zxScreenOffset(cellX * 8, py)] = byteVal;
      }
    }
  }

  return screen;
}

/**
 * Decodes a 6912-byte ZX Spectrum SCREEN$ buffer into 256x192 RGBA pixels using strict ZX_PALETTE colors.
 */
export function zxScreenToRgba(screenBytes: Uint8Array): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(ZX_SCREEN_W * ZX_SCREEN_H * 4);
  if (screenBytes.length < ZX_SCREEN_BYTES) {
    return rgba;
  }

  for (let y = 0; y < ZX_SCREEN_H; y++) {
    const cellY = y >> 3;
    for (let cellX = 0; cellX < 32; cellX++) {
      const attr = screenBytes[ZX_BITMAP_BYTES + cellY * 32 + cellX];
      const inkIdx = attr & 0x07;
      const paperIdx = (attr >> 3) & 0x07;
      const bright = (attr & 0x40) !== 0;
      const pal = bright ? ZX_RGB_BRIGHT : ZX_RGB_NORMAL;
      const ink = pal[inkIdx];
      const paper = pal[paperIdx];

      const bitmapByte = screenBytes[zxScreenOffset(cellX * 8, y)];
      for (let bit = 0; bit < 8; bit++) {
        const isInk = (bitmapByte & (1 << (7 - bit))) !== 0;
        const col = isInk ? ink : paper;
        const px = cellX * 8 + bit;
        const outIdx = (y * ZX_SCREEN_W + px) * 4;
        rgba[outIdx] = col.r;
        rgba[outIdx + 1] = col.g;
        rgba[outIdx + 2] = col.b;
        rgba[outIdx + 3] = 255;
      }
    }
  }

  return rgba;
}

/**
 * Quantizes an RGBA image (e.g., Rado's 24x24 in-game portrait) strictly onto the 15-color ZX_PALETTE
 * with gentle 4x4 Bayer ordered dithering so zero non-ZX colors appear on the canvas.
 */
export function quantizeRgbaToZxPalette(
  rgba: Uint8ClampedArray | Uint8Array,
  w: number,
  h: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  const ditherStrength = 28;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const alpha = rgba[idx + 3];
      if (alpha < 128) {
        out[idx + 3] = 0;
        continue;
      }
      const bayer = BAYER_4X4[((y & 3) << 2) | (x & 3)] * ditherStrength;
      const r = clampByte(rgba[idx] + bayer);
      const g = clampByte(rgba[idx + 1] + bayer);
      const b = clampByte(rgba[idx + 2] + bayer);

      let best = ZX_UNIQUE_RGB[0];
      let bestErr = Number.POSITIVE_INFINITY;
      for (let c = 0; c < ZX_UNIQUE_RGB.length; c++) {
        const err = colorDistSq(r, g, b, ZX_UNIQUE_RGB[c]);
        if (err < bestErr) {
          bestErr = err;
          best = ZX_UNIQUE_RGB[c];
        }
      }
      out[idx] = best.r;
      out[idx + 1] = best.g;
      out[idx + 2] = best.b;
      out[idx + 3] = 255;
    }
  }

  return out;
}

/**
 * Pure state machine for the web Didaktik M cassette loading screen intro.
 * Simulates red/cyan pilot stripes -> blue/yellow data stripes -> SCREEN$ revealed in 3 thirds.
 */
export type CassetteIntroPhase = 'pilot' | 'header' | 'loading_screen' | 'ready' | 'done';

export interface CassetteIntroState {
  phase: CassetteIntroPhase;
  stripeMode: 'red_cyan' | 'blue_yellow' | 'black';
  revealedThirds: number; // 0, 1, 2, or 3
  revealedLines: number;  // 0..192
  statusLine: string;
  progress: number;       // 0..1
}

export const CASSETTE_INTRO_DURATION_SEC = 5.4;

export function computeCassetteIntroState(elapsedSec: number): CassetteIntroState {
  const t = Math.max(0, elapsedSec);

  if (t < 1.1) {
    return {
      phase: 'pilot',
      stripeMode: 'red_cyan',
      revealedThirds: 0,
      revealedLines: 0,
      statusLine: 'LOAD ""  ·  PILOTNÝ TÓN 806 Hz',
      progress: t / CASSETTE_INTRO_DURATION_SEC,
    };
  }

  if (t < 1.85) {
    return {
      phase: 'header',
      stripeMode: 'blue_yellow',
      revealedThirds: 0,
      revealedLines: 0,
      statusLine: 'Program: ZUBOK&SIG  ·  Bytes: ZUBOK',
      progress: t / CASSETTE_INTRO_DURATION_SEC,
    };
  }

  if (t < 4.55) {
    const loadFrac = (t - 1.85) / 2.7; // 0..1 across 3 thirds
    const revealedLines = Math.min(192, Math.floor(loadFrac * 192));
    const revealedThirds = Math.min(3, Math.floor(revealedLines / 64) + 1);
    return {
      phase: 'loading_screen',
      stripeMode: 'blue_yellow',
      revealedThirds,
      revealedLines,
      statusLine: `NAHRÁVAM SCREEN$ (${revealedThirds}/3 TRETINY)`,
      progress: t / CASSETTE_INTRO_DURATION_SEC,
    };
  }

  if (t < CASSETTE_INTRO_DURATION_SEC) {
    return {
      phase: 'ready',
      stripeMode: 'black',
      revealedThirds: 3,
      revealedLines: 192,
      statusLine: 'DIDAKTIK M PRIPRAVENÝ · STLAČ KLÁVESU',
      progress: t / CASSETTE_INTRO_DURATION_SEC,
    };
  }

  return {
    phase: 'done',
    stripeMode: 'black',
    revealedThirds: 3,
    revealedLines: 192,
    statusLine: 'HOTOVO',
    progress: 1,
  };
}
