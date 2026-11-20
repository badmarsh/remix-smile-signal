/**
 * Authentic ZX Spectrum / Didaktik M pixel-art sprite bitmaps.
 * Zúbok (smiling white molar tooth with crimson red scarf & red-accented sneakers),
 * Signálik (retro robot buddy with dark visor, cyan ^ ^ smile & Wi-Fi antenna),
 * and the Golden-Star 1st Place MVP Plaque are crafted directly from the gift's pixel art.
 */

import { ZX_PALETTE } from '../didaktik/specs';

export type PixelPalette = Record<string, string>;

export interface PixelSprite {
  rows: string[];
  palette: PixelPalette;
}

/**
 * ZÚBOK — Frame A (Standing / Stride 1)
 * Crisp white tooth hero with black outline, happy eyes, crimson red scarf fluttering left,
 * dark charcoal limbs, and black-and-red sneakers.
 */
export const SPRITE_ZUBOK_A: PixelSprite = {
  rows: [
    '....KKK.KKK...',
    '...KWWWKWWWK..',
    '...KWWWWWWWK..',
    '...KWKWKWKWK..',
    '...KWWWRWWWK..',
    '.KKKRRRRRRRK..',
    'KRRRRRRRRRRWK.',
    '.KRRKWWWWWKWWK',
    '..KKKWWWWWK.KK',
    '....KWWKWWK...',
    '....KWWKWWK...',
    '...KDRK.KDRK..',
    '..KDDDK.KDDDK.',
    '..KKKKK.KKKKK.',
  ],
  palette: {
    K: ZX_PALETTE.black,
    W: ZX_PALETTE.brightWhite,
    R: ZX_PALETTE.brightRed,
    D: ZX_PALETTE.blue,
  },
};

/**
 * ZÚBOK — Frame B (Stride 2 / Scarf Flutter)
 */
export const SPRITE_ZUBOK_B: PixelSprite = {
  rows: [
    '....KKK.KKK...',
    '...KWWWKWWWK..',
    '...KWWWWWWWK..',
    '...KWKWKWKWK..',
    '...KWWWRWWWK..',
    'KKKKRRRRRRRK..',
    'KRRRRRRRRRRWK.',
    '.KRRKWWWWWKWWK',
    '...KKWWWWWK.KK',
    '....KWWKWWK...',
    '...KWWK.KWWK..',
    '..KDRK...KDRK.',
    '..KDDK...KDDK.',
    '..KKKK...KKKK.',
  ],
  palette: {
    K: ZX_PALETTE.black,
    W: ZX_PALETTE.brightWhite,
    R: ZX_PALETTE.brightRed,
    D: ZX_PALETTE.blue,
  },
};

/**
 * SIGNÁLIK — Frame A (Signal Antenna Wave 1)
 * Cute white/silver retro robot with dark visor, bright cyan ^ ^ happy eyes & smile,
 * glowing cyan antenna orb + Wi-Fi arcs, cyan chest LEDs, and silver boots.
 */
export const SPRITE_SIGNALIK_A: PixelSprite = {
  rows: [
    '......KCK..C..',
    '......KCK.C.C.',
    '.......K..C.C.',
    '...KKKKKKKK...',
    '..KWWWWWWWWK..',
    '.KWWKKKKKKWWK.',
    '.KCKKCKKCKKCK.',
    '.KWWKKCCKKWWK.',
    '..KWWWWWWWWK..',
    '..KWKWWWWKWK..',
    '.KWWKWCCWKWWK.',
    '..KKKWWWWKKK..',
    '...KWWKKWWK...',
    '..KSSSKKSSSK..',
  ],
  palette: {
    K: ZX_PALETTE.black,
    W: ZX_PALETTE.brightWhite,
    S: ZX_PALETTE.white,
    C: ZX_PALETTE.brightCyan,
  },
};

/**
 * SIGNÁLIK — Frame B (Signal Antenna Wave 2 / Hover Bob)
 */
