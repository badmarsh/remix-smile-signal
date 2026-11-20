/**
 * Memory-optimized 8x8 User Defined Graphics (UDG) pixel-art asset pack
 * for the Didaktik M / ZX Spectrum 48K (Angstrem T34VG1 ULA).
 *
 * Each UDG occupies exactly 8 bytes in RAM (at USR "a" = 65368 .. USR "u" = 65535,
 * total 168-byte hardware UDG table) plus 1 attribute byte (INK + PAPER*8 + BRIGHT*64).
 */

import { ZX_PALETTE } from './specs';

export type UdgCategory = 'microdent' | 'teatro' | 'christmas' | 'enemy';

export interface DidaktikUdgAsset {
  id: string;
  slotChar: string; // 'a' .. 'l' (USR "a" = CHR$ 144)
  chrCode: number; // 144 .. 155
  name: string;
  category: UdgCategory;
  description: string;
  /** 8 bytes (one per pixel row, MSB = leftmost pixel) */
  bytes: number[];
  /** Authentic ZX Spectrum attribute indices */
  ink: number; // 0..7
  paper: number; // 0..7
  bright: 0 | 1;
}

export const ZX_INK_COLORS = [
  { index: 0, name: 'Čierna', normal: ZX_PALETTE.black, bright: ZX_PALETTE.brightBlack },
  { index: 1, name: 'Modrá', normal: ZX_PALETTE.blue, bright: ZX_PALETTE.brightBlue },
  { index: 2, name: 'Červená', normal: ZX_PALETTE.red, bright: ZX_PALETTE.brightRed },
  { index: 3, name: 'Purpurová', normal: ZX_PALETTE.magenta, bright: ZX_PALETTE.brightMagenta },
  { index: 4, name: 'Zelená', normal: ZX_PALETTE.green, bright: ZX_PALETTE.brightGreen },
  { index: 5, name: 'Azúrová', normal: ZX_PALETTE.cyan, bright: ZX_PALETTE.brightCyan },
  { index: 6, name: 'Žltá', normal: ZX_PALETTE.yellow, bright: ZX_PALETTE.brightYellow },
  { index: 7, name: 'Biela', normal: ZX_PALETTE.white, bright: ZX_PALETTE.brightWhite },
] as const;

export function getZxHexColor(colorIndex: number, bright: 0 | 1): string {
  const entry = ZX_INK_COLORS[colorIndex & 7];
  return bright === 1 ? entry.bright : entry.normal;
}

/**
 * Computes the exact 1-byte ZX Spectrum / Didaktik M screen attribute value:
 * Bit 7: FLASH (0), Bit 6: BRIGHT, Bits 5-3: PAPER, Bits 2-0: INK
 */
export function computeZxAttributeByte(ink: number, paper: number, bright: 0 | 1): number {
  return ((bright & 1) << 6) | ((paper & 7) << 3) | (ink & 7);
}

/**
 * Toggles a single pixel (col 0..7, row 0..7) inside an 8-byte UDG bitmap.
 */
export function toggleUdgPixel(bytes: number[], row: number, col: number): number[] {
  const next = bytes.slice();
  if (row < 0 || row > 7 || col < 0 || col > 7) return next;
  const mask = 1 << (7 - col);
  next[row] = (next[row] ^ mask) & 0xff;
  return next;
}

export function isUdgPixelSet(bytes: number[], row: number, col: number): boolean {
  if (row < 0 || row > 7 || col < 0 || col > 7) return false;
  return ((bytes[row] >> (7 - col)) & 1) === 1;
}

/**
 * Formats a single UDG asset as Sinclair BASIC DATA + POKE snippet.
 */
export function formatUdgAsBasic(asset: DidaktikUdgAsset, lineNum = 900): string {
  const byteList = asset.bytes.join(',');
  return [
    `${lineNum} REM UDG "${asset.slotChar}" (${asset.name}) — 8 BYTES`,
    `${lineNum + 10} RESTORE ${lineNum + 30}: FOR N=0 TO 7: READ B: POKE USR "${asset.slotChar}"+N,B: NEXT N`,
    `${lineNum + 20} PRINT INK ${asset.ink}; PAPER ${asset.paper}; BRIGHT ${asset.bright}; CHR$ ${asset.chrCode}`,
    `${lineNum + 30} DATA ${byteList}`,
  ].join('\n');
}

/**
 * Formats the full 12-asset UDG pack as Z80 assembly DEFB definitions (96 bytes total).
 */
export function formatUdgPackAsZ80(assets: DidaktikUdgAsset[]): string {
  const lines: string[] = [
    '; Didaktik M / ZX Spectrum 48K UDG Graphics Pack',
    '; Inspired by microDENT.sk & TeatrO.eu (Rimavska Sobota)',
    `; Total RAM Footprint: ${assets.length * 8} bytes (of 168-byte UDG table at $FF58)`,
    'ORG $FF58',
    '',
  ];

  for (const a of assets) {
    const hex = a.bytes.map((b) => '$' + b.toString(16).toUpperCase().padStart(2, '0')).join(',');
    const attr = computeZxAttributeByte(a.ink, a.paper, a.bright);
    lines.push(
      `UDG_${a.id.toUpperCase()}: ; USR "${a.slotChar}" (CHR$ ${a.chrCode}) ATTR=$${attr
        .toString(16)
        .toUpperCase()
        .padStart(2, '0')}`
    );
    lines.push(`    DEFB ${hex}`);
  }
  return lines.join('\n');
}

/**
 * Formats the full UDG pack as a ready-to-paste Sinclair BASIC loader block.
 */
