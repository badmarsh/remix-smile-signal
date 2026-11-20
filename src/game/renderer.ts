/**
 * Authentic Didaktik M (Angstrem T34VG1 256x192 1:1 square pixel) Canvas2D Renderer.
 * Renders the 256x192 active display framed by a 12px ZX Spectrum border (280x216 logical).
 *
 * Includes:
 *  - Faithful pixel-art Zúbok (red scarf & sneakers), Signálik (cyan visor ^ ^ & Wi-Fi arcs)
 *    and Golden-Star 1st Place MVP Plaque
 *  - Rotating Elite-inspired 3D vector wireframe emblem in the starry Rimavská Sobota night sky
 *  - Knight Lore / Boovie stone bevel walls & Atomix molecular/optical conduits
 *  - Bubble Bobble cyan signal-bubble traps, Saboteur dash afterimages & Belegost chronicle ticker
 */

import { CITIZEN_SIGNATURES } from '../data/signatures';
import { ZX_BORDER_COLORS, ZX_PALETTE } from '../didaktik/specs';
import { getCitizensForStage } from './citizens';
import { evaluateCbctBeamSegment, evaluateUvBeamState } from './engine';
import { GRID_COLS, GRID_ROWS, SCREEN_H, SCREEN_W, TILE_SIZE } from './levels';
import {
  drawPixelSprite,
  SPRITE_BOSS_RUSIC,
  SPRITE_CARIES_TARGET,
  SPRITE_CITIZEN,
  SPRITE_COIL_PICKUP,
  SPRITE_CROWN_PICKUP,
  SPRITE_ENEMY_CHARGER,
  SPRITE_ENEMY_KITER,
  SPRITE_ENEMY_PATROLLER,
  SPRITE_FIBER_LINKED,
  SPRITE_FIBER_UNLINKED,
  SPRITE_GIFT_PICKUP,
  SPRITE_MVP_PLAQUE,
  SPRITE_ORNAMENT_LIT,
  SPRITE_ORNAMENT_UNLIT,
  SPRITE_RELIC_ARTIFACT,
  SPRITE_SIGNALIK_A,
  SPRITE_SIGNALIK_B,
  SPRITE_TOOTH_RESTORED,
  SPRITE_XMAS_TREE,
  SPRITE_ZUBOK_A,
  SPRITE_ZUBOK_B,
} from './sprites';
import { ActiveHero, GameWorld } from './types';

export const BORDER_PX = 12;
export const LOGICAL_W = SCREEN_W + BORDER_PX * 2; // 280
export const LOGICAL_H = SCREEN_H + BORDER_PX * 2; // 216

function getHeroSprite(hero: ActiveHero, frame: number) {
  if (hero === 'zubok') {
    return frame % 2 === 0 ? SPRITE_ZUBOK_A : SPRITE_ZUBOK_B;
  }
  return frame % 2 === 0 ? SPRITE_SIGNALIK_A : SPRITE_SIGNALIK_B;
}

/**
 * Crisp 14x16 pixel-art Coat of Arms of Rimavská Sobota
 * ("V striebornom štíte čierny orol v červenej zbroji").
 */
function drawPixelErbRS(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const x = Math.round(cx - 7);
  const y = Math.round(cy - 8);
  ctx.fillStyle = ZX_PALETTE.brightWhite;
  ctx.fillRect(x + 1, y, 12, 10);
  ctx.fillRect(x + 2, y + 10, 10, 2);
  ctx.fillRect(x + 3, y + 12, 8, 2);
  ctx.fillRect(x + 5, y + 14, 4, 1);
  ctx.fillRect(x + 6, y + 15, 2, 1);

  ctx.fillStyle = ZX_PALETTE.white;
  ctx.fillRect(x + 1, y, 12, 1);
  ctx.fillRect(x + 1, y, 1, 10);
  ctx.fillRect(x + 12, y, 1, 10);

  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(x + 6, y + 2, 2, 2);
  ctx.fillRect(x + 5, y + 4, 4, 6);
  ctx.fillRect(x + 2, y + 4, 3, 2);
  ctx.fillRect(x + 3, y + 6, 2, 2);
  ctx.fillRect(x + 9, y + 4, 3, 2);
  ctx.fillRect(x + 9, y + 6, 2, 2);
  ctx.fillRect(x + 5, y + 10, 4, 2);
  ctx.fillRect(x + 6, y + 12, 2, 2);

  ctx.fillStyle = ZX_PALETTE.brightRed;
  ctx.fillRect(x + 4, y + 3, 2, 1);
  ctx.fillRect(x + 3, y + 10, 2, 1);
  ctx.fillRect(x + 9, y + 10, 2, 1);
}

/**
 * Elite (1984) homage: subtle 3D rotating vector wireframe octahedron projected onto 2D pixels.
 */
function drawEliteWireframeStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  t: number
): void {
  const verts: [number, number, number][] = [
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, 1],
    [-1, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ];
  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [5, 1], [5, 2], [5, 3], [5, 4],
    [1, 2], [2, 3], [3, 4], [4, 1],
  ];

  const cosY = Math.cos(t * 0.85);
  const sinY = Math.sin(t * 0.85);
  const cosX = Math.cos(0.45);
  const sinX = Math.sin(0.45);

  const proj = verts.map(([x, y, z]) => {
    const rx = x * cosY - z * sinY;
    const rz = x * sinY + z * cosY;
    const ry = y * cosX - rz * sinX;
    const fz = y * sinX + rz * cosX;
    const persp = 2.6 / (2.6 - fz * 0.6);
    return [cx + rx * radius * persp, cy + ry * radius * persp] as [number, number];
  });

  ctx.save();
  ctx.strokeStyle = ZX_PALETTE.cyan;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [a, b] of edges) {
    ctx.moveTo(Math.round(proj[a][0]) + 0.5, Math.round(proj[a][1]) + 0.5);
    ctx.lineTo(Math.round(proj[b][0]) + 0.5, Math.round(proj[b][1]) + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Subtle low-contrast arena floor emblem so player sees microDENT, TeatrO,
 * Erb Rimavskej Soboty, Golden-Star MVP Plaque, and Rado's retro-pixel portrait
 * directly inside the game world without reducing gameplay readability.
 */
function drawArenaFloorIdentity(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  radoPortrait: HTMLCanvasElement | null
): void {
  const act = world.stage.act;
  ctx.save();

  if (act === 'microdent') {
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = ZX_PALETTE.brightCyan;
    ctx.lineWidth = 1;
    ctx.strokeRect(98.5, 81.5, 59, 29);
    ctx.fillStyle = ZX_PALETTE.brightCyan;
    ctx.font = 'bold 7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('microDENT', SCREEN_W / 2, 93);
    ctx.fillStyle = ZX_PALETTE.white;
    ctx.font = '5px "JetBrains Mono", monospace';
    ctx.fillText('HATVANIHO 2 · RS', SCREEN_W / 2, 102);
  } else if (act === 'teatro') {
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = ZX_PALETTE.brightYellow;
    ctx.lineWidth = 1;
    ctx.strokeRect(96.5, 81.5, 63, 29);
    ctx.fillStyle = ZX_PALETTE.brightYellow;
    ctx.font = 'bold 7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TeatrO.eu', SCREEN_W / 2, 93);
    ctx.fillStyle = ZX_PALETTE.brightCyan;
    ctx.font = '5px "JetBrains Mono", monospace';
    ctx.fillText('OPTIKA & IPTV RS', SCREEN_W / 2, 102);
  } else {
    // Act 3 (Gemersko-malohontské múzeum & Hlavné námestie): Erb RS + Rado pixel portrait + Golden-Star MVP Plaque
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = ZX_PALETTE.black;
    ctx.fillRect(92, 74, 72, 42);
    ctx.strokeStyle = ZX_PALETTE.brightYellow;
    ctx.lineWidth = 1;
    ctx.strokeRect(92.5, 74.5, 71, 41);

    drawPixelErbRS(ctx, 106, 94);
    if (radoPortrait) {
      ctx.globalAlpha = 0.72;
      ctx.drawImage(radoPortrait, 118, 82, 20, 20);
      ctx.strokeStyle = ZX_PALETTE.brightCyan;
      ctx.strokeRect(117.5, 81.5, 21, 21);
    }
    ctx.globalAlpha = 0.75;
    drawPixelSprite(ctx, SPRITE_MVP_PLAQUE, 151, 93);
    ctx.fillStyle = ZX_PALETTE.brightYellow;
    ctx.font = '6px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RADO · MVP #1', SCREEN_W / 2, 112);
  }

  ctx.restore();
}