export const SPRITE_SIGNALIK_B: PixelSprite = {
  rows: [
    '......KCK.C...',
    '......KCK..C..',
    '.......K..C.C.',
    '...KKKKKKKK...',
    '..KWWWWWWWWK..',
    '.KWWKKKKKKWWK.',
    '.KCKKCKKCKKCK.',
    '.KWWKKCCKKWWK.',
    '..KWWWWWWWWK..',
    '.KWWKWWWWKWWK.',
    '..KKKWCCWKKK..',
    '....KWWWWK....',
    '..KWWK..KWWK..',
    '.KSSSK..KSSSK.',
  ],
  palette: {
    K: ZX_PALETTE.black,
    W: ZX_PALETTE.brightWhite,
    S: ZX_PALETTE.white,
    C: ZX_PALETTE.brightCyan,
  },
};

/**
 * GOLDEN-STAR 1ST PLACE MVP PLAQUE (12x14)
 * Brushed silver plate framed in burnished gold with 4 corner rivets,
 * central golden 5-pointed star, and dark-gold stepped pedestal.
 */
export const SPRITE_MVP_PLAQUE: PixelSprite = {
  rows: [
    '..KKKKKKKK..',
    '.KYYYYYYYYK.',
    '.KYKSSSSKYK.',
    '.KYSYSSYSYK.',
    '.KYSSYYSYYK.',
    '.KYSYYYYYSK.',
    '.KYSSYYSSYK.',
    '.KYSYSYSYSK.',
    '.KYSSSSSSYK.',
    '.KYKSSSSKYK.',
    '.KYYYYYYYYK.',
    '.KKKKKKKKKK.',
    'KDDYYYYYYDDK',
    'KKKKKKKKKKKK',
  ],
  palette: {
    K: ZX_PALETTE.black,
    Y: ZX_PALETTE.brightYellow,
    S: ZX_PALETTE.white,
    D: ZX_PALETTE.yellow,
  },
};

/**
 * Dizzy / Towdie / Pedro Collectible Adventure Relic (10x10)
 */
export const SPRITE_RELIC_ARTIFACT: PixelSprite = {
  rows: [
    '...KKKK...',
    '..KYYYYK..',
    '.KYCCCCYK.',
    'KYCWCCWCYK',
    'KYCWWWWCYK',
    'KYCWCCWCYK',
    '.KYCCCCYK.',
    '..KYYYYK..',
    '...KKKK...',
  ],
  palette: {
    K: ZX_PALETTE.black,
    Y: ZX_PALETTE.brightYellow,
    C: ZX_PALETTE.brightCyan,
    W: ZX_PALETTE.brightWhite,
  },
};

// Backwards-compatible aliases used by title / legacy references
export const SPRITE_HERO_MICRODENT = SPRITE_ZUBOK_A;
export const SPRITE_HERO_TEATRO = SPRITE_SIGNALIK_A;

export const SPRITE_CARIES_TARGET: PixelSprite = {
  rows: [
    '..WWWWWW..',
    '.WWMMMMWW.',
    'WWMMRRMMWW',
    'WWMRRRMMWW',
    'WWMMMMMMWW',
    '.WWWWWWWW.',
    '.WW..WWWW.',
    '.WW...WW..',
    '..W...W...',
  ],
  palette: {
    W: ZX_PALETTE.white,
    M: ZX_PALETTE.magenta,
    R: ZX_PALETTE.brightRed,
  },
};

export const SPRITE_TOOTH_RESTORED: PixelSprite = {
  rows: [
    '..CCCCCC..',
    '.CWWWWWWC.',
    'CWWCWWWWWC',
    'CWWWWWWWWC',
    'CWWWWWWWWC',
    '.WWWWWWWW.',
    '.WWW..WWW.',
    '.WW....WW.',
    '..C....C..',
  ],
  palette: {
    W: ZX_PALETTE.brightWhite,
    C: ZX_PALETTE.brightCyan,
  },
};

export const SPRITE_FIBER_UNLINKED: PixelSprite = {
  rows: [
    '...RRRR...',
    '..R....R..',
    '.R.YYYY.R.',
    'R..Y..Y..R',
    'R..Y..Y..R',
    '.R.YYYY.R.',
    '..R....R..',
    '...RRRR...',
  ],
  palette: {
    R: ZX_PALETTE.brightRed,
    Y: ZX_PALETTE.yellow,
  },
};

