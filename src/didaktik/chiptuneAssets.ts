/**
 * Authentic 1-Bit Didaktik M / ZX Spectrum 48K Chiptune SFX & Melody Bank.
 *
 * Every sound is defined purely as ultra-compact (duration, semitone) steps
 * compatible with Sinclair BASIC `BEEP d, p` and ZX Spectrum ROM `BEEPER` ($03B5),
 * requiring zero sample RAM and just 10-48 bytes of program memory per effect.
 */

export type SfxCategory = 'microdent' | 'teatro' | 'arcade' | 'christmas';

export interface BeeperStep {
  /** Duration in seconds (e.g. 0.05) */
  duration: number;
  /** Sinclair BASIC BEEP pitch: semitones relative to Middle C (C4 = 0, A4 = 9, C5 = 12). Use null for silence/rest. */
  semitone: number | null;
}

export interface DidaktikChiptuneAsset {
  id: string;
  name: string;
  category: SfxCategory;
  description: string;
  steps: BeeperStep[];
  /** Approximate Z80 ROM table size in bytes (4 bytes per note: HL pitch + DE duration) */
  z80Bytes: number;
}

export function semitoneToFrequency(semitone: number): number {
  return 261.625565 * Math.pow(2, semitone / 12);
}

export function getChiptuneTotalDuration(asset: DidaktikChiptuneAsset): number {
  return asset.steps.reduce((acc, s) => acc + s.duration, 0);
}

/**
 * Formats a chiptune sound effect into copy-pasteable Sinclair BASIC `BEEP` code.
 */
export function formatSfxAsBasic(asset: DidaktikChiptuneAsset, startLine = 500): string {
  const parts: string[] = [];
  for (const s of asset.steps) {
    if (s.semitone === null) {
      const frames = Math.max(1, Math.round(s.duration * 50));
      parts.push(`PAUSE ${frames}`);
    } else {
      const durStr = s.duration.toFixed(2).replace(/^0/, '');
      parts.push(`BEEP ${durStr},${s.semitone}`);
    }
  }
  return `${startLine} REM ${asset.name.toUpperCase()}\n${startLine + 10} ${parts.join(': ')}`;
}

/**
 * Formats a chiptune sound effect into a compact Z80 Assembly table
 * targeting the Didaktik M / ZX Spectrum 48K ROM BEEPER routine ($03B5).
 */
export function formatSfxAsZ80(asset: DidaktikChiptuneAsset): string {
  // ZX ROM BEEPER formula (3.5MHz baseline): HL = (437500 / freq) - 30.125, DE = freq * duration
  const label = `SFX_${asset.id.toUpperCase()}`;
  const lines: string[] = [
    `; ${asset.name} — Didaktik M 1-Bit ROM BEEPER ($03B5)`,
    `; Memory: ${asset.steps.length * 4 + 2} bytes (DW pitch_HL, duration_DE; $0000 terminator)`,
    `${label}:`,
  ];

  for (const s of asset.steps) {
    if (s.semitone === null) {
      lines.push(`    ; Rest ${(s.duration * 1000).toFixed(0)}ms`);
      continue;
    }
    const freq = semitoneToFrequency(s.semitone);
    const hl = Math.max(1, Math.round(437500 / freq - 30.125));
    const de = Math.max(1, Math.round(freq * s.duration));
    lines.push(
      `    DEFW $${hl.toString(16).toUpperCase().padStart(4, '0')}, $${de
        .toString(16)
        .toUpperCase()
        .padStart(4, '0')} ; ${Math.round(freq)}Hz, ${Math.round(s.duration * 1000)}ms`
    );
  }
  lines.push('    DEFW $0000 ; End of sequence');
  return lines.join('\n');
}

/**
 * Synthesizes an authentic 1-bit square-wave 44.1 kHz Mono 16-bit PCM .WAV file
 * matching the Didaktik M piezo speaker timbre.
 */
