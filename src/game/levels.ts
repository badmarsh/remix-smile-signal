/**
 * Six handcrafted Didaktik M (32 x 24 tiles @ 8x8px = 256x192) stages
 * set in real Rimavská Sobota landmarks + microDENT.sk & TeatrO.eu,
 * paying homage to iconic ZX Spectrum & Czechoslovak Didaktik M classics.
 *
 * Grid Legend:
 *  '#' = Solid wall block
 *  '.' = Open floor / bridge
 *  '~' = Rimava river water (slows player movement to 50%)
 *  'D' = Locked museum vault door (solid until Kronika 1270 relic is collected)
 */

import { ZX_PALETTE } from '../didaktik/specs';
import { StageDefinition } from './types';

export const TILE_SIZE = 8;
export const GRID_COLS = 32;
export const GRID_ROWS = 24;
export const SCREEN_W = GRID_COLS * TILE_SIZE; // 256
export const SCREEN_H = GRID_ROWS * TILE_SIZE; // 192

const MAP_CLINIC_1: string[] = [
  '################################',
  '#..............................#',
  '#..............................#',
  '#...####.......##.......####...#',
  '#...#......................#...#',
  '#...#......................#...#',
  '#..............................#',
  '#...........########...........#',
  '#..............................#',
  '#......##..............##......#',
  '#......##..............##......#',
  '#..............................#',
  '#..............................#',
  '#......##..............##......#',
  '#......##..............##......#',
  '#..............................#',
  '#...........########...........#',
  '#..............................#',
  '#...#......................#...#',
  '#...#......................#...#',
  '#...####.......##.......####...#',
  '#..............................#',
  '#..............................#',
  '################################',
];

const MAP_CLINIC_2: string[] = [
  '################################',
  '#..............................#',
  '#..............................#',
  '#.....######........######.....#',
  '#.....#..................#.....#',
  '#..............................#',
  '#..##........######........##..#',
  '#..##......................##..#',
  '#..............................#',
  '#.........##........##.........#',
  '#.........#..........#.........#',
  '#..............................#',
  '#..............................#',
  '#.........#..........#.........#',
  '#.........##........##.........#',
  '#..............................#',
  '#..##......................##..#',
  '#..##........######........##..#',
  '#..............................#',
  '#.....#..................#.....#',
  '#.....######........######.....#',
  '#..............................#',
  '#..............................#',
  '################################',
];

const MAP_TEATRO_1: string[] = [
  '################################',
  '#..............................#',
  '#..............................#',
  '#..#####................#####..#',
  '#..#........................#..#',
  '#.........###......###.........#',
  '#.........#..........#.........#',
  '#..............................#',
  '#....###................###....#',
  '#....#....................#....#',
  '#.............####.............#',
  '#..............................#',
  '#..............................#',
  '#.............####.............#',
  '#....#....................#....#',
  '#....###................###....#',
  '#..............................#',
  '#.........#..........#.........#',
  '#.........###......###.........#',
  '#..#........................#..#',
  '#..#####................#####..#',
  '#..............................#',
  '#..............................#',
  '################################',
];

const MAP_TEATRO_2: string[] = [
  '################################',
  '#..............................#',
  '#..............................#',
  '#....###......####......###....#',
  '#....#....................#....#',
  '#..............................#',
  '#........####......####........#',
  '#........#............#........#',
  '#..............................#',
  '#..###....................###..#',
  '#.....~~~..~~~....~~~..~~~.....#',
  '#.....~~~..~~~....~~~..~~~.....#',
  '#.....~~~..~~~....~~~..~~~.....#',
  '#.....~~~..~~~....~~~..~~~.....#',
  '#..###....................###..#',
  '#..............................#',
  '#........#............#........#',
  '#........####......####........#',
  '#..............................#',
  '#....#....................#....#',
  '#....###......####......###....#',
  '#..............................#',
  '#..............................#',
  '################################',
];