export const SPRITE_FIBER_LINKED: PixelSprite = {
  rows: [
    '...CCCC...',
    '..CWWWWC..',
    '.CWGGGGWC.',
    'CWGGWWGGWC',
    'CWGGWWGGWC',
    '.CWGGGGWC.',
    '..CWWWWC..',
    '...CCCC...',
  ],
  palette: {
    C: ZX_PALETTE.brightCyan,
    W: ZX_PALETTE.brightWhite,
    G: ZX_PALETTE.brightGreen,
  },
};

export const SPRITE_ORNAMENT_UNLIT: PixelSprite = {
  rows: [
    '...YYYY...',
    '....YY....',
    '..RRRRRR..',
    '.RR....RR.',
    '.R..RR..R.',
    '.RR....RR.',
    '..RRRRRR..',
    '...RRRR...',
  ],
  palette: {
    Y: ZX_PALETTE.yellow,
    R: ZX_PALETTE.red,
  },
};

export const SPRITE_ORNAMENT_LIT: PixelSprite = {
  rows: [
    '...YYYY...',
    '....WW....',
    '..GGGGGG..',
    '.GGYYYYGG.',
    '.GYWWWWYG.',
    '.GGYYYYGG.',
    '..GGGGGG..',
    '...CCCC...',
  ],
  palette: {
    Y: ZX_PALETTE.brightYellow,
    W: ZX_PALETTE.brightWhite,
    G: ZX_PALETTE.brightGreen,
    C: ZX_PALETTE.brightCyan,
  },
};

export const SPRITE_CROWN_PICKUP: PixelSprite = {
  rows: [
    'Y...YY...Y',
    'YY.YYYY.YY',
    'YYYYYYYYYY',
    'YWWYWWYWWY',
    'YYYYYYYYYY',
    '.YYYYYYYY.',
  ],
  palette: {
    Y: ZX_PALETTE.brightYellow,
    W: ZX_PALETTE.brightWhite,
  },
};

export const SPRITE_COIL_PICKUP: PixelSprite = {
  rows: [
    '..CCCCCC..',
    '.CWW..WWC.',
    'CW.CCCC.WC',
    'CW.CYYC.WC',
    '.CWW..WWC.',
    '..CCCCCC..',
  ],
  palette: {
    C: ZX_PALETTE.brightCyan,
    W: ZX_PALETTE.brightWhite,
    Y: ZX_PALETTE.brightYellow,
  },
};

export const SPRITE_GIFT_PICKUP: PixelSprite = {
  rows: [
    '..YY..YY..',
    '.RRRRRRRR.',
    '.RRRYRRRR.',
    '.YYYYYYYY.',
    '.RRRYRRRR.',
    '.RRRRRRRR.',
  ],
  palette: {
    R: ZX_PALETTE.brightRed,
    Y: ZX_PALETTE.brightYellow,
  },
};

// Enemy 1: Patroller (Plaque Gremlin / Static Gremlin)
export const SPRITE_ENEMY_PATROLLER: PixelSprite = {
  rows: [
    '..GGGGGG..',
    '.GGGGGGGG.',
    'GGWWGGWWGG',
    'GGWBGGWBGG',
    'GGGGGGGGGG',
    'G.GGGGGG.G',
    'G.G.GG.G.G',
    '..G....G..',
  ],
  palette: {
    G: ZX_PALETTE.brightGreen,
    W: ZX_PALETTE.brightWhite,
    B: ZX_PALETTE.brightRed,
  },
};

// Enemy 2: Kiter / Ranged (Sugar Imp / Lag Drone)
export const SPRITE_ENEMY_KITER: PixelSprite = {
  rows: [
    '.M......M.',
    '..MMMMMM..',
    '.MMWWWWMM.',
    'MMWRMMRWMM',
    'MMMMMMMMMM',
    '.MMYYYYMM.',
    '..M.MM.M..',
    '.M......M.',
  ],
  palette: {
    M: ZX_PALETTE.brightMagenta,
    W: ZX_PALETTE.brightWhite,
    R: ZX_PALETTE.brightRed,
    Y: ZX_PALETTE.brightYellow,
  },
};

// Enemy 3: Charger (Tartar Tank / Packet Crusher)
export const SPRITE_ENEMY_CHARGER: PixelSprite = {
  rows: [
    '.RRRRRRRR.',
    'RRYYYYYYRR',
    'RYWWRRWWYR',
    'RYBBRRBBYR',
    'RRRRRRRRRR',
    'RYYYYYYYYR',
    'RR.RRRR.RR',
    'R........R',
  ],
  palette: {
    R: ZX_PALETTE.brightRed,
    Y: ZX_PALETTE.brightYellow,
    W: ZX_PALETTE.brightWhite,
    B: ZX_PALETTE.black,
  },
};