function renderTitleAttractScene(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  radoPortrait: HTMLCanvasElement | null
): void {
  const t = world.attractTime;

  // Deep starry winter night sky in strict ZX_PALETTE
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Subtle Elite-style rotating wireframe vector beacons in left & right upper corners
  drawEliteWireframeStar(ctx, 28, 30, 13, t);
  drawEliteWireframeStar(ctx, SCREEN_W - 28, 30, 13, -t * 0.9);

  // Twinkling 1px ZX Spectrum stars
  for (let i = 0; i < 26; i++) {
    const sx = (i * 47 + 13) % SCREEN_W;
    const sy = (i * 19 + 7) % 110;
    const twinkle = Math.sin(t * 2.4 + i * 1.3) > 0.25;
    ctx.fillStyle = twinkle
      ? i % 3 === 0
        ? ZX_PALETTE.brightCyan
        : ZX_PALETTE.brightWhite
      : ZX_PALETTE.blue;
    ctx.fillRect(sx, sy, 1, 1);
  }

  // Snowy Rimavská Sobota horizon hills & River Rimava gleam (strict ZX_PALETTE)
  ctx.fillStyle = ZX_PALETTE.blue;
  ctx.fillRect(0, 148, SCREEN_W, 44);
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(0, 162, SCREEN_W, 30);
  ctx.fillStyle = ZX_PALETTE.white;
  ctx.fillRect(0, 160, SCREEN_W, 2);

  // Left: microDENT Clinic (Hatvaniho 2) silhouette with cyan lit windows
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(10, 134, 56, 26);
  ctx.fillStyle = ZX_PALETTE.brightCyan;
  ctx.fillRect(10, 133, 56, 2);
  for (let w = 0; w < 4; w++) {
    ctx.fillStyle = (Math.floor(t * 2) + w) % 4 === 0 ? ZX_PALETTE.brightWhite : ZX_PALETTE.brightCyan;
    ctx.fillRect(16 + w * 12, 141, 7, 7);
  }
  drawPixelSprite(ctx, SPRITE_TOOTH_RESTORED, 38, 122);

  // Center: Rimavská Sobota Hlavné námestie Pedestal + Erb RS + Rado Pixel Portrait + Golden-Star MVP Plaque
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(92, 134, 72, 26);
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.fillRect(92, 133, 72, 2);
  drawPixelErbRS(ctx, 106, 147);
  if (radoPortrait) {
    ctx.drawImage(radoPortrait, 118, 137, 20, 20);
    ctx.strokeStyle = ZX_PALETTE.brightYellow;
    ctx.lineWidth = 1;
    ctx.strokeRect(117.5, 136.5, 21, 21);
  } else {
    drawPixelSprite(ctx, SPRITE_XMAS_TREE, 128, 148);
  }
  drawPixelSprite(ctx, SPRITE_MVP_PLAQUE, 151, 147 + Math.round(Math.sin(t * 3) * 1));

  // Right: TeatrO Optical Broadcast Tower + Animated Signal Arcs
  ctx.fillStyle = ZX_PALETTE.red;
  ctx.fillRect(194, 138, 50, 22);
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.fillRect(194, 137, 50, 2);
  ctx.fillStyle = ZX_PALETTE.white;
  ctx.fillRect(218, 110, 2, 28);
  ctx.fillRect(214, 122, 10, 1);
  ctx.fillRect(212, 130, 14, 1);
  for (let r = 0; r < 3; r++) {
    const phase = (t * 1.1 + r * 0.33) % 1;
    const radius = Math.floor(4 + phase * 18);
    ctx.strokeStyle = r % 2 === 0 ? ZX_PALETTE.brightRed : ZX_PALETTE.brightYellow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(219, 111, radius, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();
  }
  drawPixelSprite(ctx, SPRITE_FIBER_LINKED, 219, 150);

  // Animated optical fiber conduit connecting microDENT <-> Rimavská Sobota MVP <-> TeatrO
  const beamX = Math.floor((t * 48) % 180);
  ctx.fillStyle = ZX_PALETTE.blue;
  ctx.fillRect(38, 178, 180, 2);
  ctx.fillStyle = ZX_PALETTE.brightCyan;
  ctx.fillRect(38 + beamX, 178, 14, 2);
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.fillRect(38 + ((beamX + 90) % 180), 178, 10, 2);

  // Faithful Zúbok (red scarf!) & Signálik (cyan Wi-Fi robot!) strolling on snowy Hlavné námestie
  const stride = Math.floor(t * 5) % 2;
  const hero1X = 66 + Math.sin(t * 0.9) * 16;
  const hero2X = 190 + Math.cos(t * 0.9) * 16;
  drawPixelSprite(ctx, getHeroSprite('zubok', stride), hero1X, 169, {
    flipX: Math.cos(t * 0.9) < 0,
  });
  drawPixelSprite(ctx, getHeroSprite('signalik', stride), hero2X, 169, {
    flipX: -Math.sin(t * 0.9) < 0,
  });

  // Drifting ZX snowflakes
  for (const flake of world.snowflakes) {
    const flakeX = Math.round(flake.x + Math.sin(flake.phase * 2.3) * 2);
    const flakeSize = Math.max(1, Math.round(flake.size));
    ctx.fillStyle = flake.size > 1.5 ? ZX_PALETTE.brightWhite : ZX_PALETTE.brightCyan;
    ctx.fillRect(flakeX, Math.round(flake.y), flakeSize, flakeSize);
  }
}

function renderHandoverCutscene(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  radoPortrait: HTMLCanvasElement | null
): void {
  const h = world.handover;
  if (!h) return;

  // Starry Rimavská Sobota ceremony backdrop (strict ZX_PALETTE)
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Festive top banner
  ctx.fillStyle = ZX_PALETTE.blue;
  ctx.fillRect(0, 0, SCREEN_W, 18);
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.fillRect(0, 18, SCREEN_W, 1);
  ctx.font = 'bold 7px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('1. MIESTO · CELOŽIVOTNÝ MVP REGIÓNU RS', SCREEN_W / 2, 12);

  // Golden Podium in center
  ctx.fillStyle = ZX_PALETTE.yellow;
  ctx.fillRect(80, 90, 96, 14);
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.fillRect(80, 90, 96, 2);
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.font = 'bold 6px "JetBrains Mono", monospace';
  ctx.fillText('RADO CEGLÉDY · MVP #1', SCREEN_W / 2, 100);

  // Rado's pixel portrait grows dramatically onto the podium
  const pSize = Math.max(8, Math.round(44 * h.portraitScale));
  const px = Math.round(SCREEN_W / 2 - pSize / 2);
  const py = Math.round(88 - pSize);
  ctx.fillStyle = ZX_PALETTE.brightYellow;
  ctx.fillRect(px - 2, py - 2, pSize + 4, pSize + 4);
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(px - 1, py - 1, pSize + 2, pSize + 2);
  if (radoPortrait) {
    ctx.drawImage(radoPortrait, px, py, pSize, pSize);
  } else {
    drawPixelSprite(ctx, SPRITE_MVP_PLAQUE, SCREEN_W / 2, py + pSize / 2);
  }

  // Flanking Zúbok, Signálik, Erb RS, and Golden-Star MVP Plaque on stage
  const cheerBob = Math.floor(h.timer * 5) % 2 === 0 ? -1 : 0;
  drawPixelErbRS(ctx, 44, 62);
  drawPixelSprite(ctx, SPRITE_ZUBOK_A, 64, 82 + cheerBob);
  drawPixelSprite(ctx, SPRITE_SIGNALIK_A, 192, 82 - cheerBob);
  drawPixelSprite(ctx, SPRITE_MVP_PLAQUE, 214, 64 + cheerBob);

  // Typewriter dedication text box + scrolling Kniha podpisov credits (strict ZX_PALETTE)
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(8, 110, SCREEN_W - 16, 58);
  ctx.strokeStyle = ZX_PALETTE.brightCyan;
  ctx.lineWidth = 1;
  ctx.strokeRect(8.5, 110.5, SCREEN_W - 17, 57);

  ctx.save();
  ctx.beginPath();
  ctx.rect(10, 112, SCREEN_W - 20, 54);
  ctx.clip();

  const dedicationDone = h.revealedChars >= h.fullText.length;
  const scrollY = dedicationDone && h.creditsOffsetY > 18 ? h.creditsOffsetY - 18 : 0;

  const visibleText = h.fullText.slice(0, h.revealedChars);
  const lines = visibleText.split('\n');
  ctx.font = '6px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  lines.forEach((line, idx) => {
    ctx.fillStyle = idx === 2 ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightWhite;
    ctx.fillText(line, SCREEN_W / 2, Math.round(123 + idx * 10 - scrollY));
  });

  if (dedicationDone) {
    const creditsStartY = 123 + lines.length * 10 + 12;
    ctx.fillStyle = ZX_PALETTE.brightCyan;
    ctx.font = 'bold 6px "JetBrains Mono", monospace';
    ctx.fillText('— KNIHA PODPISOV OBČANOV RS —', SCREEN_W / 2, Math.round(creditsStartY - scrollY));
    ctx.font = '6px "JetBrains Mono", monospace';
    CITIZEN_SIGNATURES.forEach((sig, sIdx) => {
      const yPos = Math.round(creditsStartY + 11 + sIdx * 9 - scrollY);
      if (yPos > 106 && yPos < 176) {
        ctx.fillStyle = sIdx % 2 === 0 ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightWhite;
        ctx.fillText(sig, SCREEN_W / 2, yPos);
      }
    });
  }
  ctx.restore();

  // Blinking ENTER prompt at bottom
  const blink = Math.floor(h.timer * 3) % 2 === 0;
  ctx.fillStyle = blink ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightCyan;
  ctx.font = 'bold 6px "JetBrains Mono", monospace';
  ctx.fillText('STLAČ ENTER PRE ODOVZDANIE PLAKETY', SCREEN_W / 2, 183);

  // Falling ZX confetti
  for (const c of h.confetti) {
    ctx.fillStyle = c.color;
    ctx.fillRect(Math.round(c.x), Math.round(c.y), c.size, c.size);
  }
}