export function encodeChiptuneToWav(
  asset: DidaktikChiptuneAsset,
  sampleRate = 44100
): Uint8Array {
  const totalSec = getChiptuneTotalDuration(asset) + 0.08;
  const numSamples = Math.max(1, Math.ceil(totalSec * sampleRate));
  const dataByteLen = numSamples * 2;
  const wav = new Uint8Array(44 + dataByteLen);
  const view = new DataView(wav.buffer);

  const writeAscii = (pos: number, text: string) => {
    for (let i = 0; i < text.length; i++) wav[pos + i] = text.charCodeAt(i);
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLen, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataByteLen, true);

  let sampleIdx = 0;
  const amp = 14000; // Clean loud 1-bit square wave with headroom

  for (const step of asset.steps) {
    const stepSamples = Math.floor(step.duration * sampleRate);
    if (step.semitone === null) {
      sampleIdx += stepSamples;
      continue;
    }
    const freq = semitoneToFrequency(step.semitone);
    const halfPeriod = sampleRate / (freq * 2);
    for (let i = 0; i < stepSamples && sampleIdx < numSamples; i++) {
      // Crisp 1-bit square pulse with tiny 2ms edge taper to avoid speaker click
      const edgeEnv = Math.min(1, i / 40, (stepSamples - i) / 40);
      const val = Math.floor(i / halfPeriod) % 2 === 0 ? amp : -amp;
      view.setInt16(44 + sampleIdx * 2, Math.round(val * edgeEnv), true);
      sampleIdx++;
    }
  }

  return wav;
}

