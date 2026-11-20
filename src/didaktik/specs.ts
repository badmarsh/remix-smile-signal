/**
 * Authentic Didaktik M (Didaktik Skalica, Czechoslovakia, 1990-1993)
 * hardware parameters and ZX Spectrum 48K 15-color palette.
 */

export interface HardwareSpec {
  label: string;
  value: string;
  detail: string;
}

export const DIDAKTIK_SPECS: HardwareSpec[] = [
  {
    label: 'Procesor',
    value: 'Zilog Z80A @ 4,0 MHz',
    detail: '8-bitový procesor (mierne vyšší takt než pôvodný 3,5 MHz ZX Spectrum)',
  },
  {
    label: 'Pamäť',
    value: '48 KiB RAM / 16 KiB ROM',
    detail: '64 KiB fyzickej DRAM (16 KiB tienených ROM) + upravený Sinclair BASIC ROM',
  },
  {
    label: 'Obraz ULA',
    value: 'Angstrem T34VG1 (256 × 192)',
    detail: '32 × 24 atribútových buniek (8 × 8 px), 15 farieb, štvorcový pomer pixelov 1:1',
  },
  {
    label: 'Zvuk',
    value: '1-bitový bzučiak + modul Melodik (AY-3-8912)',
    detail: 'Port 0xFE (Sinclair BASIC BEEP) a voliteľný 3-kanálový hudobný modul Didaktik Melodik',
  },
  {
    label: 'Kazeta (MG)',
    value: '5-pinový DIN konektor Magnetofón',
    detail: 'Štandardný Sinclair FSK/PWM kazetový protokol (~1500 baud), podpora .TAP a .WAV',
  },
  {
    label: 'Ovládanie',
    value: '45 klávesov + samostatné šípky',
    detail: 'Klasické šípky v tvare T a samostatné porty pre Kempston a Sinclair joystick',
  },
];

/**
 * Exact 15-color ZX Spectrum / Didaktik M palette
 * Indices 0-7: Normal (BRIGHT 0), Indices 8-15: Bright (BRIGHT 1)
 */
export const ZX_PALETTE = {
  // Normal (BRIGHT 0)
  black: '#000000',
  blue: '#0000C8',
  red: '#C80000',
  magenta: '#C800C8',
  green: '#00C800',
  cyan: '#00C8C8',
  yellow: '#C8C800',
  white: '#C8C8C8',
  // Bright (BRIGHT 1)
  brightBlack: '#000000',
  brightBlue: '#0022FF',
  brightRed: '#FF1E1E',
  brightMagenta: '#FF22FF',
  brightGreen: '#1AE62A',
  brightCyan: '#00E8E8',
  brightYellow: '#FFEE00',
  brightWhite: '#FFFFFF',
} as const;

export const ZX_BORDER_COLORS = [
  ZX_PALETTE.black,
  ZX_PALETTE.blue,
  ZX_PALETTE.red,
  ZX_PALETTE.magenta,
  ZX_PALETTE.green,
  ZX_PALETTE.cyan,
  ZX_PALETTE.yellow,
  ZX_PALETTE.white,
] as const;

export interface DinPin {
  pin: number;
  signal: string;
  description: string;
}

export const MG_DIN_PINOUT: DinPin[] = [
  { pin: 1, signal: 'MIC (Výstup)', description: 'Výstup SAVE z Didaktiku M do vstupu magnetofónu' },
  { pin: 2, signal: 'GND (Zem)', description: 'Spoločná zvuková zem / tienenie kábla (stredný pin)' },
  { pin: 3, signal: 'EAR (Vstup)', description: 'Zvukový vstup z kazetového prehrávača alebo PC pre LOAD ""' },
  { pin: 4, signal: 'MIC Alt', description: 'Alternatívny výstupný pin na vybraných revíziách dosiek zo Skalice' },
  { pin: 5, signal: 'EAR Alt', description: 'Alternatívny vstupný pin — pripojte špičku 3,5 mm jacku cez 10 kΩ rezistor' },
];

export const LOAD_STEPS = [
  {
    step: '01',
    title: 'Pripojte audio kábel do portu MG',
    text: 'Zapojte kábel 3,5 mm jack → 5-pin DIN zo slúchadlového výstupu PC (alebo nahraného magnetofónu) do zadnej zásuvky MG. Hlasitosť nastavte na 75–85 % bez ekvalizéra.',
  },
  {
    step: '02',
    title: 'Napíšte LOAD "" na Didaktiku M',
    text: 'Stlačte kláves J (napíše LOAD), podržte SYMBOL SHIFT a dvakrát stlačte P (napíše ""), potom stlačte ENTER. Okraj obrazovky sa zmení a počítač čaká na signál.',
  },
  {
    step: '03',
    title: 'Spustite kazetu alebo prehrávanie z PC',
    text: 'Stlačte Play na magnetofóne alebo kliknite na Prehrať zvuk kazety v tomto štúdiu. Objavia sa červeno-azúrové pruhy pilotného tónu a následne modro-žlté dátové pruhy. Hra sa sama spustí od riadku 10.',
  },
];