export function formatUdgPackAsBasic(assets: DidaktikUdgAsset[]): string {
  const totalBytes = assets.length * 8;
  const lines: string[] = [
    '9000 REM --- SMILE & SIGNAL UDG PACK (microDENT & TeatrO) ---',
    `9010 RESTORE 9100: FOR N=0 TO ${totalBytes - 1}: READ B: POKE USR "a"+N,B: NEXT N: RETURN`,
  ];
  assets.forEach((a, idx) => {
    lines.push(`91${String(idx * 10).padStart(2, '0')} DATA ${a.bytes.join(',')} : REM ${a.name}`);
  });
  return lines.join('\n');
}

/**
 * Default 12-tile Didaktik M UDG Asset Pack (96 bytes total RAM!).
 * First 6 slots (a-f) map 1-to-1 to the native Sinclair BASIC cassette game.
 */
export const DEFAULT_UDG_PACK: DidaktikUdgAsset[] = [
  {
    id: 'dr_micro',
    slotChar: 'a',
    chrCode: 144,
    name: 'Hrdina Dr. Micro',
    category: 'microdent',
    description: 'Hrdina kliniky microDENT v optickom štíte a lekárskom plášti',
    bytes: [24, 60, 90, 126, 60, 24, 60, 102],
    ink: 5, // Bright Cyan
    paper: 0,
    bright: 1,
  },
  {
    id: 'gleaming_tooth',
    slotChar: 'b',
    chrCode: 145,
    name: 'Zúbok microDENT',
    category: 'microdent',
    description: 'Ošetrený žiarivo biely zúbok so zdravou sklovinou',
    bytes: [60, 126, 110, 126, 126, 102, 102, 66],
    ink: 7, // Bright White
    paper: 0,
    bright: 1,
  },
  {
    id: 'fiber_node',
    slotChar: 'c',
    chrCode: 146,
    name: 'Optický uzol TeatrO',
    category: 'teatro',
    description: 'Aktívny optický uzol v Rimavskej Sobote pre vianočný signál',
    bytes: [24, 60, 102, 219, 219, 102, 60, 24],
    ink: 6, // Bright Yellow
    paper: 0,
    bright: 1,
  },
  {
    id: 'plaque_gremlin',
    slotChar: 'd',
    chrCode: 147,
    name: 'Zubný povlak',
    category: 'enemy',
    description: 'Hliadkujúci nepriateľ na sklovine, ktorého zneškodní laser',
    bytes: [66, 126, 219, 255, 255, 126, 90, 129],
    ink: 4, // Bright Green
    paper: 0,
    bright: 1,
  },
  {
    id: 'static_gremlin',
    slotChar: 'e',
    chrCode: 148,
    name: 'Rušič signálu',
    category: 'enemy',
    description: 'Šumový dron narúšajúci vianočné IPTV vysielanie TeatrO',
    bytes: [129, 66, 60, 126, 219, 126, 66, 129],
    ink: 3, // Bright Magenta
    paper: 0,
    bright: 1,
  },
  {
    id: 'xmas_tree',
    slotChar: 'f',
    chrCode: 149,
    name: 'Rimavský stromček',
    category: 'christmas',
    description: 'Sviatočný vianočný stromček pre Didaktik M s hviezdou',
    bytes: [16, 56, 124, 56, 124, 254, 16, 56],
    ink: 4, // Bright Green
    paper: 0,
    bright: 1,
  },
  {
    id: 'dental_scope',
    slotChar: 'g',
    chrCode: 150,
    name: 'Zubný mikroskop',
    category: 'microdent',
    description: 'Presný endodontický mikroskop z kliniky microDENT',
    bytes: [28, 28, 8, 28, 42, 62, 16, 124],
    ink: 5, // Bright Cyan
    paper: 0,
    bright: 1,
  },
  {
    id: 'cerec_crown',
    slotChar: 'h',
    chrCode: 151,
    name: 'Zlatá korunka CEREC',
    category: 'microdent',
    description: 'Bonusová keramická korunka za extra body',
    bytes: [0, 129, 189, 255, 219, 255, 126, 0],
    ink: 6, // Bright Yellow
    paper: 0,
    bright: 1,
  },
  {
    id: 'teatro_dish',
    slotChar: 'i',
    chrCode: 152,
    name: 'Vysielač TeatrO',
    category: 'teatro',
    description: 'Strešná vysielacia anténa pre digitálnu televíziu TeatrO',
    bytes: [60, 66, 24, 126, 24, 24, 60, 126],
    ink: 2, // Bright Red
    paper: 0,
    bright: 1,
  },
  {
    id: 'iptv_screen',
    slotChar: 'j',
    chrCode: 153,
    name: 'TeatrO IPTV box',
    category: 'teatro',
    description: 'Televízna obrazovka s krištáľovo čistým optickým prenosom',
    bytes: [36, 24, 126, 195, 219, 195, 126, 60],
    ink: 5, // Bright Cyan
    paper: 0,
    bright: 1,
  },
  {
    id: 'tartar_tank',
    slotChar: 'k',
    chrCode: 154,
    name: 'Zubný kameň',
    category: 'enemy',
    description: 'Odolný útočník, ktorý pred výpadom zabliká výstrahou',
    bytes: [126, 255, 219, 255, 255, 189, 102, 195],
    ink: 2, // Bright Red
    paper: 0,
    bright: 1,
  },
  {
    id: 'gift_box',
    slotChar: 'l',
    chrCode: 155,
    name: 'Vianočný darček',
    category: 'christmas',
    description: 'Sviatočný balíček pre microDENT.sk a TeatrO.eu',
    bytes: [102, 60, 126, 153, 255, 153, 126, 126],
    ink: 2, // Bright Red
    paper: 0,
    bright: 1,
  },
];