export const DIDAKTIK_CHIPTUNE_PACK: DidaktikChiptuneAsset[] = [
  {
    id: 'microdent_laser',
    name: 'Mikroskopický laser',
    category: 'microdent',
    description: 'Presný zubný laserový impulz inšpirovaný microDENT.sk',
    steps: [
      { duration: 0.025, semitone: 26 },
      { duration: 0.025, semitone: 21 },
      { duration: 0.03, semitone: 15 },
      { duration: 0.035, semitone: 9 },
    ],
    z80Bytes: 18,
  },
  {
    id: 'tooth_polish',
    name: 'Zablýskanie zúbka',
    category: 'microdent',
    description: 'Čistý trojzvuk po vyliečení kazu a vyleštení skloviny',
    steps: [
      { duration: 0.05, semitone: 12 },
      { duration: 0.05, semitone: 16 },
      { duration: 0.06, semitone: 19 },
      { duration: 0.11, semitone: 24 },
    ],
    z80Bytes: 18,
  },
  {
    id: 'cerec_crown',
    name: 'Zlatá korunka CEREC',
    category: 'microdent',
    description: 'Jasný 1-bitový bonusový akord pri získaní korunky',
    steps: [
      { duration: 0.045, semitone: 19 },
      { duration: 0.045, semitone: 23 },
      { duration: 0.045, semitone: 26 },
      { duration: 0.12, semitone: 31 },
    ],
    z80Bytes: 18,
  },
  {
    id: 'fiber_sync',
    name: 'Synchronizácia optiky',
    category: 'teatro',
    description: 'Rýchly dvojtónový optický signál pre uzly TeatrO.eu',
    steps: [
      { duration: 0.03, semitone: 17 },
      { duration: 0.03, semitone: 24 },
      { duration: 0.03, semitone: 17 },
      { duration: 0.07, semitone: 29 },
    ],
    z80Bytes: 18,
  },
  {
    id: 'iptv_lock',
    name: 'Zvučka TeatrO IPTV',
    category: 'teatro',
    description: 'Čistá televízna zvučka pri prepojení vianočného vysielania',
    steps: [
      { duration: 0.08, semitone: 7 },
      { duration: 0.08, semitone: 12 },
      { duration: 0.08, semitone: 16 },
      { duration: 0.22, semitone: 19 },
    ],
    z80Bytes: 18,
  },
  {
    id: 'signal_alert',
    name: 'Výstraha výpadu',
    category: 'teatro',
    description: 'Stúpajúci varovný tón pred útokom nepriateľa',
    steps: [
      { duration: 0.04, semitone: 14 },
      { duration: 0.02, semitone: null },
      { duration: 0.05, semitone: 20 },
    ],
    z80Bytes: 12,
  },
  {
    id: 'enemy_ko',
    name: 'Zneškodnenie nepriateľa',
    category: 'arcade',
    description: 'Klesajúci 1-bitový retro efekt pri porážke povlaku či šumu',
    steps: [
      { duration: 0.03, semitone: 10 },
      { duration: 0.03, semitone: 4 },
      { duration: 0.04, semitone: -2 },
      { duration: 0.07, semitone: -9 },
    ],
    z80Bytes: 18,
  },
  {
    id: 'didaktik_key',
    name: 'Klik klávesu Didaktik M',
    category: 'arcade',
    description: 'Autentické piezo pípnutie klávesnice z ROM Didaktik Skalica',
    steps: [{ duration: 0.018, semitone: 22 }],
    z80Bytes: 6,
  },
  {
    id: 'xmas_jingle',
    name: 'Vianočné rolničky (Víťazstvo)',
    category: 'christmas',
    description: 'Klasická 1-bitová štedrovečerná fanfára pre Didaktik M',
    steps: [
      { duration: 0.13, semitone: 16 },
      { duration: 0.02, semitone: null },
      { duration: 0.13, semitone: 16 },
      { duration: 0.02, semitone: null },
      { duration: 0.28, semitone: 16 },
      { duration: 0.04, semitone: null },
      { duration: 0.13, semitone: 16 },
      { duration: 0.02, semitone: null },
      { duration: 0.13, semitone: 16 },
      { duration: 0.02, semitone: null },
      { duration: 0.28, semitone: 16 },
      { duration: 0.04, semitone: null },
      { duration: 0.13, semitone: 16 },
      { duration: 0.13, semitone: 19 },
      { duration: 0.17, semitone: 12 },
      { duration: 0.11, semitone: 14 },
      { duration: 0.36, semitone: 16 },
    ],
    z80Bytes: 46,
  },
  {
    id: 'ticha_noc',
    name: 'Tichá noc (Úvodná melódia)',
    category: 'christmas',
    description: 'Nostalgická 1-bitová slovenská koleda na úvodnú obrazovku',
    steps: [
      { duration: 0.26, semitone: 7 },
      { duration: 0.1, semitone: 9 },
      { duration: 0.18, semitone: 7 },
      { duration: 0.42, semitone: 4 },
      { duration: 0.06, semitone: null },
      { duration: 0.26, semitone: 7 },
      { duration: 0.1, semitone: 9 },
      { duration: 0.18, semitone: 7 },
      { duration: 0.44, semitone: 4 },
    ],
    z80Bytes: 34,
  },
  {
    id: 'jingle_bell',
    name: 'Zvonček Vianoce',
    category: 'christmas',
    description: 'Autentický 1-bit ZX Spectrum zvonek efekt pre vianočné bonusy a odovzdanie plakety',
    steps: [
      { duration: 0.04, semitone: 24 },  // C6 — ding
      { duration: 0.02, semitone: null }, // mezera
      { duration: 0.04, semitone: 28 },  // E6
      { duration: 0.02, semitone: null },
      { duration: 0.04, semitone: 31 },  // G6
      { duration: 0.02, semitone: null },
      { duration: 0.08, semitone: 36 },  // C7 — zvonček
      { duration: 0.04, semitone: null },
      { duration: 0.04, semitone: 31 },  // G6 — ozvena
      { duration: 0.06, semitone: 28 },  // E6
    ],
    z80Bytes: 42,
  },
  {
    id: 'vianoce_fanfare',
    name: 'Vianočná fanfára MVP',
    category: 'christmas',
    description: '4-nótová vianočná trubka-fanfára pre odovzdanie pamätnej plakety Radovi Ceglédymu',
    steps: [
      { duration: 0.08, semitone: 12 }, // C5
      { duration: 0.08, semitone: 16 }, // E5
      { duration: 0.08, semitone: 19 }, // G5
      { duration: 0.04, semitone: null },
      { duration: 0.12, semitone: 24 }, // C6 — víťazný tón
      { duration: 0.06, semitone: null },
      { duration: 0.08, semitone: 19 }, // G5
      { duration: 0.08, semitone: 24 }, // C6
      { duration: 0.08, semitone: 28 }, // E6
      { duration: 0.20, semitone: 31 }, // G6 — grand finale
    ],
    z80Bytes: 42,
  },
];