export function renderDidaktikFrame(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  crtEnabled: boolean,
  radoPortrait: HTMLCanvasElement | null = null
): void {
  ctx.imageSmoothingEnabled = false;

  const baseBorder =
    world.phase === 'title'
      ? ZX_PALETTE.black
      : world.phase === 'handover'
        ? ZX_PALETTE.blue
        : ZX_BORDER_COLORS[world.stage.borderColorIdx % ZX_BORDER_COLORS.length];
  ctx.fillStyle = world.borderFlashColor ?? baseBorder;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  ctx.save();
  ctx.translate(BORDER_PX, BORDER_PX);

  if (world.trauma > 0.01 && world.phase !== 'title' && world.phase !== 'handover') {
    const shake = world.trauma * world.trauma * 4.5;
    const ox = Math.round(Math.sin(world.elapsedSec * 71) * shake);
    const oy = Math.round(Math.cos(world.elapsedSec * 83) * shake);
    ctx.translate(ox, oy);
  }

  ctx.beginPath();
  ctx.rect(0, 0, SCREEN_W, SCREEN_H);
  ctx.clip();

  if (world.phase === 'title') {
    renderTitleAttractScene(ctx, world, radoPortrait);
  } else if (world.phase === 'handover') {
    renderHandoverCutscene(ctx, world, radoPortrait);
  } else {
    renderGameplayScene(ctx, world, radoPortrait);
  }

  ctx.restore();

  if (crtEnabled) {
    ctx.fillStyle = ZX_PALETTE.black;
    ctx.globalAlpha = 0.16;
    for (let y = 0; y < LOGICAL_H; y += 2) {
      ctx.fillRect(0, y, LOGICAL_W, 1);
    }
    ctx.globalAlpha = 1;
  }
}