export const SPRITE_XMAS_TREE: PixelSprite = {
  rows: [
    '....YY....',
    '....YY....',
    '...GGGG...',
    '..GGYGGG..',
    '..GGGGGG..',
    '.GGRGGGGG.',
    '.GGGGGGCG.',
    'GGGGYGGGGG',
    'GGRGGGGGRG',
    '....MM....',
    '...MMMM...',
  ],
  palette: {
    Y: ZX_PALETTE.brightYellow,
    G: ZX_PALETTE.brightGreen,
    R: ZX_PALETTE.brightRed,
    C: ZX_PALETTE.brightCyan,
    M: ZX_PALETTE.red,
  },
};

/**
 * STAGE 6 FINALE BOSS: VEĽKÝ RUŠIČ (20x18 pixel art in strict ZX_PALETTE)
 */
export const SPRITE_BOSS_RUSIC: PixelSprite = {
  rows: [
    '....RR........RR....',
    '....RYY......YYR....',
    '.....RMMRRRRMMR.....',
    '...MMMMMMMMMMMMMM...',
    '..MMRRRRRRRRRRRRMM..',
    '.MMRRWWWWMMWWWWRRMM.',
    '.MRRWWKKWMMWKKWWRRM.',
    'MMRRWWKKWMMWKKWWRRMM',
    'MMRRRRRRRRRRRRRRRRMM',
    'MMRRYMMMMMMMMMMYRRM.',
    'MMRRYYYYYYYYYYYYRRMM',
    '.MRRMYKMYKMYKMYKRRM.',
    '.MMRRRRRRRRRRRRRRMM.',
    '..MMMMMMMMMMMMMMMM..',
    '...MM.MM....MM.MM...',
    '..RR..RR....RR..RR..',
    '..RR..RR....RR..RR..',
    '.RRR..RR....RR..RRR.',
  ],
  palette: {
    R: ZX_PALETTE.brightRed,
    M: ZX_PALETTE.brightMagenta,
    Y: ZX_PALETTE.brightYellow,
    W: ZX_PALETTE.brightWhite,
    K: ZX_PALETTE.black,
  },
};

/**
 * Friendly Rimavská Sobota citizen NPC sprite (Dizzy/Towdie homage, strict ZX_PALETTE).
 */
export const SPRITE_CITIZEN: PixelSprite = {
  rows: [
    '...YYYY...',
    '..YWWWWY..',
    '..WKWWKW..',
    '..WWWWWW..',
    '...RRRR...',
    '..GGRRGG..',
    '.GGGRRGGG.',
    '..GGGGGG..',
    '..BB..BB..',
    '..KK..KK..',
  ],
  palette: {
    Y: ZX_PALETTE.brightYellow,
    W: ZX_PALETTE.brightWhite,
    K: ZX_PALETTE.black,
    R: ZX_PALETTE.brightRed,
    G: ZX_PALETTE.brightGreen,
    B: ZX_PALETTE.blue,
  },
};

/**
 * Draws a crisp 1:1 pixel-aligned sprite onto the 256x192 Didaktik M logical canvas.
 */
export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  sprite: PixelSprite,
  cx: number,
  cy: number,
  options?: {
    overrideColor?: string;
    scaleX?: number;
    scaleY?: number;
    flipX?: boolean;
    alpha?: number;
  }
): void {
  const rows = sprite.rows;
  const h = rows.length;
  const w = rows[0].length;
  const sx = options?.scaleX ?? 1;
  const sy = options?.scaleY ?? 1;
  const flipX = options?.flipX ?? false;
  const prevAlpha = ctx.globalAlpha;

  if (options?.alpha !== undefined) {
    ctx.globalAlpha = options.alpha;
  }

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  ctx.scale(flipX ? -sx : sx, sy);

  const ox = -Math.floor(w / 2);
  const oy = -Math.floor(h / 2);

  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const color = options?.overrideColor ?? sprite.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }

  ctx.restore();
  ctx.globalAlpha = prevAlpha;
}