const MAP_GALA_1: string[] = [
  '################################',
  '#..............................#',
  '#..............................#',
  '#...####....########....####...#',
  '#...#.......#......#.......#...#',
  '#...........#......#...........#',
  '#.......###.#......#.###.......#',
  '#.......#...#......#...#.......#',
  '#...........##DDDD##...........#',
  '#...##....................##...#',
  '#..............................#',
  '#..............................#',
  '#..............................#',
  '#..............................#',
  '#...##.......######.......##...#',
  '#..............................#',
  '#.......#..............#.......#',
  '#.......###..........###.......#',
  '#..............................#',
  '#...#......................#...#',
  '#...####.....######.....####...#',
  '#..............................#',
  '#..............................#',
  '################################',
];

const MAP_GALA_2: string[] = [
  '################################',
  '#..............................#',
  '#..............................#',
  '#..####.......####.......####..#',
  '#..#........................#..#',
  '#..............................#',
  '#......###............###......#',
  '#......#................#......#',
  '#...........##....##...........#',
  '#..............................#',
  '#..##......................##..#',
  '#..............................#',
  '#..............................#',
  '#..##......................##..#',
  '#..............................#',
  '#...........##....##...........#',
  '#......#................#......#',
  '#......###............###......#',
  '#..............................#',
  '#..#........................#..#',
  '#..####.......####.......####..#',
  '#..............................#',
  '#..............................#',
  '################################',
];

const MAP_STAGE_7: string[] = [
  '#####.....#####.....#####.......',
  '#1...........E...........2.....#',
  '#..............................#',
  '#...########.......########....#',
  '#...#...........E...#..........#',
  '#...#.................#...3....#',
  '#..............................#',
  '#...........########...........#',
  '#..............................#',
  '#..##..............##..........#',
  '#..##..........................#',
  '#..........................4...#',
  '#..............................#',
  '#..##..............##..........#',
  '#..##..........................#',
  '#..............................#',
  '#...........########...........#',
  '#..............................#',
  '#...#......................#...#',
  '#...#......................#...#',
  '#...####.......##.......####...#',
  '#..............................#',
  '#..............................#',
  '#####.....#####.....#####.......',
];

function tileCenter(col: number, row: number) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