function renderGameplayScene(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  radoPortrait: HTMLCanvasElement | null
): void {
  const stage = world.stage;

  // Black PAPER 0 background
  ctx.fillStyle = ZX_PALETTE.black;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Knight Lore / Boovie beveled 8x8 stone/tech walls, Rimava water ('~'), locked doors ('D'), & floor markers
  const waveShift = Math.floor(world.elapsedSec * 4) % 4;
  for (let r = 0; r < GRID_ROWS; r++) {
    const rowStr = stage.grid[r];
    const rowHasWater = rowStr.includes('~');
    for (let c = 0; c < GRID_COLS; c++) {
      const px = c * TILE_SIZE;
      const py = r * TILE_SIZE;
      const ch = rowStr[c];
      if (ch === '#') {
        ctx.fillStyle = stage.wallColor;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = stage.wallAccent;
        ctx.fillRect(px, py, TILE_SIZE, 1);
        ctx.fillRect(px, py, 1, TILE_SIZE);
        ctx.fillStyle = ZX_PALETTE.black;
        ctx.fillRect(px, py + TILE_SIZE - 1, TILE_SIZE, 1);
        ctx.fillRect(px + TILE_SIZE - 1, py, 1, TILE_SIZE);
        ctx.fillStyle = ZX_PALETTE.black;
        ctx.fillRect(px + 2, py + 3, 4, 1);
      } else if (ch === '~') {
        // Rimava river water (slows player to 50% speed)
        ctx.fillStyle = ZX_PALETTE.blue;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = ZX_PALETTE.brightCyan;
        const wx = (waveShift + (r % 2) * 2) % 4;
        ctx.fillRect(px + wx, py + 2, 3, 1);
        ctx.fillRect(px + ((wx + 3) % 5), py + 6, 3, 1);
      } else if (ch === 'D' && !world.doorsOpen) {
        // Locked Gemersko-malohontské múzeum vault door (unlocked by Kronika 1270)
        ctx.fillStyle = ZX_PALETTE.red;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = ZX_PALETTE.brightYellow;
        ctx.fillRect(px, py, TILE_SIZE, 1);
        ctx.fillRect(px, py + TILE_SIZE - 1, TILE_SIZE, 1);
        ctx.fillRect(px + 2, py + 1, 1, TILE_SIZE - 2);
        ctx.fillRect(px + 5, py + 1, 1, TILE_SIZE - 2);
        ctx.fillStyle = ZX_PALETTE.brightWhite;
        ctx.fillRect(px + 3, py + 3, 2, 2);
      } else if (ch === 'D' && world.doorsOpen) {
        // Unlocked vault threshold
        ctx.fillStyle = ZX_PALETTE.yellow;
        ctx.fillRect(px, py + 3, TILE_SIZE, 1);
        ctx.fillRect(px, py + 5, TILE_SIZE, 1);
      } else if (rowHasWater && (rowStr[c - 1] === '~' || rowStr[c + 1] === '~' || (c >= 14 && c <= 17))) {
        // Rimava dry cycle bridge planks across the river
        ctx.fillStyle = ZX_PALETTE.yellow;
        ctx.fillRect(px, py + 1, TILE_SIZE, 1);
        ctx.fillRect(px, py + 5, TILE_SIZE, 1);
        ctx.fillStyle = ZX_PALETTE.white;
        ctx.fillRect(px + 3, py + 3, 2, 1);
      } else {
        ctx.fillStyle = stage.floorDotColor;
        ctx.fillRect(px + 3, py + 3, 1, 1);
      }
    }
  }

  // Arena identity mosaic (microDENT / TeatrO / Erb RS + Rado pixel portrait + MVP plaque)
  drawArenaFloorIdentity(ctx, world, radoPortrait);

  // Stage 6 Podium Tile (glows brightly once plaque is carried!)
  if (world.podiumPos) {
    const px = Math.round(world.podiumPos.x);
    const py = Math.round(world.podiumPos.y);
    const pulse = Math.floor(world.elapsedSec * 6) % 2 === 0;
    ctx.fillStyle = world.plaqueCarried ? ZX_PALETTE.yellow : ZX_PALETTE.blue;
    ctx.fillRect(px - 10, py - 6, 20, 12);
    ctx.strokeStyle =
      world.plaqueCarried && pulse ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightCyan;
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 10.5, py - 6.5, 21, 13);
    ctx.fillStyle = world.plaqueCarried ? ZX_PALETTE.black : ZX_PALETTE.brightWhite;
    ctx.font = 'bold 5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PÓDIUM', px, py + 2);
  }

  // Atomix-style glowing molecular / fiber lattice links connecting restored objectives
  const restoredTargets = world.targets.filter((t) => t.restored);
  if (restoredTargets.length >= 2) {
    ctx.strokeStyle =
      stage.act === 'microdent'
        ? ZX_PALETTE.cyan
        : stage.act === 'teatro'
          ? ZX_PALETTE.yellow
          : ZX_PALETTE.green;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < restoredTargets.length - 1; i++) {
      ctx.moveTo(Math.round(restoredTargets[i].x), Math.round(restoredTargets[i].y));
      ctx.lineTo(Math.round(restoredTargets[i + 1].x), Math.round(restoredTargets[i + 1].y));
    }
    ctx.stroke();
  }

  // Draw Dizzy / Towdie Stage Relic (on Stage 6, only visible once Boss F4 drops it!)
  const relic = world.stageRelic;
  const relicVisible = !relic.collected && (!world.boss || world.boss.phase === 4);
  if (relicVisible) {
    const rbob = Math.round(Math.sin(relic.bobPhase) * 1.5);
    const auraR = 8 + Math.round(Math.sin(relic.bobPhase * 1.6));
    ctx.strokeStyle = ZX_PALETTE.brightYellow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(Math.round(relic.x), Math.round(relic.y + rbob), auraR, 0, Math.PI * 2);
    ctx.stroke();
    drawPixelSprite(
      ctx,
      relic.kind === 'plaque' ? SPRITE_MVP_PLAQUE : SPRITE_RELIC_ARTIFACT,
      relic.x,
      relic.y + rbob
    );
  }

  // Stage environmental hazards: Stage 1 UV beams & Stage 2 rotating CBCT beam (strict ZX_PALETTE)
  if (stage.hazards && stage.hazards.length > 0) {
    for (const hz of stage.hazards) {
      if (hz.kind === 'uv_beam') {
        const uvState = evaluateUvBeamState(hz, world.elapsedSec);
        // Emitter pylons
        ctx.fillStyle = ZX_PALETTE.white;
        ctx.fillRect(Math.round(hz.x1) - 3, Math.round(hz.y1) - 3, 6, 6);
        ctx.fillRect(Math.round(hz.x2) - 3, Math.round(hz.y2) - 3, 6, 6);
        ctx.fillStyle =
          uvState === 'on'
            ? ZX_PALETTE.brightMagenta
            : uvState === 'telegraph'
              ? ZX_PALETTE.brightYellow
              : ZX_PALETTE.cyan;
        ctx.fillRect(Math.round(hz.x1) - 1, Math.round(hz.y1) - 1, 2, 2);
        ctx.fillRect(Math.round(hz.x2) - 1, Math.round(hz.y2) - 1, 2, 2);

        if (uvState === 'telegraph') {
          if (Math.floor(world.elapsedSec * 14) % 2 === 0) {
            ctx.strokeStyle = ZX_PALETTE.brightYellow;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(Math.round(hz.x1) + 0.5, Math.round(hz.y1));
            ctx.lineTo(Math.round(hz.x2) + 0.5, Math.round(hz.y2));
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else if (uvState === 'on') {
          ctx.strokeStyle = ZX_PALETTE.brightMagenta;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(Math.round(hz.x1) + 0.5, Math.round(hz.y1));
          ctx.lineTo(Math.round(hz.x2) + 0.5, Math.round(hz.y2));
          ctx.stroke();
          ctx.strokeStyle = ZX_PALETTE.brightWhite;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(Math.round(hz.x1) + 0.5, Math.round(hz.y1));
          ctx.lineTo(Math.round(hz.x2) + 0.5, Math.round(hz.y2));
          ctx.stroke();
        }
      } else if (hz.kind === 'cbct_beam') {
        const seg = evaluateCbctBeamSegment(hz, world.elapsedSec);
        ctx.strokeStyle = ZX_PALETTE.brightGreen;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.round(seg.x1), Math.round(seg.y1));
        ctx.lineTo(Math.round(seg.x2), Math.round(seg.y2));
        ctx.stroke();
        ctx.strokeStyle = ZX_PALETTE.brightYellow;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(seg.x1), Math.round(seg.y1));
        ctx.lineTo(Math.round(seg.x2), Math.round(seg.y2));
        ctx.stroke();
        // Central CBCT scanner emitter hub
        ctx.fillStyle = ZX_PALETTE.blue;
        ctx.fillRect(Math.round(hz.cx) - 4, Math.round(hz.cy) - 4, 8, 8);
        ctx.fillStyle = ZX_PALETTE.brightYellow;
        ctx.fillRect(Math.round(hz.cx) - 2, Math.round(hz.cy) - 2, 4, 4);
      }
    }
  }

  // Draw Objective Targets
  const nextExpectedOrder = stage.orderedTargets
    ? world.targets.reduce((acc, item) => acc + (item.restored ? 1 : 0), 0) + 1
    : 0;
  for (const t of world.targets) {
    const bob = !t.restored ? Math.round(Math.sin(t.pulsePhase) * 1) : 0;
    const scaleBoost = t.restoreAnim > 0 ? 1 + t.restoreAnim * 0.7 : 1;
    const isNextOrdered = Boolean(t.orderIndex && !t.restored && t.orderIndex === nextExpectedOrder);

    if (!t.restored) {
      const ringR = (isNextOrdered ? 7 : 6) + Math.round(Math.sin(t.pulsePhase * 1.5));
      ctx.strokeStyle = isNextOrdered
        ? ZX_PALETTE.brightYellow
        : t.kind === 'caries'
          ? ZX_PALETTE.brightMagenta
          : t.kind === 'fiber'
            ? ZX_PALETTE.brightRed
            : ZX_PALETTE.brightYellow;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(t.x), Math.round(t.y), ringR, 0, Math.PI * 2);
      ctx.stroke();
    }

    const sprite =
      t.kind === 'caries'
        ? t.restored
          ? SPRITE_TOOTH_RESTORED
          : SPRITE_CARIES_TARGET
        : t.kind === 'fiber'
          ? t.restored
            ? SPRITE_FIBER_LINKED
            : SPRITE_FIBER_UNLINKED
          : t.restored
            ? SPRITE_ORNAMENT_LIT
            : SPRITE_ORNAMENT_UNLIT;

    drawPixelSprite(ctx, sprite, t.x, t.y + bob, {
      scaleX: scaleBoost,
      scaleY: scaleBoost,
    });

    if (t.orderIndex !== undefined) {
      ctx.fillStyle = ZX_PALETTE.black;
      ctx.fillRect(Math.round(t.x) - 4, Math.round(t.y) - 13, 8, 7);
      ctx.fillStyle = t.restored
        ? ZX_PALETTE.brightGreen
        : isNextOrdered
          ? ZX_PALETTE.brightYellow
          : ZX_PALETTE.brightWhite;
      ctx.font = 'bold 6px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(t.orderIndex), Math.round(t.x), Math.round(t.y) - 7);
    }
  }

  // Draw Bonus Pickups
  for (const pk of world.pickups) {
    if (pk.collected) continue;
    const bob = Math.round(Math.sin(pk.bobPhase) * 1.5);
    const sprite =
      pk.kind === 'crown'
        ? SPRITE_CROWN_PICKUP
        : pk.kind === 'coil'
          ? SPRITE_COIL_PICKUP
          : SPRITE_GIFT_PICKUP;
    drawPixelSprite(ctx, sprite, pk.x, pk.y + bob);
  }

  // Draw Saboteur Dash Afterimages
  for (const img of world.afterimages) {
    if (!img.active) continue;
    const alpha = Math.max(0, (img.life / img.maxLife) * 0.55);
    drawPixelSprite(ctx, getHeroSprite(img.hero, 0), img.x, img.y, {
      overrideColor: img.hero === 'zubok' ? ZX_PALETTE.brightRed : ZX_PALETTE.brightCyan,
      flipX: img.flipX,
      alpha,
    });
  }

  // Draw Enemies (with visible windup telegraphs, Bubble Bobble trap bubble & KO dissolve!)
  for (const enemy of world.enemies) {
    const sprite =
      enemy.archetype === 'patroller'
        ? SPRITE_ENEMY_PATROLLER
        : enemy.archetype === 'kiter'
          ? SPRITE_ENEMY_KITER
          : SPRITE_ENEMY_CHARGER;

    if (enemy.state === 'ko') {
      const ratio = Math.max(0, enemy.koTimer / 0.32);
      drawPixelSprite(ctx, sprite, enemy.x, enemy.y - (1 - ratio) * 5, {
        overrideColor: ZX_PALETTE.brightWhite,
        scaleX: 1 + (1 - ratio) * 0.5,
        scaleY: Math.max(0.2, ratio),
        alpha: ratio,
      });
      continue;
    }

    if (enemy.state === 'telegraph') {
      const blink = Math.floor(enemy.stateTimer * 20) % 2 === 0;
      ctx.strokeStyle = blink ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightRed;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(enemy.x), Math.round(enemy.y), 8, 0, Math.PI * 2);
      ctx.stroke();

      if (enemy.archetype === 'charger') {
        ctx.strokeStyle = blink ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightRed;
        ctx.beginPath();
        ctx.moveTo(Math.round(enemy.x), Math.round(enemy.y));
        ctx.lineTo(
          Math.round(enemy.x + enemy.chargeDirX * 42),
          Math.round(enemy.y + enemy.chargeDirY * 42)
        );
        ctx.stroke();
      }
    }

    drawPixelSprite(ctx, sprite, enemy.x, enemy.y, {
      overrideColor:
        enemy.hitFlash > 0
          ? ZX_PALETTE.brightWhite
          : enemy.state === 'telegraph' && Math.floor(enemy.stateTimer * 18) % 2 === 0
            ? ZX_PALETTE.brightYellow
            : undefined,
      flipX: enemy.facing === 'left',
      scaleX: enemy.state === 'bubbled' ? 0.86 : 1,
      scaleY: enemy.state === 'bubbled' ? 0.86 : 1,
    });

    // Bubble Bobble shimmering cyan Wi-Fi bubble encasing trapped enemy!
    if (enemy.state === 'bubbled') {
      const blink = enemy.bubbleTimer < 0.65 && Math.floor(enemy.bubbleTimer * 16) % 2 === 0;
      ctx.strokeStyle = blink ? ZX_PALETTE.brightWhite : ZX_PALETTE.brightCyan;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(enemy.x), Math.round(enemy.y), 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ZX_PALETTE.brightWhite;
      ctx.fillRect(Math.round(enemy.x - 3), Math.round(enemy.y - 3), 2, 1);
    }
  }

  // Draw Stage 6 Boss "Veľký Rušič"
  if (world.boss && world.boss.active && world.boss.phase < 4) {
    const boss = world.boss;
    const bx = Math.round(boss.x);
    const by = Math.round(boss.y);

    // Visible Attack Telegraph
    if (boss.state === 'telegraph') {
      const blink = Math.floor(boss.stateTimer * 20) % 2 === 0;
      ctx.strokeStyle = blink ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightRed;
      ctx.lineWidth = 1;
      if (boss.attackKind === 'line_charge') {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(
          Math.round(bx + boss.chargeDirX * 56),
          Math.round(by + boss.chargeDirY * 56)
        );
        ctx.stroke();
      } else if (boss.attackKind === 'radial_spread') {
        for (let i = 0; i < 8; i++) {
          const ang = boss.attackAngle + (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(Math.round(bx + Math.cos(ang) * 18), Math.round(by + Math.sin(ang) * 18));
          ctx.stroke();
        }
      } else if (boss.attackKind === 'summon_patrollers') {
        ctx.strokeStyle = blink ? ZX_PALETTE.brightGreen : ZX_PALETTE.brightYellow;
        ctx.strokeRect(bx - 16, by - 14, 32, 28);
      }
    }

    drawPixelSprite(ctx, SPRITE_BOSS_RUSIC, bx, by, {
      overrideColor:
        boss.hitFlash > 0
          ? ZX_PALETTE.brightWhite
          : boss.state === 'telegraph' && Math.floor(boss.stateTimer * 18) % 2 === 0
            ? ZX_PALETTE.brightYellow
            : undefined,
    });

    // F1 Shield
    if (boss.phase === 1) {
      ctx.strokeStyle =
        Math.floor(world.elapsedSec * 8) % 2 === 0 ? ZX_PALETTE.brightCyan : ZX_PALETTE.cyan;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // F2 Caries Weak Spots (Zúbok laser only)
    if (boss.phase === 2) {
      for (const ws of boss.weakSpots) {
        if (ws.destroyed) continue;
        const wx = Math.round(bx + ws.offsetX);
        const wy = Math.round(by + ws.offsetY);
        ctx.fillStyle = ws.hitFlash > 0 ? ZX_PALETTE.brightWhite : ZX_PALETTE.brightMagenta;
        ctx.fillRect(wx - 3, wy - 3, 6, 6);
        ctx.fillStyle = ZX_PALETTE.brightRed;
        ctx.fillRect(wx - 1, wy - 1, 2, 2);
      }
    }

    // F3 Bubble Trap
    if (boss.phase === 3 && boss.state === 'bubbled') {
      const blink = boss.bubbleTimer < 0.7 && Math.floor(boss.bubbleTimer * 16) % 2 === 0;
      ctx.strokeStyle = blink ? ZX_PALETTE.brightWhite : ZX_PALETTE.brightCyan;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ZX_PALETTE.brightWhite;
      ctx.fillRect(bx - 6, by - 8, 3, 2);
    }

    // Compact Boss Status Bar at top inside 256x192 screen
    ctx.fillStyle = ZX_PALETTE.black;
    ctx.fillRect(46, 1, 164, 7);
    ctx.fillStyle = ZX_PALETTE.brightRed;
    const phaseLabel =
      boss.phase === 1
        ? 'VEĽKÝ RUŠIČ · F1 ŠTÍT'
        : boss.phase === 2
          ? `VEĽKÝ RUŠIČ · F2 KAZY ${boss.weakSpots.filter((w) => !w.destroyed).length}/3`
          : `VEĽKÝ RUŠIČ · F3 BUBLINA ${boss.hp}/${boss.maxHp}`;
    ctx.font = 'bold 5.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = ZX_PALETTE.brightYellow;
    ctx.fillText(phaseLabel, SCREEN_W / 2, 6.5);
  }

  // Draw Projectiles
  for (const proj of world.projectiles) {
    ctx.fillStyle = proj.color;
    const isHoriz = Math.abs(proj.vx) >= Math.abs(proj.vy);
    if (proj.kind === 'dental_laser') {
      ctx.fillRect(
        Math.round(proj.x - (isHoriz ? 3 : 1)),
        Math.round(proj.y - (isHoriz ? 1 : 3)),
        isHoriz ? 6 : 2,
        isHoriz ? 2 : 6
      );
      ctx.fillStyle = ZX_PALETTE.brightWhite;
      ctx.fillRect(Math.round(proj.x), Math.round(proj.y), 1, 1);
    } else if (proj.kind === 'signal_wave') {
      ctx.fillRect(Math.round(proj.x - 2), Math.round(proj.y - 2), 4, 4);
      ctx.fillStyle = ZX_PALETTE.brightWhite;
      ctx.fillRect(Math.round(proj.x - 1), Math.round(proj.y - 1), 2, 2);
    } else {
      ctx.fillRect(Math.round(proj.x - 2), Math.round(proj.y - 2), 4, 4);
      ctx.fillStyle = ZX_PALETTE.brightYellow;
      ctx.fillRect(Math.round(proj.x - 1), Math.round(proj.y - 1), 2, 2);
    }
  }

  // Draw Companion Partner (inactive hero in 1P OR independent Player 2 Signálik in 2P Co-op!)
  const p = world.player;
  const partnerHero: ActiveHero = p.activeHero === 'zubok' ? 'signalik' : 'zubok';
  const partnerFrame = world.coopEnabled
    ? p.partnerAnimFrame
    : Math.floor(world.elapsedSec * 4) % 2;
  const partnerBob = world.coopEnabled
    ? p.partnerAnimFrame === 1
      ? -1
      : 0
    : Math.round(Math.sin(world.elapsedSec * 5) * 1);
  drawPixelSprite(
    ctx,
    getHeroSprite(partnerHero, partnerFrame),
    p.partnerX,
    p.partnerY + partnerBob,
    {
      scaleX: world.coopEnabled ? 1 : 0.78,
      scaleY: world.coopEnabled ? 1 : 0.78,
      flipX: p.partnerFacing === 'left',
    }
  );
  if (world.coopEnabled) {
    ctx.fillStyle = ZX_PALETTE.brightCyan;
    ctx.font = 'bold 5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('2P', Math.round(p.partnerX), Math.round(p.partnerY - 8));
  }

  // Draw Active Lead Hero (Zúbok with red scarf or Signálik with cyan visor!)
  const invulnBlink =
    world.damageTaken > 0 && p.invulnTimer > 0 && p.dashTimer <= 0 && Math.floor(p.invulnTimer * 16) % 2 === 0;
  if (!invulnBlink) {
    const heroSprite = getHeroSprite(p.activeHero, p.animFrame);
    const walkBob = p.animFrame === 1 ? -1 : 0;
    drawPixelSprite(ctx, heroSprite, p.x, p.y + walkBob, {
      overrideColor: p.hitFlash > 0 ? ZX_PALETTE.brightWhite : undefined,
      scaleX: p.squashX,
      scaleY: p.squashY,
      flipX: p.facing === 'left',
    });

    if (p.invulnTimer > 0 || p.dashTimer > 0) {
      ctx.strokeStyle = p.dashTimer > 0 ? ZX_PALETTE.brightYellow : ZX_PALETTE.brightCyan;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(p.x), Math.round(p.y), 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (world.coopEnabled) {
    ctx.fillStyle = ZX_PALETTE.brightYellow;
    ctx.font = 'bold 5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1P', Math.round(p.x), Math.round(p.y - 8));
  }

  // Carried MVP Plaque hovers directly above player on Stage 6
  if (world.plaqueCarried) {
    const bob = Math.round(Math.sin(world.elapsedSec * 6) * 1);
    drawPixelSprite(ctx, SPRITE_MVP_PLAQUE, p.x, p.y - 12 + bob, {
      scaleX: 0.8,
      scaleY: 0.8,
    });
  }

  // Draw Pooled Particles
  for (const pt of world.particles) {
    if (!pt.active) continue;
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
  }

  // Gentle falling snow overlay (strict ZX_PALETTE)
  // ZX palette tints by size + sinusoidal drift
  const SNOW_COLORS_GAME = [ZX_PALETTE.white, ZX_PALETTE.brightWhite, ZX_PALETTE.brightCyan];
  const flakeLimit = stage.act === 'gala' ? world.snowflakes.length : 12;
  for (let i = 0; i < flakeLimit; i++) {
    const f = world.snowflakes[i];
    ctx.fillStyle = SNOW_COLORS_GAME[f.size > 1 ? 1 : (i % 3)];
    const driftX = Math.round(f.x + Math.sin(f.driftPhase) * 1.8);
    ctx.fillRect(driftX, Math.round(f.y), f.size, f.size);
  }

  // Friendly Rimavská Sobota NPC Citizens (Dizzy/Towdie style, strict ZX_PALETTE)
  const stageCitizens = getCitizensForStage(world.stageIndex);
  for (const npc of stageCitizens) {
    const npcBob = Math.floor(world.elapsedSec * 2 + npc.x) % 2 === 0 ? 0 : -1;
    drawPixelSprite(ctx, SPRITE_CITIZEN, npc.x, npc.y + npcBob);
    // Tiny cyan/yellow speech pip above citizen head
    ctx.fillStyle =
      world.citizenSpeech.activeCitizenId === npc.id
        ? ZX_PALETTE.brightYellow
        : ZX_PALETTE.brightCyan;
    ctx.fillRect(Math.round(npc.x) - 1, Math.round(npc.y) - 9, 2, 2);
  }

  // Active 3.0s Citizen Speech Bubble (strict ZX_PALETTE, zero overlap with chronicle strip)
  if (world.citizenSpeech.timer > 0 && world.citizenSpeech.activeQuote && world.phase === 'playing') {
    const bubbleY = world.boss && world.boss.active && world.boss.phase < 4 ? 22 : 10;
    ctx.save();
    ctx.fillStyle = ZX_PALETTE.black;
    ctx.fillRect(10, bubbleY, SCREEN_W - 20, 18);
    ctx.strokeStyle = ZX_PALETTE.brightCyan;
    ctx.lineWidth = 1;
    ctx.strokeRect(10.5, bubbleY + 0.5, SCREEN_W - 21, 17);
    ctx.fillStyle = ZX_PALETTE.brightYellow;
    ctx.font = 'bold 5.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${world.citizenSpeech.activeName.toUpperCase()} (OBČAN RS):`, SCREEN_W / 2, bubbleY + 7);
    ctx.fillStyle = ZX_PALETTE.brightWhite;
    ctx.font = '5.5px "JetBrains Mono", monospace';
    ctx.fillText(world.citizenSpeech.activeQuote.slice(0, 56), SCREEN_W / 2, bubbleY + 14.5);
    ctx.restore();
  }

  // Belegost / Lords of Midnight 1-line Chronicle Banner inside bottom of 256x192 screen
  if (world.chronicleTimer > 0 && world.chronicleText && world.phase === 'playing') {
    ctx.save();
    ctx.fillStyle = ZX_PALETTE.black;
    ctx.fillRect(8, SCREEN_H - 18, SCREEN_W - 16, 11);
    ctx.strokeStyle = ZX_PALETTE.brightYellow;
    ctx.lineWidth = 1;
    ctx.strokeRect(8.5, SCREEN_H - 17.5, SCREEN_W - 17, 10);
    ctx.fillStyle = ZX_PALETTE.brightYellow;
    ctx.font = 'bold 5.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(world.chronicleText.slice(0, 56), SCREEN_W / 2, SCREEN_H - 10.5);
    ctx.restore();
  }

  // Stage Clear banner directly inside the 256x192 screen during brief transition
  if (world.phase === 'stage_clear') {
    ctx.fillStyle = ZX_PALETTE.black;
    ctx.fillRect(18, 72, 220, 48);
    ctx.strokeStyle = ZX_PALETTE.brightYellow;
    ctx.lineWidth = 1;
    ctx.strokeRect(18.5, 72.5, 219, 47);
    ctx.fillStyle = ZX_PALETTE.brightYellow;
    ctx.font = 'bold 12px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('KOLO SPLNENÉ!', SCREEN_W / 2, 92);
    ctx.fillStyle = ZX_PALETTE.brightCyan;
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.fillText(
      world.stageIndex + 1 < 6 ? 'PLAKETA MVP BLIŽŠIE K RADOVI...' : 'ODOVZDÁVAM PLAKETU RADOVI!',
      SCREEN_W / 2,
      108
    );
  }
}
