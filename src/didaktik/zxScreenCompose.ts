/**
 * Browser-only canvas helpers for composing the 256x192 Didaktik M SCREEN$ loading artwork
 * and quantizing Rado's 24x24 in-game portrait strictly onto the 15-color ZX_PALETTE.
 */

import { ZX_PALETTE } from './specs';
import {
  quantizeRgbaToZxPalette,
  rgbaToZxScreen,
  ZX_SCREEN_H,
  ZX_SCREEN_W,
  zxScreenToRgba,
} from './zxScreen';

/**
 * Composes a 256x192 RGBA loading screen featuring Rado's portrait, title,
 * Rimavská Sobota crest motif, and microDENT/TeatrO tribute, then converts it to 6912-byte SCREEN$.
 */
export function buildLoadingScreenBytesFromImage(img: HTMLImageElement | null): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = ZX_SCREEN_W;
  canvas.height = ZX_SCREEN_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new Uint8Array(6912);
  }

  ctx.imageSmoothingEnabled = false;

  // Deep black-blue ZX Spectrum background
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(0, 0, ZX_SCREEN_W, ZX_SCREEN_H);

  // Top & bottom Didaktik M rainbow accent bars (aligned to 8px cell rows!)
  const stripeColors = [
    ZX_PALETTE.brightRed,
    ZX_PALETTE.brightYellow,
    ZX_PALETTE.brightGreen,
    ZX_PALETTE.brightCyan,
  ];
  for (let i = 0; i < stripeColors.length; i++) {
    ctx.fillStyle = stripeColors[i];
    ctx.fillRect(16 + i * 56, 8, 52, 4);
    ctx.fillRect(16 + i * 56, 180, 52, 4);
  }

  // Left portrait frame (8-pixel aligned: x=16..112, y=32..144)
  ctx.fillStyle = ZX_PALETTE.blue;
  ctx.fillRect(16, 32, 96, 112);
  ctx.strokeStyle = ZX_PALETTE.brightYellow;
  ctx.lineWidth = 2;
  ctx.strokeRect(17, 33, 94, 110);

  if (img && img.width > 0 && img.height > 0) {
    const srcSize = Math.min(img.width, img.height);
    const sx = Math.max(0, Math.floor((img.width - srcSize) / 2));
    ctx.drawImage(img, sx, 0, srcSize, srcSize, 20, 36, 88, 104);
  } else {
    // Crisp fallback geometric portrait emblem before image loads
    ctx.fillStyle = ZX_PALETTE.brightCyan;
    ctx.fillRect(36, 52, 56, 56);
    ctx.fillStyle = ZX_PALETTE.brightYellow;
    ctx.fillRect(48, 64, 32, 32);
    ctx.fillStyle = ZX_PALETTE.brightWhite;
    ctx.fillRect(56, 72, 16, 16);
  }

  // Right title & Rimavská Sobota crest block (8-pixel aligned: x=120..248)
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('ZÚBOK A', 124, 36);
  ctx.fillStyle = ZX_PALETTE.brightCyan;
  ctx.fillText('SIGNÁLIK', 124, 54);

  ctx.fillStyle = ZX_PALETTE.brightWhite;
  ctx.font = 'bold 9px monospace';
  ctx.fillText('PRE RADA CEGLÉDYHO', 124, 78);

  ctx.fillStyle = ZX_PALETTE.brightGreen;
  ctx.fillText('RIMAVSKÁ SOBOTA', 124, 94);
  ctx.fillStyle = ZX_PALETTE.white;
  ctx.fillText('microDENT · TeatrO', 124, 108);

  // Stylized Rimavská Sobota golden eagle crest block (x=124..168, y=124..148)
  ctx.fillStyle = ZX_PALETTE.blue;
  ctx.fillRect(124, 124, 44, 24);
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.fillRect(132, 128, 28, 4);
  ctx.fillRect(138, 132, 16, 8);
  ctx.fillRect(142, 140, 8, 4);
  ctx.fillStyle = ZX_PALETTE.brightRed;
  ctx.fillRect(144, 130, 4, 4);

  ctx.fillStyle = ZX_PALETTE.brightCyan;
  ctx.font = 'bold 9px monospace';
  ctx.fillText('DIDAKTIK M', 174, 127);
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.fillText('48K · 1270', 174, 139);

  // Bottom footer bar (aligned to y=156..172)
  ctx.fillStyle = ZX_PALETTE.brightWhite;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VIANOCE · OBČANIA REGIÓNU RS', 128, 160);

  const imageData = ctx.getImageData(0, 0, ZX_SCREEN_W, ZX_SCREEN_H);
  return rgbaToZxScreen(imageData.data, ZX_SCREEN_W, ZX_SCREEN_H);
}

/**
 * Renders a 6912-byte SCREEN$ buffer onto a 256x192 HTMLCanvasElement (or subset of lines for intro).
 */
export function paintZxScreenToCanvas(
  canvas: HTMLCanvasElement,
  screenBytes: Uint8Array,
  maxLines = ZX_SCREEN_H
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rgba = zxScreenToRgba(screenBytes);
  const clampedLines = Math.max(0, Math.min(ZX_SCREEN_H, maxLines));

  if (clampedLines < ZX_SCREEN_H) {
    // Clear unrevealed lines to black
    for (let y = clampedLines; y < ZX_SCREEN_H; y++) {
      const rowOffset = y * ZX_SCREEN_W * 4;
      for (let x = 0; x < ZX_SCREEN_W * 4; x += 4) {
        rgba[rowOffset + x] = 0;
        rgba[rowOffset + x + 1] = 0;
        rgba[rowOffset + x + 2] = 0;
        rgba[rowOffset + x + 3] = 255;
      }
    }
  }

  const imageData = new ImageData(new Uint8ClampedArray(rgba), ZX_SCREEN_W, ZX_SCREEN_H);
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Creates a crisp, strictly 15-color ZX_PALETTE quantized offscreen canvas of Rado's portrait.
 */
export function createZxQuantizedPortraitCanvas(
  img: HTMLImageElement,
  size = 24
): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const ctx = off.getContext('2d');
  if (!ctx) return off;

  ctx.imageSmoothingEnabled = false;
  const srcSize = Math.min(img.width, img.height);
  const sx = Math.max(0, Math.floor((img.width - srcSize) / 2));
  ctx.drawImage(img, sx, 0, srcSize, srcSize, 0, 0, size, size);

  try {
    const raw = ctx.getImageData(0, 0, size, size);
    const quantized = quantizeRgbaToZxPalette(raw.data, size, size);
    ctx.putImageData(new ImageData(new Uint8ClampedArray(quantized), size, size), 0, 0);
  } catch {
    // Keep drawn canvas if tainted
  }

  return off;
}