export const STAGES: StageDefinition[] = [
  {
    index: 0,
    act: 'microdent',
    title: 'Klinika microDENT',
    subtitle: 'Istvána Hatvaniho 2 · Vyčisti kazy CEREC laserom a zober 3D korunku',
    companyTag: 'microDENT.sk · 1. dejstvo',
    locationTag: 'Istvána Hatvaniho 2 · Rimavská Sobota',
    retroHomage: 'Dizzy & Towdie (Ultrasoft)',
    openingChronicle: 'KRONIKA: KLINIKA MICRODENT · NÁJDI CEREC KORUNKU',
    borderColorIdx: 1, // Blue
    wallColor: ZX_PALETTE.cyan,
    wallAccent: ZX_PALETTE.brightCyan,
    floorDotColor: ZX_PALETTE.blue,
    grid: MAP_CLINIC_1,
    playerStart: tileCenter(15, 11),
    relic: {
      ...tileCenter(15, 2),
      kind: 'cerec',
      name: 'CEREC 3D Korunka',
      chronicleNote: 'ARTEFAKT: CEREC 3D KORUNKA (+400) · PRESNOSŤ!',
    },
    targets: [
      { ...tileCenter(5, 5), kind: 'caries' },
      { ...tileCenter(26, 5), kind: 'caries' },
      { ...tileCenter(5, 18), kind: 'caries' },
      { ...tileCenter(26, 18), kind: 'caries' },
      { ...tileCenter(15, 5), kind: 'caries' },
      { ...tileCenter(15, 18), kind: 'caries' },
    ],
    pickups: [
      { ...tileCenter(2, 11), kind: 'crown', points: 250 },
      { ...tileCenter(29, 11), kind: 'crown', points: 250 },
    ],
    enemies: [
      { ...tileCenter(3, 2), archetype: 'patroller' },
      { ...tileCenter(28, 2), archetype: 'patroller' },
      { ...tileCenter(28, 21), archetype: 'kiter' },
    ],
    hazards: [
      {
        kind: 'uv_beam',
        x1: 56,
        y1: 48,
        x2: 56,
        y2: 144,
        onDuration: 2.0,
        offDuration: 2.0,
        telegraphDuration: 0.5,
        phaseOffset: 0,
      },
      {
        kind: 'uv_beam',
        x1: 200,
        y1: 48,
        x2: 200,
        y2: 144,
        onDuration: 2.0,
        offDuration: 2.0,
        telegraphDuration: 0.5,
        phaseOffset: 2.0,
      },
    ],
  },
  {
    index: 1,
    act: 'microdent',
    title: 'Endo & 3D CBCT Lab',
    subtitle: 'Rotujúci CBCT lúč · Použi Saboteur úhyb [Shift] cez skenovací lúč',
    companyTag: 'microDENT.sk · 1. dejstvo',
    locationTag: 'microDENT Endo & Laser · Rimavská Sobota',
    retroHomage: 'Saboteur! & Atomix (Ultrasoft)',
    openingChronicle: 'KRONIKA: 3D CBCT LÚČ ROTUJE · PREBEHNI CEZEŇ [SHIFT]!',
    borderColorIdx: 5, // Cyan
    wallColor: ZX_PALETTE.blue,
    wallAccent: ZX_PALETTE.brightCyan,
    floorDotColor: ZX_PALETTE.blue,
    grid: MAP_CLINIC_2,
    playerStart: tileCenter(15, 16),
    relic: {
      ...tileCenter(15, 21),
      kind: 'laser',
      name: 'Zubný mikroskop & Laser',
      chronicleNote: 'ARTEFAKT: ZUBNÝ LASER (+450) · CESTA K TEATRU!',
    },
    hazards: [
      {
        kind: 'cbct_beam',
        cx: 128,
        cy: 96,
        length: 74,
        angularSpeed: 0.72,
        initialAngle: -Math.PI / 2,
      },
    ],
    targets: [
      { ...tileCenter(7, 5), kind: 'caries' },
      { ...tileCenter(24, 5), kind: 'caries' },
      { ...tileCenter(4, 11), kind: 'caries' },
      { ...tileCenter(27, 11), kind: 'caries' },
      { ...tileCenter(7, 18), kind: 'caries' },
      { ...tileCenter(24, 18), kind: 'caries' },
      { ...tileCenter(15, 3), kind: 'caries' },
    ],
    pickups: [
      { ...tileCenter(15, 19), kind: 'crown', points: 300 },
      { ...tileCenter(2, 2), kind: 'gift', points: 400 },
    ],
    enemies: [
      { ...tileCenter(3, 21), archetype: 'patroller' },
      { ...tileCenter(28, 2), archetype: 'kiter' },
      { ...tileCenter(3, 2), archetype: 'charger' },
      { ...tileCenter(28, 21), archetype: 'patroller' },
    ],
  },
  {
    index: 2,
    act: 'teatro',
    title: 'Optický uzol TeatrO',
    subtitle: 'Atomix zapojenie vlákien 1–7 v presnom poradí · Prepni Signálika [C]',
    companyTag: 'TeatrO.eu · 2. dejstvo',
    locationTag: 'Optická ústredňa TeatrO / RSNET',
    retroHomage: 'Atomix, Exolon & F.I.R.E. (Fuxoft)',
    openingChronicle: 'KRONIKA: OPTICKÝ UZOL · ZAPÁJAJ VLÁKNA V PORADÍ 1–7!',
    borderColorIdx: 0, // Black
    wallColor: ZX_PALETTE.red,
    wallAccent: ZX_PALETTE.brightYellow,
    floorDotColor: ZX_PALETTE.red,
    grid: MAP_TEATRO_1,
    playerStart: tileCenter(15, 11),
    orderedTargets: true,
    relic: {
      ...tileCenter(15, 2),
      kind: 'patchcord',
      name: 'Optický patchcord 10G',
      chronicleNote: 'ARTEFAKT: OPTICKÝ PATCHCORD (+500) · IPTV BEŽÍ!',
    },
    targets: [
      { ...tileCenter(4, 5), kind: 'fiber' },
      { ...tileCenter(27, 5), kind: 'fiber' },
      { ...tileCenter(15, 4), kind: 'fiber' },
      { ...tileCenter(4, 18), kind: 'fiber' },
      { ...tileCenter(27, 18), kind: 'fiber' },
      { ...tileCenter(15, 19), kind: 'fiber' },
      { ...tileCenter(2, 11), kind: 'fiber' },
    ],
    pickups: [
      { ...tileCenter(29, 11), kind: 'coil', points: 300 },
      { ...tileCenter(15, 8), kind: 'coil', points: 300 },
    ],
    enemies: [
      { ...tileCenter(3, 2), archetype: 'patroller' },
      { ...tileCenter(28, 2), archetype: 'kiter' },
      { ...tileCenter(3, 21), archetype: 'kiter' },
      { ...tileCenter(28, 21), archetype: 'charger' },
    ],
  },
  {
    index: 3,
    act: 'teatro',
    title: 'Rieka Rimava & Kurinec',
    subtitle: 'Cyklomost cez Rimavu & Zelená voda · Free Wi-Fi + RTX 3090 uzol',
    companyTag: 'TeatrO.eu · 2. dejstvo',
    locationTag: 'Rieka Rimava · Kurinec – Zelená voda',
    retroHomage: 'Bubble Bobble & Target: Renegade',
    openingChronicle: 'KRONIKA: RIMAVA -> KURINEC · UVÄZNI RUŠIČA V BUBLINE!',
    borderColorIdx: 2, // Red
    wallColor: ZX_PALETTE.magenta,
    wallAccent: ZX_PALETTE.brightYellow,
    floorDotColor: ZX_PALETTE.magenta,
    grid: MAP_TEATRO_2,
    playerStart: tileCenter(15, 11),
    relic: {
      ...tileCenter(29, 11),
      kind: 'wifi',
      name: 'Vysielač Free Wi-Fi + RTX 3090',
      chronicleNote: 'ARTEFAKT: FREE WI-FI + RTX 3090 (+550) · SIGNÁL!',
    },
    targets: [
      { ...tileCenter(5, 5), kind: 'fiber' },
      { ...tileCenter(26, 5), kind: 'fiber' },
      { ...tileCenter(5, 18), kind: 'fiber' },
      { ...tileCenter(26, 18), kind: 'fiber' },
      { ...tileCenter(15, 2), kind: 'fiber' },
      { ...tileCenter(15, 21), kind: 'fiber' },
      { ...tileCenter(4, 11), kind: 'fiber' },
      { ...tileCenter(27, 11), kind: 'fiber' },
    ],
    pickups: [
      { ...tileCenter(11, 8), kind: 'coil', points: 350 },
      { ...tileCenter(20, 15), kind: 'gift', points: 500 },
    ],
    enemies: [
      { ...tileCenter(2, 2), archetype: 'charger' },
      { ...tileCenter(29, 2), archetype: 'kiter' },
      { ...tileCenter(2, 21), archetype: 'patroller' },
      { ...tileCenter(29, 21), archetype: 'charger' },
      { ...tileCenter(15, 5), archetype: 'patroller' },
    ],
  },
  {
    index: 4,
    act: 'gala',
    title: 'Gemersko-malohontské múzeum',
    subtitle: 'Klenba je zamknutá · Nájdi Kroniku 1270 ako kľúč od múzejných dverí',
    companyTag: 'Rimavská Sobota · 3. dejstvo',
    locationTag: 'Gemersko-malohontské múzeum · Rymos Zumbota 1270',
    retroHomage: 'Knight Lore, Pedro & Belegost',
    openingChronicle: 'KRONIKA 1270: ZOBER KRONIKU A ODOMKNI DVERE KLENBY!',
    borderColorIdx: 4, // Green
    wallColor: ZX_PALETTE.green,
    wallAccent: ZX_PALETTE.brightGreen,
    floorDotColor: ZX_PALETTE.green,
    grid: MAP_GALA_1,
    playerStart: tileCenter(15, 11),
    doorsUnlockedByRelic: 'chronicle',
    relic: {
      ...tileCenter(15, 21),
      kind: 'chronicle',
      name: 'Kronika Rymos Zumbota 1270',
      chronicleNote: 'ARTEFAKT: KRONIKA 1270 (+600) · DVERE OTVORENÉ!',
    },
    targets: [
      { ...tileCenter(5, 5), kind: 'caries' },
      { ...tileCenter(26, 5), kind: 'fiber' },
      { ...tileCenter(5, 18), kind: 'fiber' },
      { ...tileCenter(26, 18), kind: 'caries' },
      { ...tileCenter(14, 6), kind: 'ornament' },
      { ...tileCenter(17, 6), kind: 'ornament' },
      { ...tileCenter(2, 11), kind: 'caries' },
      { ...tileCenter(29, 11), kind: 'fiber' },
    ],
    pickups: [
      { ...tileCenter(9, 11), kind: 'crown', points: 400 },
      { ...tileCenter(22, 11), kind: 'coil', points: 400 },
    ],
    enemies: [
      { ...tileCenter(2, 2), archetype: 'patroller' },
      { ...tileCenter(29, 2), archetype: 'kiter' },
      { ...tileCenter(2, 21), archetype: 'charger' },
      { ...tileCenter(29, 21), archetype: 'kiter' },
      { ...tileCenter(15, 2), archetype: 'charger' },
    ],
  },
  {
    index: 5,
    act: 'gala',
    title: 'Hlavné námestie · Plaketa MVP',
    subtitle: 'Župný dom & Radnica · Doruč Radovi 1. miesto Celoživotný MVP regiónu',
    companyTag: 'Finále MVP · Rado Ceglédy',
    locationTag: 'Hlavné námestie · Mestská pamiatková zóna RS',
    retroHomage: 'Elite, Boovie & Lords of Midnight',
    openingChronicle: 'FINÁLE: OBNOV 8 CIEĽOV A ZRUŠ ŠTÍT VEĽKÉHO RUŠIČA!',
    borderColorIdx: 1, // Blue
    wallColor: ZX_PALETTE.brightGreen,
    wallAccent: ZX_PALETTE.brightYellow,
    floorDotColor: ZX_PALETTE.blue,
    grid: MAP_GALA_2,
    playerStart: tileCenter(15, 18),
    bossSpawn: tileCenter(15, 10),
    podiumPos: tileCenter(15, 2),
    relic: {
      ...tileCenter(15, 11),
      kind: 'plaque',
      name: 'Plaketa 1. miesto · Celoživotný MVP',
      chronicleNote: 'MÁŠ PLAKETU MVP (+1000)! ODNES JU NA PÓDIUM!',
    },
    targets: [
      { ...tileCenter(4, 5), kind: 'ornament' },
      { ...tileCenter(27, 5), kind: 'ornament' },
      { ...tileCenter(4, 18), kind: 'ornament' },
      { ...tileCenter(27, 18), kind: 'ornament' },
      { ...tileCenter(15, 5), kind: 'caries' },
      { ...tileCenter(10, 14), kind: 'fiber' },
      { ...tileCenter(8, 11), kind: 'caries' },
      { ...tileCenter(23, 11), kind: 'fiber' },
    ],
    pickups: [
      { ...tileCenter(2, 2), kind: 'gift', points: 500 },
      { ...tileCenter(29, 2), kind: 'crown', points: 500 },
      { ...tileCenter(29, 21), kind: 'coil', points: 500 },
    ],
    enemies: [
      { ...tileCenter(2, 21), archetype: 'charger' },
      { ...tileCenter(29, 2), archetype: 'charger' },
      { ...tileCenter(2, 2), archetype: 'kiter' },
      { ...tileCenter(29, 21), archetype: 'kiter' },
      { ...tileCenter(15, 2), archetype: 'patroller' },
      { ...tileCenter(8, 21), archetype: 'patroller' },
    ],
  },
  {
    index: 6,
    act: 'gala',
    title: 'Servisný úraz · Rimavská Sobota',
    subtitle: '4 zóny · 90 s únik · oprava relé · obrana centra',
    companyTag: 'Servisný úraz · Finálny blok',
    locationTag: 'Hlavné námestie · Mestská pamiatková zóna RS',
    retroHomage: 'Elite, Saboteur!, Bubble Bobble & R-Type',
    openingChronicle: 'KRONIKA: SERVISNÝ ÚRAZ · VYBER ZÓNU A PREŽI!',
    borderColorIdx: 1,
    wallColor: ZX_PALETTE.brightGreen,
    wallAccent: ZX_PALETTE.brightYellow,
    floorDotColor: ZX_PALETTE.blue,
    grid: MAP_STAGE_7,
    playerStart: tileCenter(15, 11),
    bossSpawn: tileCenter(15, 10),
    timeLimitSec: 90,
    totalWaves: 5,
    startPlayMode: 'deploy_select',
    partnerChargeConfig: {
      chargeDuration: 1.5,
      radius: 48,
      damageMultiplier: 2,
      label: 'SIGNALÍK BLAST',
    },
    waves: [
      {
        spawnTimer: 2.0,
        enemyComposition: [{ archetype: 'patroller', count: 3 }],
        description: 'First outages',
      },
      {
        spawnTimer: 1.8,
        enemyComposition: [
          { archetype: 'patroller', count: 2 },
          { archetype: 'charger', count: 1 },
        ],
        description: 'Communication failure',
      },
      {
        spawnTimer: 1.5,
        enemyComposition: [
          { archetype: 'kiter', count: 2 },
          { archetype: 'patroller', count: 2 },
        ],
        description: 'Network disruption',
      },
      {
        spawnTimer: 1.2,
        enemyComposition: [
          { archetype: 'charger', count: 3 },
          { archetype: 'kiter', count: 1 },
        ],
        description: 'Massive attack',
      },
      {
        spawnTimer: 1.0,
        enemyComposition: [{ archetype: 'patroller', count: 1 }],
        description: 'Final anomaly strike',
      },
    ],
    relic: {
      ...tileCenter(15, 11),
      kind: 'plaque',
      name: 'Servisný kľúč',
      chronicleNote: 'ARTEFAKT: SERVISNÝ KLÚČ (+400)',
    },
    targets: [
      { ...tileCenter(5, 5), kind: 'ornament' },
      { ...tileCenter(26, 5), kind: 'ornament' },
      { ...tileCenter(5, 18), kind: 'ornament' },
      { ...tileCenter(26, 18), kind: 'ornament' },
      { ...tileCenter(15, 5), kind: 'fiber' },   // relay endpoint A
      { ...tileCenter(15, 18), kind: 'fiber' },  // relay endpoint B
    ],
    pickups: [
      { ...tileCenter(2, 11), kind: 'crown', points: 400 },
      { ...tileCenter(29, 11), kind: 'crown', points: 400 },
    ],
    enemies: [
      { ...tileCenter(2, 2), archetype: 'patroller' },
      { ...tileCenter(29, 21), archetype: 'patroller' },
      { ...tileCenter(15, 2), archetype: 'kiter' },
    ],
  },
];

export function isWallTile(
  stage: StageDefinition,
  col: number,
  row: number,
  doorsOpen = false
): boolean {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
    return true;
  }
  const ch = stage.grid[row][col];
  if (ch === '#') return true;
  if (ch === 'D' && !doorsOpen) return true;
  return false;
}

export function isWaterTile(stage: StageDefinition, col: number, row: number): boolean {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
    return false;
  }
  return stage.grid[row][col] === '~';
}

export function isLockedDoorTile(
  stage: StageDefinition,
  col: number,
  row: number,
  doorsOpen = false
): boolean {
  if (doorsOpen || col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
    return false;
  }
  return stage.grid[row][col] === 'D';
}
